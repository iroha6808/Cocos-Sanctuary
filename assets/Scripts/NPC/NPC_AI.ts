import BaseEntity from "../Core/BaseEntity";
import EventCenter from "../Core/EventCenter";
import { EntityType, GameEvent } from "../Core/Constants";
import CombatHitbox, { CombatFaction } from "../Attack/CombatHitbox";

const { ccclass, property } = cc._decorator;

export enum NPCAttackType {
    NONE = 0,
    MELEE = 1
}

enum NPCFacing {
    FRONT = "front",
    RIGHT = "right",
    BACK = "back"
}

cc.Enum(NPCAttackType);

@ccclass
export default class NPC_AI extends BaseEntity {

    @property(cc.Node)
    public targetPlayer: cc.Node = null;

    @property(cc.Boolean)
    public autoFindTarget: boolean = true;

    @property
    public targetNodeName: string = "Player";

    @property(cc.Boolean)
    public debugLog: boolean = false;

    @property(cc.Boolean)
    public showHpBar: boolean = true;

    @property(cc.ProgressBar)
    public hpBar: cc.ProgressBar = null;

    @property(cc.Float)
    public detectRadius: number = 300;

    @property(cc.Float)
    public attackRange: number = 60;

    @property(cc.Float)
    public attackDamage: number = 10;

    @property(cc.Float)
    public attackCooldown: number = 1;

    @property(cc.Float)
    public moveSpeed: number = 80;

    @property({ type: cc.Enum(NPCAttackType) })
    public attackType: NPCAttackType = NPCAttackType.MELEE;

    @property(cc.Boolean)
    public chaseTarget: boolean = true;

    @property(cc.Float)
    public attackAnimLockTime: number = 0.35;

    @property(cc.Float)
    public damagedAnimLockTime: number = 0.2;

    @property(cc.Float)
    public jumpForce: number = 360;

    @property(cc.Float)
    public jumpCooldown: number = 0.8;

    @property(cc.Float)
    public stuckCheckTime: number = 0.25;

    @property(cc.Float)
    public minMoveDeltaX: number = 1;

    @property(cc.Float)
    public groundCheckVelocityY: number = 0.1;

    @property(CombatHitbox)
    public attackHitbox: CombatHitbox = null;

    private isEnraged: boolean = false;
    private isDead: boolean = false;
    private isAttacking: boolean = false;
    private isHurting: boolean = false;
    private attackTimer: number = 0;
    private jumpTimer: number = 0;
    private actionLockTimer: number = 0;
    private stuckTimer: number = 0;
    private lastX: number = 0;
    private bodyNode: cc.Node = null;
    private anim: cc.Animation = null;
    private rb: cc.RigidBody = null;
    private currentAnimName: string = "";
    private facing: NPCFacing = NPCFacing.FRONT;
    private hasWarnedNoTarget: boolean = false;
    private hasWarnedPeace: boolean = false;
    private debugTimer: number = 0;
    private warnedMissingClips: { [name: string]: boolean } = {};

    onLoad() {
        super.onLoad();

        this.bodyNode = this.node.getChildByName("Sprite_Body");
        this.anim = (this.bodyNode || this.node).getComponent(cc.Animation);
        if (this.anim) {
            this.anim.on("finished", this.onAnimFinished, this);
        }

        this.rb = this.getComponent(cc.RigidBody);
        this.lastX = this.node.x;

        if (!this.attackHitbox) {
            const hitboxNode = this.node.getChildByName("AttackHitbox");
            this.attackHitbox = hitboxNode ? hitboxNode.getComponent(CombatHitbox) : null;
        }

        if (this.attackHitbox) {
            this.setupAttackHitbox();
        }

        if (!this.hpBar) {
            const hpBarNode = this.node.getChildByName("HpBar") || this.node.getChildByName("HPBar");
            this.hpBar = hpBarNode ? hpBarNode.getComponent(cc.ProgressBar) : null;
        }

        this.updateHpBar();
        this.playStateAnimation("idle");
    }

    start() {
        if (!this.targetPlayer && this.autoFindTarget) {
            this.targetPlayer = this.findNodeByName(cc.director.getScene(), this.targetNodeName);
        }

        if (this.debugLog) {
            cc.log(`[NPC_AI] ${this.node.name} target=${this.targetPlayer ? this.targetPlayer.name : "null"}, type=${this.type}`);
        }
    }

    public setTarget(playerNode: cc.Node) {
        this.targetPlayer = playerNode;
    }

    update(dt: number) {
        if (this.isDead) return;

        this.updateTimers(dt);
        this.updateDebugLog(dt);

        if (!this.canAct()) {
            this.stopHorizontalMove();
            this.playStateAnimation("idle");
            return;
        }

        if (this.isAttacking || this.isHurting) {
            this.stopHorizontalMove();
            return;
        }

        const distance = this.getTargetDistance();
        if (distance > this.detectRadius) {
            this.stopHorizontalMove();
            this.playStateAnimation("idle");
            return;
        }

        const direction = this.getTargetPositionInParent().sub(this.node.position);
        this.updateFacing(direction);

        if (distance <= this.attackRange) {
            this.stopHorizontalMove();
            if (this.attackTimer <= 0) {
                this.attackTarget();
            } else {
                this.playStateAnimation("idle");
            }
            return;
        }

        if (this.chaseTarget) {
            this.moveTowardTarget(direction, dt);
            return;
        }

        this.stopHorizontalMove();
        this.playStateAnimation("idle");
    }

    public onMocked(playerNode: cc.Node) {
        if (this.type !== EntityType.NPC_NEUTRAL) {
            return;
        }

        this.isEnraged = true;
        this.targetPlayer = playerNode;
        EventCenter.emit(GameEvent.NPC_MOCKED, this.node, playerNode);
    }

    public receiveAttack(amount: number, attackerNode: cc.Node = null) {
        if (attackerNode && cc.isValid(attackerNode)) {
            this.targetPlayer = attackerNode;
        }

        this.takeDamage(amount);
    }

    public takeDamage(amount: number) {
        if (this.isDead || amount <= 0) {
            return;
        }

        this.currentHp = Math.max(0, this.currentHp - amount);
        this.updateHpBar();

        if (this.debugLog) {
            cc.log(`[NPC_AI] receiveAttack damage=${amount} hp=${this.currentHp}/${this.maxHp}`);
        }

        if (this.currentHp <= 0) {
            this.die();
            return;
        }

        this.onDamaged();
    }

    protected onDamaged() {
        if (this.type === EntityType.NPC_NEUTRAL) {
            this.isEnraged = true;
        }

        this.isHurting = true;
        this.isAttacking = false;
        this.actionLockTimer = this.damagedAnimLockTime;
        this.stopHorizontalMove();
        this.playStateAnimation("damaged", true);

        this.scheduleOnce(() => {
            this.isHurting = false;
            this.currentAnimName = "";
        }, this.damagedAnimLockTime);
    }

    protected die() {
        if (this.isDead) {
            return;
        }

        this.isDead = true;
        this.isHurting = false;
        this.isAttacking = false;
        this.hideHpBar();
        this.stopHorizontalMove();
        this.playAnimation("death", true);
        EventCenter.emit(GameEvent.NPC_DIED, this.node, this.type);

        this.scheduleOnce(() => {
            if (cc.isValid(this.node)) {
                this.node.destroy();
            }
        }, Math.max(this.getAnimationDuration("death"), 0.1));
    }

    onDestroy() {
        if (this.anim && cc.isValid(this.anim)) {
            this.anim.off("finished", this.onAnimFinished, this);
        }
    }

    private updateTimers(dt: number) {
        this.attackTimer = Math.max(0, this.attackTimer - dt);
        this.actionLockTimer = Math.max(0, this.actionLockTimer - dt);
        this.jumpTimer = Math.max(0, this.jumpTimer - dt);
    }

    private updateDebugLog(dt: number) {
        if (!this.debugLog) {
            return;
        }

        this.debugTimer += dt;
        if (this.debugTimer < 1) {
            return;
        }

        this.debugTimer = 0;
        const hasTarget = this.targetPlayer && cc.isValid(this.targetPlayer);
        const targetName = hasTarget ? this.targetPlayer.name : "null";
        const distance = hasTarget ? this.getTargetDistance().toFixed(1) : "n/a";
        const velocity = this.rb ? `(${this.rb.linearVelocity.x.toFixed(1)}, ${this.rb.linearVelocity.y.toFixed(1)})` : "no-rigidbody";
        cc.log(`[NPC_AI] state target=${targetName}, type=${this.type}, distance=${distance}, velocity=${velocity}, attacking=${this.isAttacking}, hurting=${this.isHurting}`);
    }

    private canAct() {
        if (this.type === EntityType.NPC_PEACE) {
            if (this.debugLog && !this.hasWarnedPeace) {
                cc.log(`[NPC_AI] ${this.node.name} is NPC_PEACE, so it will not move or attack.`);
                this.hasWarnedPeace = true;
            }
            return false;
        }

        if (!this.targetPlayer || !cc.isValid(this.targetPlayer)) {
            if (this.debugLog && !this.hasWarnedNoTarget) {
                cc.log(`[NPC_AI] ${this.node.name} has no targetPlayer. Drag Player into targetPlayer or keep autoFindTarget enabled.`);
                this.hasWarnedNoTarget = true;
            }
            return false;
        }

        if (this.type === EntityType.NPC_NEUTRAL && !this.isEnraged) {
            return false;
        }

        return true;
    }

    private moveTowardTarget(direction: cc.Vec2 | cc.Vec3, dt: number) {
        if (!direction || Math.abs(direction.x) <= 0.01) {
            this.stopHorizontalMove();
            this.playStateAnimation("idle");
            return;
        }

        const targetSpeedX = direction.x > 0 ? this.moveSpeed : -this.moveSpeed;

        if (this.rb) {
            this.rb.linearVelocity = cc.v2(targetSpeedX, this.rb.linearVelocity.y);
        } else {
            this.node.x += targetSpeedX * dt;
        }

        this.tryJumpWhenStuck(dt);
        this.playStateAnimation("move");
    }

    private tryJumpWhenStuck(dt: number) {
        if (!this.rb || this.jumpTimer > 0 || !this.isGrounded()) {
            this.lastX = this.node.x;
            return;
        }

        const movedX = Math.abs(this.node.x - this.lastX);
        this.stuckTimer = movedX < this.minMoveDeltaX ? this.stuckTimer + dt : 0;
        this.lastX = this.node.x;

        if (this.stuckTimer < this.stuckCheckTime) {
            return;
        }

        this.rb.linearVelocity = cc.v2(this.rb.linearVelocity.x, this.jumpForce);
        this.jumpTimer = this.jumpCooldown;
        this.stuckTimer = 0;

        if (this.debugLog) {
            cc.log("[NPC_AI] jump: obstacle/stuck detected");
        }
    }

    private attackTarget() {
        if (this.attackType === NPCAttackType.NONE || this.attackTimer > 0) {
            return;
        }

        this.isAttacking = true;
        this.isHurting = false;
        this.actionLockTimer = this.attackAnimLockTime;
        this.playStateAnimation("attack", true);

        if (this.attackHitbox) {
            const facingRight = !this.bodyNode || this.bodyNode.scaleX >= 0;
            this.attackHitbox.activate(facingRight, this.attackDamage, this.node);
        } else if (this.debugLog) {
            cc.log(`[NPC_AI] ${this.node.name} has no AttackHitbox component.`);
        }

        if (this.debugLog) {
            cc.log(`[NPC_AI] attack started: ${this.currentAnimName}`);
        }

        this.attackTimer = this.attackCooldown;

        this.scheduleOnce(() => {
            this.isAttacking = false;
            this.currentAnimName = "";
        }, this.attackAnimLockTime);
    }

    private setupAttackHitbox() {
        this.attackHitbox.ownerFaction = this.getCombatFaction();
        this.attackHitbox.canHitPlayer = true;
        this.attackHitbox.canHitPeaceNpc = false;
        this.attackHitbox.canHitNeutralNpc = false;
        this.attackHitbox.canHitHostileNpc = false;
    }

    private getCombatFaction(): CombatFaction {
        switch (this.type) {
            case EntityType.NPC_PEACE:
                return CombatFaction.PEACE_NPC;
            case EntityType.NPC_NEUTRAL:
                return CombatFaction.NEUTRAL_NPC;
            case EntityType.NPC_HOSTILE:
                return CombatFaction.HOSTILE_NPC;
            default:
                return CombatFaction.NONE;
        }
    }

    private stopHorizontalMove() {
        if (this.rb) {
            this.rb.linearVelocity = cc.v2(0, this.rb.linearVelocity.y);
        }
    }

    private isGrounded() {
        return !this.rb || Math.abs(this.rb.linearVelocity.y) <= this.groundCheckVelocityY;
    }

    private updateFacing(direction: cc.Vec2 | cc.Vec3) {
        if (!direction || (direction.x === 0 && direction.y === 0)) {
            return;
        }

        const spriteNode = this.bodyNode || this.node;
        if (Math.abs(direction.x) > 1) {
            this.facing = NPCFacing.RIGHT;
            spriteNode.scaleX = direction.x >= 0 ? 1 : -1;
            return;
        }

        spriteNode.scaleX = 1;
        this.facing = direction.y > 0 ? NPCFacing.BACK : NPCFacing.FRONT;
    }

    private getTargetDistance() {
        const delta = this.getTargetWorldPosition().sub(this.getNodeWorldPosition());
        return Math.abs(delta.x);
    }

    private getNodeWorldPosition() {
        return this.node.parent
            ? this.node.parent.convertToWorldSpaceAR(this.node.position)
            : this.node.position;
    }

    private getTargetWorldPosition() {
        return this.targetPlayer.parent
            ? this.targetPlayer.parent.convertToWorldSpaceAR(this.targetPlayer.position)
            : this.targetPlayer.position;
    }

    private getTargetPositionInParent() {
        const targetWorldPosition = this.getTargetWorldPosition();
        return this.node.parent
            ? this.node.parent.convertToNodeSpaceAR(targetWorldPosition)
            : targetWorldPosition;
    }

    private findNodeByName(root: cc.Node, nodeName: string): cc.Node {
        if (!root || !nodeName) {
            return null;
        }

        if (root.name === nodeName) {
            return root;
        }

        for (const child of root.children) {
            const result = this.findNodeByName(child, nodeName);
            if (result) {
                return result;
            }
        }

        return null;
    }

    private playStateAnimation(stateName: string, force: boolean = false) {
        if (this.actionLockTimer > 0 && !force) {
            return;
        }

        this.playAnimation(this.getDirectionalAnimationName(stateName), force);
    }

    private getDirectionalAnimationName(stateName: string) {
        return `${stateName}_${this.facing}`;
    }

    private playAnimation(animName: string, force: boolean = false) {
        if (!this.anim || !animName) {
            return;
        }

        if (!this.hasAnimation(animName)) {
            if (this.debugLog && !this.warnedMissingClips[animName]) {
                cc.log(`[NPC_AI] missing animation clip: ${animName}`);
                this.warnedMissingClips[animName] = true;
            }
            return;
        }

        if (!force && this.currentAnimName === animName) {
            return;
        }

        this.anim.play(animName);
        this.currentAnimName = animName;
    }

    private hasAnimation(animName: string) {
        return !!(this.anim && this.anim.getAnimationState(animName));
    }

    private getAnimationDuration(animName: string) {
        if (!this.anim) {
            return 0;
        }

        const state = this.anim.getAnimationState(animName);
        return state ? state.duration : 0;
    }

    private onAnimFinished(event: string, state: cc.AnimationState) {
        if (!state || !state.name) {
            return;
        }

        if (state.name.indexOf("attack_") === 0) {
            this.isAttacking = false;
            this.currentAnimName = "";
            return;
        }

        if (state.name.indexOf("damaged_") === 0) {
            this.isHurting = false;
            this.currentAnimName = "";
            return;
        }

        if (state.name === "death") {
            this.currentAnimName = "";
        }
    }

    private updateHpBar() {
        if (!this.hpBar) {
            return;
        }

        this.hpBar.node.active = this.showHpBar;
        this.hpBar.progress = this.maxHp > 0 ? this.currentHp / this.maxHp : 0;
    }

    private hideHpBar() {
        if (this.hpBar) {
            this.hpBar.node.active = false;
        }
    }
}

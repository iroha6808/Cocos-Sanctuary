import BaseEntity from "../Core/BaseEntity";
import EventCenter from "../Core/EventCenter";
import { EntityType, GameEvent } from "../Core/Constants";

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

    private isEnraged: boolean = false;
    private isDead: boolean = false;
    private attackTimer: number = 0;
    private actionLockTimer: number = 0;
    private bodyNode: cc.Node = null;
    private anim: cc.Animation = null;
    private currentAnimName: string = "";
    private facing: NPCFacing = NPCFacing.FRONT;
    private hasWarnedNoTarget: boolean = false;
    private hasWarnedPeace: boolean = false;

    onLoad() {
        super.onLoad();
        this.bodyNode = this.node.getChildByName("Sprite_Body");
        this.anim = (this.bodyNode || this.node).getComponent(cc.Animation);
        this.playStateAnimation("idle");
    }

    start() {
        if (!this.targetPlayer && this.autoFindTarget) {
            this.targetPlayer = this.findNodeByName(cc.director.getScene(), this.targetNodeName);
        }

        if (this.debugLog) {
            cc.log(`[NPC_AI] ${this.node.name} target = ${this.targetPlayer ? this.targetPlayer.name : "null"}, type = ${this.type}`);
        }
    }

    public setTarget(playerNode: cc.Node) {
        this.targetPlayer = playerNode;
    }

    update(dt: number) {
        if (this.isDead) return;

        this.updateAttackTimer(dt);
        this.updateActionLockTimer(dt);

        if (!this.canAct()) {
            this.playStateAnimation("idle");
            return;
        }

        const distance = this.getTargetDistance();
        if (distance > this.detectRadius) {
            this.playStateAnimation("idle");
            return;
        }

        if (distance <= this.attackRange) {
            this.updateFacing(this.getTargetPositionInParent().sub(this.node.position));
            if (this.attackTimer <= 0) {
                this.attackTarget();
            } else {
                this.playStateAnimation("idle");
            }
            return;
        }

        if (this.chaseTarget) {
            this.moveTowardTarget(dt);
            return;
        }

        this.updateFacing(this.getTargetPositionInParent().sub(this.node.position));
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

    public takeDamage(amount: number) {
        if (this.isDead || amount <= 0) {
            return;
        }

        this.currentHp = Math.max(0, this.currentHp - amount);
        this.onDamaged();

        if (this.currentHp <= 0) {
            this.die();
        }
    }

    protected onDamaged() {
        if (this.type === EntityType.NPC_NEUTRAL) {
            this.isEnraged = true;
        }

        this.playStateAnimation("damaged", true);
        this.actionLockTimer = this.damagedAnimLockTime;
    }

    protected die() {
        if (this.isDead) {
            return;
        }

        this.isDead = true;
        this.playAnimation("death", true);
        EventCenter.emit(GameEvent.NPC_DIED, this.node, this.type);
        this.scheduleOnce(() => {
            if (cc.isValid(this.node)) {
                this.node.destroy();
            }
        }, this.getAnimationDuration("death"));
    }

    private updateAttackTimer(dt: number) {
        if (this.attackTimer <= 0) {
            return;
        }

        this.attackTimer = Math.max(0, this.attackTimer - dt);
    }

    private updateActionLockTimer(dt: number) {
        if (this.actionLockTimer <= 0) {
            return;
        }

        this.actionLockTimer = Math.max(0, this.actionLockTimer - dt);
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

    private getTargetDistance() {
        return this.getTargetWorldPosition().sub(this.getNodeWorldPosition()).mag();
    }

    private moveTowardTarget(dt: number) {
        const direction = this.getTargetPositionInParent().sub(this.node.position);
        if (direction.mag() === 0) {
            return;
        }

        this.updateFacing(direction);
        const velocity = direction.normalize().mul(this.moveSpeed * dt);
        this.node.x += velocity.x;
        this.node.y += velocity.y;
        this.playStateAnimation("move");
    }

    private updateFacing(direction: cc.Vec2 | cc.Vec3) {
        if (!direction || (direction.x === 0 && direction.y === 0)) {
            return;
        }

        const spriteNode = this.bodyNode || this.node;
        if (Math.abs(direction.x) > Math.abs(direction.y)) {
            this.facing = NPCFacing.RIGHT;
            spriteNode.scaleX = direction.x >= 0 ? 1 : -1;
            return;
        }

        spriteNode.scaleX = 1;
        this.facing = direction.y > 0 ? NPCFacing.BACK : NPCFacing.FRONT;
    }

    private attackTarget() {
        if (this.attackType === NPCAttackType.NONE || this.attackTimer > 0) {
            return;
        }

        const targetEntity = this.targetPlayer.getComponent(BaseEntity);
        if (!targetEntity) {
            return;
        }

        this.playStateAnimation("attack", true);
        this.actionLockTimer = this.attackAnimLockTime;
        targetEntity.takeDamage(this.attackDamage);
        this.attackTimer = this.attackCooldown;
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

        if (!force && this.currentAnimName === animName) {
            return;
        }

        this.anim.play(animName);
        this.currentAnimName = animName;
    }

    private getAnimationDuration(animName: string) {
        if (!this.anim) {
            return 0;
        }

        const state = this.anim.getAnimationState(animName);
        return state ? state.duration : 0;
    }
}

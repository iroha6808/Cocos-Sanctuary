import BaseEntity from "../Core/BaseEntity";
import EventCenter from "../Core/EventCenter";
import { EntityType, GameEvent } from "../Core/Constants";
import CombatHitbox, { CombatFaction, CombatHitInfo } from "../Attack/CombatHitbox";
import CombatProjectile from "../Attack/CombatProjectile";
import NPCPathAgent from "./NPCPathAgent";
import PhysicsContactFilter from "../Core/PhysicsContactFilter";
import { PhysicsTag } from "../Core/PhysicsTags";

const { ccclass, property } = cc._decorator;

export enum NPCAttackType {
    NONE = 0,
    MELEE = 1,
    RANGED = 2
}

export enum ProjectileAimMode {
    FIXED_FLIGHT_TIME = 0,
    HORIZONTAL_SPEED = 1
}

export enum NPCMoveMode {
    NONE = 0,
    CHASE_TARGET = 1,
    WANDER = 2
}

enum NPCFacing {
    FRONT = "front",
    RIGHT = "right",
    BACK = "back"
}

cc.Enum(NPCAttackType);
cc.Enum(ProjectileAimMode);
cc.Enum(NPCMoveMode);

@ccclass("NPCDropEntry")
export class NPCDropEntry {

    @property(cc.Prefab)
    public prefab: cc.Prefab = null;

    @property
    public itemName: string = "Item";

    @property(cc.Integer)
    public minAmount: number = 1;

    @property(cc.Integer)
    public maxAmount: number = 1;

    @property({ type: cc.Float, range: [0, 1, 0.01], slide: true })
    public dropChance: number = 1;
}

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

    @property({ type: cc.Enum(NPCMoveMode) })
    public moveMode: NPCMoveMode = NPCMoveMode.CHASE_TARGET;

    @property(cc.Float)
    public wanderMoveSpeed: number = 40;

    @property(cc.Float)
    public minWanderMoveTime: number = 1.5;

    @property(cc.Float)
    public maxWanderMoveTime: number = 4;

    @property(cc.Float)
    public minWanderIdleTime: number = 1;

    @property(cc.Float)
    public maxWanderIdleTime: number = 3;

    @property(cc.Float)
    public interactDistance: number = 90;

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

    @property(cc.Prefab)
    public projectilePrefab: cc.Prefab = null;

    @property(cc.Node)
    public projectileSpawnNode: cc.Node = null;

    @property(cc.Node)
    public projectileParent: cc.Node = null;

    @property(cc.Float)
    public projectileSpawnDelay: number = 0.35;

    @property({ type: cc.Enum(ProjectileAimMode) })
    public projectileAimMode: ProjectileAimMode = ProjectileAimMode.HORIZONTAL_SPEED;

    @property(cc.Float)
    public projectileSpeed: number = 300;

    @property(cc.Float)
    public projectileFlightTime: number = 0.8;

    @property(cc.Float)
    public projectileMinFlightTime: number = 0.35;

    @property(cc.Float)
    public projectileMaxFlightTime: number = 1.25;

    @property(cc.Float)
    public projectileTargetOffsetY: number = 12;

    @property(cc.Float)
    public projectileKnockbackX: number = 180;

    @property(cc.Float)
    public projectileKnockbackY: number = 100;

    @property([NPCDropEntry])
    public dropTable: NPCDropEntry[] = [];

    @property(cc.Float)
    public dropSpawnOffsetY: number = 32;

    @property(cc.Boolean)
    public debugDropLog: boolean = false;

    @property({ type: cc.Float, range: [0, 1, 0.05], slide: true })
    public knockbackResistance: number = 0;

    @property(cc.Float)
    public knockbackLockTime: number = 0.12;

    protected isTalking: boolean = false;
    protected isTrading: boolean = false;
    protected isMovementPaused: boolean = false;

    private isEnraged: boolean = false;
    private isDead: boolean = false;
    private isAttacking: boolean = false;
    private isHurting: boolean = false;
    private attackTimer: number = 0;
    private jumpTimer: number = 0;
    private actionLockTimer: number = 0;
    private stuckTimer: number = 0;
    private lastX: number = 0;
    private wanderTimer: number = 0;
    private wanderDirection: number = 0;
    private bodyNode: cc.Node = null;
    private anim: cc.Animation = null;
    private rb: cc.RigidBody = null;
    private currentAnimName: string = "";
    private facing: NPCFacing = NPCFacing.FRONT;
    private hasWarnedNoTarget: boolean = false;
    private hasWarnedPeace: boolean = false;
    private debugTimer: number = 0;
    private warnedMissingClips: { [name: string]: boolean } = {};
    private hasDroppedLoot: boolean = false;
    private knockbackTimer: number = 0;
    private rangedReleasePending: boolean = false;
    private baseBodyScaleX: number = 1;
    private lastProjectileFlightTime: number = 0;
    private pathAgent: NPCPathAgent = null;

    onLoad() {
        super.onLoad();

        this.bodyNode = this.node.getChildByName("Sprite_Body");
        const spriteNode = this.bodyNode || this.node;
        this.baseBodyScaleX = Math.max(0.001, Math.abs(spriteNode.scaleX));
        this.anim = (this.bodyNode || this.node).getComponent(cc.Animation);
        if (this.anim) {
            this.anim.on("finished", this.onAnimFinished, this);
        }

        this.rb = this.getComponent(cc.RigidBody);
        PhysicsContactFilter.ensureForNode(
            this.node,
            PhysicsTag.NPC_BODY,
            this.debugLog
        );
        this.pathAgent = this.getComponent(NPCPathAgent);
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
    }

    start() {
        if (!this.targetPlayer && this.autoFindTarget) {
            this.targetPlayer = this.findNodeByName(cc.find("Canvas"), this.targetNodeName);
        }

        if (this.debugLog) {
            cc.log(`[NPC_AI] ${this.node.name} target=${this.targetPlayer ? this.targetPlayer.name : "null"}, type=${this.type}`);
        }

        // Animation states are fully initialized after onLoad.
        this.currentAnimName = "";
        this.playStateAnimation("idle", true);
    }

    public setTarget(playerNode: cc.Node) {
        this.targetPlayer = playerNode;
    }

    public pauseMovement() {
        this.isMovementPaused = true;
        this.stopMovement();
    }

    public resumeMovement() {
        this.isMovementPaused = false;
    }

    public stopMovement() {
        this.stopHorizontalMove();
        this.wanderDirection = 0;
        this.wanderTimer = 0;
        this.playStateAnimation("idle");
    }

    public isPlayerInInteractRange(player: cc.Node): boolean {
        if (!player || !cc.isValid(player)) {
            return false;
        }

        const npcWorldPos = this.getNodeWorldPosition();
        const playerWorldPos = player.parent
            ? player.parent.convertToWorldSpaceAR(player.position)
            : player.position;

        return npcWorldPos.sub(playerWorldPos).mag() <= this.interactDistance;
    }

    public beginTalk(player: cc.Node) {
        this.isTalking = true;
        this.targetPlayer = player;
        this.pauseMovement();
    }

    public endTalk() {
        this.isTalking = false;
        this.isTrading = false;
        this.resumeMovement();
    }

    public beginTrading() {
        this.isTrading = true;
        this.pauseMovement();
    }

    public endTrading() {
        this.isTrading = false;
        if (!this.isTalking) {
            this.resumeMovement();
        }
    }

    update(dt: number) {
        if (this.isDead) return;

        this.updateTimers(dt);
        this.updateDebugLog(dt);

        if (this.knockbackTimer > 0) {
            return;
        }

        if (this.isMovementPaused || this.isTalking || this.isTrading) {
            this.stopHorizontalMove();
            this.playStateAnimation("idle");
            return;
        }

        if (this.isAttacking || this.isHurting) {
            this.stopHorizontalMove();
            return;
        }

        if (this.moveMode === NPCMoveMode.NONE) {
            this.stopHorizontalMove();
            this.playStateAnimation("idle");
            return;
        }

        if (this.moveMode === NPCMoveMode.WANDER) {
            this.updateWander(dt);
            return;
        }

        if (!this.canAct()) {
            this.stopHorizontalMove();
            this.playStateAnimation("idle");
            return;
        }

        const distance = this.getTargetDistance();
        if (distance > this.detectRadius) {
            this.stopHorizontalMove();
            this.playStateAnimation("idle");
            return;
        }

        const targetWorldPosition = this.getTargetWorldPosition();
        const pathDirection = this.pathAgent
            ? this.pathAgent.getSteeringDirection(targetWorldPosition, dt)
            : null;
        const direction = pathDirection || this.getTargetPositionInParent().sub(this.node.position);
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

    public receiveAttack(amount: number, attackerNode: cc.Node = null, hitInfo?: CombatHitInfo) {
        if (attackerNode && cc.isValid(attackerNode)) {
            this.targetPlayer = attackerNode;
        }

        this.applyKnockback(attackerNode, hitInfo);
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

        this.cancelPendingRangedAttack("hurt");
        this.isHurting = true;
        this.isAttacking = false;
        const damagedLockTime = Math.max(
            this.damagedAnimLockTime,
            this.getStateAnimationDuration("damaged")
        );
        this.actionLockTimer = damagedLockTime;
        if (this.knockbackTimer <= 0) {
            this.stopHorizontalMove();
        }
        this.playStateAnimation("damaged", true);

        this.scheduleOnce(() => {
            this.isHurting = false;
            this.currentAnimName = "";
        }, damagedLockTime);
    }

    protected die() {
        if (this.isDead) {
            return;
        }

        this.isDead = true;
        this.cancelPendingRangedAttack("death");
        this.isHurting = false;
        this.isAttacking = false;
        this.hideHpBar();
        this.stopHorizontalMove();
        this.spawnDrops();
        this.playAnimation("death", true);
        EventCenter.emit(GameEvent.NPC_DIED, this.node, this.type);

        this.scheduleOnce(() => {
            if (cc.isValid(this.node)) {
                this.node.destroy();
            }
        }, Math.max(this.getAnimationDuration("death"), 0.1));
    }

    onDestroy() {
        this.unscheduleAllCallbacks();
        this.cancelPendingRangedAttack("destroyed");
        if (this.anim && cc.isValid(this.anim)) {
            this.anim.off("finished", this.onAnimFinished, this);
        }
    }

    onDisable() {
        this.cancelPendingRangedAttack("disabled");
        this.isAttacking = false;
        this.currentAnimName = "";
    }

    private spawnDrops(): void {
        if (this.hasDroppedLoot) {
            return;
        }

        this.hasDroppedLoot = true;

        if (!this.dropTable || this.dropTable.length <= 0) {
            return;
        }

        const parent = this.node.parent;
        if (!parent) {
            if (this.debugDropLog) {
                cc.warn(`[NPC_AI] ${this.node.name} cannot spawn drops without parent.`);
            }
            return;
        }

        for (const dropEntry of this.dropTable) {
            if (!dropEntry || !dropEntry.prefab) {
                if (this.debugDropLog) {
                    cc.warn(`[NPC_AI] ${this.node.name} has empty drop entry.`);
                }
                continue;
            }

            const dropChance = Math.max(0, Math.min(1, dropEntry.dropChance));
            if (Math.random() > dropChance) {
                continue;
            }

            const dropNode = cc.instantiate(dropEntry.prefab);
            dropNode.parent = parent;

            const randomOffsetX = (Math.random() - 0.5) * 24;
            dropNode.setPosition(
                this.node.x + randomOffsetX,
                this.node.y + this.dropSpawnOffsetY
            );
            PhysicsContactFilter.ensureForNode(
                dropNode,
                PhysicsTag.DROP_ITEM,
                this.debugDropLog
            );

            const dropScript = dropNode.getComponent("DropItem") as any;
            if (dropScript) {
                dropScript.itemName = dropEntry.itemName;
                dropScript.itemAmount = this.rollDropAmount(dropEntry.minAmount, dropEntry.maxAmount);
                if (dropScript.launch) {
                    dropScript.launch();
                }
            } else if (this.debugDropLog) {
                cc.warn(`[NPC_AI] spawned drop ${dropNode.name}, but it has no DropItem component.`);
            }

            if (this.debugDropLog) {
                const amount = dropScript ? dropScript.itemAmount : "n/a";
                cc.log(`[NPC_AI] ${this.node.name} dropped ${dropEntry.itemName} x${amount}`);
            }
        }
    }

    private rollDropAmount(min: number, max: number): number {
        const safeMin = Math.max(1, Math.ceil(Math.min(min, max)));
        const safeMax = Math.max(safeMin, Math.floor(Math.max(min, max)));
        return safeMin + Math.floor(Math.random() * (safeMax - safeMin + 1));
    }

    private updateTimers(dt: number) {
        this.attackTimer = Math.max(0, this.attackTimer - dt);
        this.actionLockTimer = Math.max(0, this.actionLockTimer - dt);
        this.jumpTimer = Math.max(0, this.jumpTimer - dt);
        this.knockbackTimer = Math.max(0, this.knockbackTimer - dt);
    }

    private applyKnockback(attackerNode: cc.Node, hitInfo?: CombatHitInfo): void {
        if (!this.rb || !attackerNode || !cc.isValid(attackerNode) || this.isDead) {
            return;
        }

        const knockbackX = hitInfo ? hitInfo.knockbackX : 0;
        const knockbackY = hitInfo ? hitInfo.knockbackY : 0;
        if (knockbackX <= 0 && knockbackY <= 0) {
            return;
        }

        const selfWorldPos = this.getNodeWorldPosition();
        const attackerWorldPos = attackerNode.parent
            ? attackerNode.parent.convertToWorldSpaceAR(attackerNode.position)
            : attackerNode.position;
        const direction = selfWorldPos.x >= attackerWorldPos.x ? 1 : -1;
        const scale = 1 - Math.max(0, Math.min(1, this.knockbackResistance));
        const velocityX = direction * knockbackX * scale;
        const velocityY = knockbackY * scale;

        this.rb.linearVelocity = cc.v2(velocityX, Math.max(this.rb.linearVelocity.y, velocityY));
        this.knockbackTimer = this.knockbackLockTime;

        if (this.debugLog) {
            cc.log(`[NPC_AI] knockback velocity=(${velocityX.toFixed(1)}, ${velocityY.toFixed(1)})`);
        }
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
        const animationState = this.currentAnimName && this.anim
            ? this.anim.getAnimationState(this.currentAnimName)
            : null;
        const animationText = this.currentAnimName
            ? `${this.currentAnimName}:${animationState && animationState.isPlaying ? "playing" : "stopped"}`
            : "none";
        cc.log(`[NPC_AI] state target=${targetName}, type=${this.type}, moveMode=${this.moveMode}, distance=${distance}, velocity=${velocity}, animation=${animationText}, attacking=${this.isAttacking}, hurting=${this.isHurting}, talking=${this.isTalking}, trading=${this.isTrading}`);
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

    protected updateWander(dt: number) {
        this.wanderTimer -= dt;

        if (this.wanderTimer <= 0) {
            this.chooseNextWanderState();
        }

        if (this.wanderDirection === 0) {
            this.stopHorizontalMove();
            this.playStateAnimation("idle");
            return;
        }

        const targetSpeedX = this.wanderDirection * this.wanderMoveSpeed;
        if (this.rb) {
            this.rb.linearVelocity = cc.v2(targetSpeedX, this.rb.linearVelocity.y);
        } else {
            this.node.x += targetSpeedX * dt;
        }

        this.setFacingByDirection(cc.v2(this.wanderDirection, 0));
        this.tryJumpWhenStuck(dt);
        this.playStateAnimation("move");
    }

    protected setFacingByDirection(direction: cc.Vec2 | cc.Vec3) {
        this.updateFacing(direction);
    }

    private chooseNextWanderState() {
        const shouldIdle = Math.random() < 0.45;
        if (shouldIdle) {
            this.wanderDirection = 0;
            this.wanderTimer = this.randomRange(this.minWanderIdleTime, this.maxWanderIdleTime);
            return;
        }

        this.wanderDirection = Math.random() < 0.5 ? -1 : 1;
        this.wanderTimer = this.randomRange(this.minWanderMoveTime, this.maxWanderMoveTime);
    }

    private randomRange(min: number, max: number) {
        const safeMin = Math.min(min, max);
        const safeMax = Math.max(min, max);
        return safeMin + Math.random() * (safeMax - safeMin);
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

        if (this.attackType === NPCAttackType.RANGED && !this.canStartRangedAttack()) {
            return;
        }

        this.isAttacking = true;
        this.isHurting = false;
        const attackAnimationDuration = this.getStateAnimationDuration("attack");
        const attackLockTime = this.attackType === NPCAttackType.RANGED
            ? Math.max(this.attackAnimLockTime, attackAnimationDuration, this.projectileSpawnDelay + 0.05)
            : Math.max(this.attackAnimLockTime, attackAnimationDuration);
        this.actionLockTimer = attackLockTime;
        this.playStateAnimation("attack", true);

        if (this.attackType === NPCAttackType.RANGED) {
            this.scheduleRangedProjectile();
        } else if (this.attackHitbox) {
            const facingRight = !this.bodyNode || this.bodyNode.scaleX >= 0;
            this.attackHitbox.activate(facingRight, this.attackDamage, this.node);
        } else if (this.debugLog) {
            cc.log(`[NPC_AI] ${this.node.name} has no AttackHitbox component.`);
        }

        if (this.debugLog) {
            cc.log(`[NPC_AI] attack started: ${this.currentAnimName}`);
        }

        this.attackTimer = this.attackCooldown;

        this.unschedule(this.finishAttack);
        this.scheduleOnce(this.finishAttack, attackLockTime);
    }

    private canStartRangedAttack(): boolean {
        if (!this.projectilePrefab) {
            if (this.debugLog) {
                cc.warn(`[NPC_AI] ${this.node.name} cannot use ranged attack without projectilePrefab.`);
            }
            return false;
        }

        if (!this.targetPlayer || !cc.isValid(this.targetPlayer)) {
            return false;
        }

        return true;
    }

    private scheduleRangedProjectile() {
        this.unschedule(this.releaseRangedProjectile);
        this.rangedReleasePending = true;
        this.scheduleOnce(this.releaseRangedProjectile, Math.max(0, this.projectileSpawnDelay));
    }

    private releaseRangedProjectile = () => {
        this.rangedReleasePending = false;

        if (
            this.isDead ||
            this.isHurting ||
            !this.isAttacking ||
            !this.projectilePrefab ||
            !this.targetPlayer ||
            !cc.isValid(this.targetPlayer)
        ) {
            this.logRangedAttack("release cancelled: invalid attack state");
            return;
        }

        const parent = this.getProjectileParent();
        if (!parent || !cc.isValid(parent)) {
            cc.warn(`[NPC_AI] ${this.node.name} cannot spawn projectile without a valid world parent.`);
            return;
        }

        const projectileNode = cc.instantiate(this.projectilePrefab);
        projectileNode.parent = parent;

        const spawnWorldPosition = this.getProjectileSpawnWorldPosition();
        projectileNode.setPosition(parent.convertToNodeSpaceAR(spawnWorldPosition));

        const projectile = projectileNode.getComponent(CombatProjectile);
        if (!projectile) {
            cc.warn(`[NPC_AI] ${this.node.name}'s projectile prefab has no CombatProjectile component.`);
            projectileNode.destroy();
            return;
        }

        const targetWorldPosition = this.getTargetWorldPosition().add(cc.v2(0, this.projectileTargetOffsetY));
        const velocity = this.calculateProjectileVelocity(spawnWorldPosition, targetWorldPosition);
        const launched = projectile.launch(
            this.node,
            this.getCombatFaction(),
            velocity,
            this.attackDamage,
            this.projectileKnockbackX,
            this.projectileKnockbackY
        );

        if (!launched && cc.isValid(projectileNode)) {
            projectileNode.destroy();
            return;
        }

        this.logRangedAttack(
            `projectile released mode=${ProjectileAimMode[this.projectileAimMode]}, ` +
            `speed=${this.projectileSpeed.toFixed(1)}, flightTime=${this.lastProjectileFlightTime.toFixed(2)}, ` +
            `velocity=(${velocity.x.toFixed(1)}, ${velocity.y.toFixed(1)})`
        );
    };

    private finishAttack = () => {
        this.isAttacking = false;
        this.currentAnimName = "";
    };

    private cancelPendingRangedAttack(reason: string) {
        this.unschedule(this.releaseRangedProjectile);
        this.unschedule(this.finishAttack);

        if (this.rangedReleasePending) {
            this.logRangedAttack(`release cancelled: ${reason}`);
        }
        this.rangedReleasePending = false;
    }

    private getProjectileParent(): cc.Node {
        if (this.projectileParent && cc.isValid(this.projectileParent)) {
            return this.projectileParent;
        }
        return this.node.parent;
    }

    private getProjectileSpawnWorldPosition(): cc.Vec2 {
        if (!this.projectileSpawnNode || !cc.isValid(this.projectileSpawnNode)) {
            return this.getNodeWorldPosition();
        }

        if (this.projectileSpawnNode.parent === this.node) {
            const facingRight = !this.bodyNode || this.bodyNode.scaleX >= 0;
            const localPosition = cc.v2(
                facingRight
                    ? Math.abs(this.projectileSpawnNode.x)
                    : -Math.abs(this.projectileSpawnNode.x),
                this.projectileSpawnNode.y
            );
            return this.node.convertToWorldSpaceAR(localPosition);
        }

        return this.projectileSpawnNode.parent
            ? this.projectileSpawnNode.parent.convertToWorldSpaceAR(this.projectileSpawnNode.position)
            : this.projectileSpawnNode.position;
    }

    private calculateProjectileVelocity(spawnWorld: cc.Vec2, targetWorld: cc.Vec2): cc.Vec2 {
        const minFlightTime = Math.max(0.05, Math.min(this.projectileMinFlightTime, this.projectileMaxFlightTime));
        const maxFlightTime = Math.max(minFlightTime, Math.max(this.projectileMinFlightTime, this.projectileMaxFlightTime));
        const delta = targetWorld.sub(spawnWorld);
        let requestedFlightTime = this.projectileFlightTime;

        if (this.projectileAimMode === ProjectileAimMode.HORIZONTAL_SPEED) {
            const safeSpeed = Math.max(1, Math.abs(this.projectileSpeed));
            requestedFlightTime = Math.abs(delta.x) > 0.01
                ? Math.abs(delta.x) / safeSpeed
                : minFlightTime;
        }

        const flightTime = Math.max(minFlightTime, Math.min(maxFlightTime, requestedFlightTime));
        this.lastProjectileFlightTime = flightTime;
        const physicsManager = cc.director.getPhysicsManager();
        const gravityY = physicsManager ? physicsManager.gravity.y : -320;

        return cc.v2(
            delta.x / flightTime,
            (delta.y - 0.5 * gravityY * flightTime * flightTime) / flightTime
        );
    }

    private logRangedAttack(message: string) {
        if (this.debugLog) {
            cc.log(`[NPC_AI] ${this.node.name} ranged: ${message}`);
        }
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
        if (Math.abs(direction.x) > 0.01) {
            this.facing = NPCFacing.RIGHT;
            spriteNode.scaleX = direction.x >= 0 ? this.baseBodyScaleX : -this.baseBodyScaleX;
            return;
        }

        spriteNode.scaleX = this.baseBodyScaleX;
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
        const directionalName = `${stateName}_${this.facing}`;
        if (this.hasAnimation(directionalName)) {
            return directionalName;
        }

        // Some NPCs, such as MiniBoar, only provide right-facing clips.
        // Reuse that clip and let updateFacing mirror Sprite_Body for left movement.
        const rightFacingName = `${stateName}_${NPCFacing.RIGHT}`;
        if (this.hasAnimation(rightFacingName)) {
            return rightFacingName;
        }

        return directionalName;
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

        const state = this.anim.getAnimationState(animName);
        if (!force && this.currentAnimName === animName && state && state.isPlaying) {
            return;
        }

        const playedState = this.anim.play(animName);
        this.currentAnimName = playedState ? animName : "";
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

    private getStateAnimationDuration(stateName: string): number {
        return this.getAnimationDuration(this.getDirectionalAnimationName(stateName));
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

import BaseEntity from "../Core/BaseEntity";
import { EntityType, GameEvent } from "../Core/Constants";
import { CombatFaction, CombatHitInfo } from "./CombatHitbox";
import AudioManager, { SfxType } from "../Core/AudioManager";
import EffectsManager, { EffectType } from "../Core/EffectsManager";
import EventCenter from "../Core/EventCenter";
import PhysicsContactFilter from "../Core/PhysicsContactFilter";
import { PhysicsTag } from "../Core/PhysicsTags";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CombatProjectile extends cc.Component {

    @property(cc.Float)
    public lifeTime: number = 3;

    @property(cc.Boolean)
    public destroyOnTargetHit: boolean = true;

    @property(cc.Boolean)
    public destroyOnTerrainHit: boolean = true;

    @property(cc.Boolean)
    public rotateWithVelocity: boolean = false;

    @property(cc.Node)
    public visualNode: cc.Node = null;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    @property({ type: cc.Enum(CombatFaction) })
    public ownerFaction: CombatFaction = CombatFaction.NONE;

    @property(cc.Boolean)
    public ignoreSameFaction: boolean = true;

    @property(cc.Boolean)
    public canHitPlayer: boolean = true;

    @property(cc.Boolean)
    public canHitPeaceNpc: boolean = false;

    @property(cc.Boolean)
    public canHitNeutralNpc: boolean = false;

    @property(cc.Boolean)
    public canHitHostileNpc: boolean = false;

    private rigidBody: cc.RigidBody = null;
    private collider: cc.PhysicsCollider = null;
    private ownerNode: cc.Node = null;
    private damage: number = 0;
    private knockbackX: number = 0;
    private knockbackY: number = 0;
    private hitTargets: cc.Node[] = [];
    private launched: boolean = false;
    private finishing: boolean = false;
    private poolReturnHandler: (node: cc.Node) => void = null;
    private poolReturnTarget: any = null;

    onLoad() {
        this.ensurePhysicsComponents();
        this.ensureVisualNode();
        this.playVisualAnimations();
    }

    update() {
        if (!this.launched || !this.rotateWithVelocity || !this.rigidBody) {
            return;
        }

        const velocity = this.rigidBody.linearVelocity;
        if (velocity.magSqr() <= 0.01) {
            return;
        }

        const targetNode = this.visualNode || this.node;
        targetNode.angle = cc.misc.radiansToDegrees(Math.atan2(velocity.y, velocity.x));
    }

    public launch(
        ownerNode: cc.Node,
        ownerFaction: CombatFaction,
        velocity: cc.Vec2,
        damage: number,
        knockbackX: number,
        knockbackY: number
    ): boolean {
        this.ensurePhysicsComponents();

        if (!this.rigidBody || !this.collider) {
            cc.error(`[CombatProjectile] ${this.node.name} requires RigidBody and PhysicsCollider.`);
            return false;
        }

        this.unscheduleAllCallbacks();
        this.ownerNode = ownerNode;
        this.ownerFaction = ownerFaction;
        this.damage = Math.max(0, damage);
        this.knockbackX = Math.abs(knockbackX);
        this.knockbackY = Math.abs(knockbackY);
        this.hitTargets = [];
        this.finishing = false;
        this.launched = true;

        this.collider.enabled = true;
        this.collider.sensor = true;
        (this.collider as any).enabledContactListener = true;
        this.collider.apply();

        this.rigidBody.enabledContactListener = true;
        this.rigidBody.linearVelocity = velocity.clone();
        this.rigidBody.awake = true;
        AudioManager.play(SfxType.SKILL);

        const safeLifeTime = Math.max(0.05, this.lifeTime);
        this.scheduleOnce(this.finishByLifetime, safeLifeTime);
        this.log(
            `launched owner=${ownerNode ? ownerNode.name : "none"}, ` +
            `damage=${this.damage}, velocity=(${velocity.x.toFixed(1)}, ${velocity.y.toFixed(1)})`
        );
        return true;
    }

    public setPoolReturnHandler(handler: (node: cc.Node) => void, target?: any): void {
        this.poolReturnHandler = handler;
        this.poolReturnTarget = target || null;
    }

    public prepareForPool(): void {
        this.unscheduleAllCallbacks();
        this.launched = false;
        this.finishing = false;
        this.ownerNode = null;
        this.damage = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.hitTargets = [];

        if (this.rigidBody) {
            this.rigidBody.linearVelocity = cc.v2(0, 0);
            this.rigidBody.angularVelocity = 0;
            this.rigidBody.awake = false;
        }

        if (this.collider) {
            this.collider.enabled = false;
            this.collider.apply();
        }
    }

    onBeginContact(
        contact: cc.PhysicsContact,
        selfCollider: cc.PhysicsCollider,
        otherCollider: cc.PhysicsCollider
    ) {
        if (!this.launched || this.finishing || !otherCollider || !cc.isValid(otherCollider.node)) {
            return;
        }

        const otherNode = otherCollider.node;
        this.log(`contact with ${otherNode.name}`);

        if (this.isOwnerHierarchy(otherNode)) {
            this.log(`ignored owner contact: ${otherNode.name}`);
            return;
        }

        const target = this.findEntity(otherNode);
        if (target) {
            if (!this.isValidTarget(target)) {
                this.log(`ignored entity: ${target.node.name}`);
                return;
            }

            if (this.hasHit(target.node)) {
                return;
            }

            this.hitTargets.push(target.node);
            this.applyDamage(target);

            if (this.destroyOnTargetHit) {
                this.finish("target hit");
            }
            return;
        }

        if (this.destroyOnTerrainHit && !otherCollider.sensor) {
            this.finish(`solid hit: ${otherNode.name}`);
        }
    }

    onDisable() {
        this.unscheduleAllCallbacks();
    }

    onDestroy() {
        this.unscheduleAllCallbacks();
    }

    private ensurePhysicsComponents() {
        if (!this.rigidBody) {
            this.rigidBody = this.getComponent(cc.RigidBody);
        }

        if (!this.collider) {
            this.collider = this.getComponent(cc.PhysicsCollider);
        }

        if (this.rigidBody) {
            this.rigidBody.enabledContactListener = true;
        }

        if (this.collider) {
            this.collider.sensor = true;
            (this.collider as any).enabledContactListener = true;
            PhysicsContactFilter.ensureForNode(
                this.node,
                PhysicsTag.PROJECTILE,
                this.debugLog
            );
        }
    }

    private ensureVisualNode() {
        if (this.visualNode && cc.isValid(this.visualNode) && this.visualNode.name === "VisualRoot") {
            return;
        }

        const existingRoot = this.node.getChildByName("VisualRoot");
        if (existingRoot) {
            this.visualNode = existingRoot;
            return;
        }

        const visualChildren = this.node.children.filter((child) => {
            return child.name === "CoconutSprite" || child.name === "FireEffect";
        });
        if (visualChildren.length <= 0) {
            return;
        }

        const visualRoot = new cc.Node("VisualRoot");
        visualRoot.parent = this.node;

        for (const child of visualChildren) {
            const localPosition = child.position.clone();
            child.parent = visualRoot;
            child.setPosition(localPosition);
        }

        this.visualNode = visualRoot;
    }

    private playVisualAnimations() {
        const animations = this.node.getComponentsInChildren(cc.Animation);
        for (const animation of animations) {
            if (animation && animation.enabled && animation.defaultClip) {
                animation.play(animation.defaultClip.name);
            }
        }
    }

    private findEntity(startNode: cc.Node): BaseEntity {
        let current: cc.Node = startNode;

        while (current && typeof (current as any).getComponent === "function") {
            if (this.isOwnerHierarchy(current)) {
                return null;
            }

            const entity = current.getComponent(BaseEntity);
            if (entity) {
                return entity;
            }

            const parent = current.parent;
            if (!parent || typeof (parent as any).getComponent !== "function") {
                break;
            }
            current = parent;
        }

        return null;
    }

    private isValidTarget(entity: BaseEntity): boolean {
        if (!entity || !cc.isValid(entity.node) || this.isOwnerHierarchy(entity.node)) {
            return false;
        }

        const targetFaction = this.getFactionFromEntity(entity);
        if (
            this.ignoreSameFaction &&
            this.ownerFaction !== CombatFaction.NONE &&
            targetFaction === this.ownerFaction
        ) {
            return false;
        }

        switch (entity.type) {
            case EntityType.PLAYER:
                return this.canHitPlayer;
            case EntityType.NPC_PEACE:
                return this.canHitPeaceNpc;
            case EntityType.NPC_NEUTRAL:
                return this.canHitNeutralNpc;
            case EntityType.NPC_HOSTILE:
                return this.canHitHostileNpc;
            default:
                return false;
        }
    }

    private applyDamage(target: BaseEntity) {
        const targetDefense = (target as any).defense || 0;
        const finalDamage = Math.max(1, this.damage - targetDefense);

        const hitInfo: CombatHitInfo = {
            attackerNode: this.ownerNode,
            hitboxNode: this.node,
            damage: finalDamage,
            knockbackX: this.knockbackX,
            knockbackY: this.knockbackY
        };

        this.log(`hit ${target.node.name}, 原本攻擊=${this.damage}, 防禦=${targetDefense}, 最終=${finalDamage}`);
        const hitWorldPosition = this.getNodeWorldPosition(target.node);
        AudioManager.play(SfxType.HIT);
        EffectsManager.play(EffectType.FIRE, hitWorldPosition);
        
        EventCenter.emit(GameEvent.COMBAT_HIT_CONFIRMED, {
            attackerNode: this.ownerNode,
            targetNode: target.node,
            worldPosition: hitWorldPosition,
            damage: finalDamage, 
            knockbackX: this.knockbackX,
            knockbackY: this.knockbackY,
            sourceType: "projectile"
        });
        const receiver = target as any;
        if (typeof receiver.receiveAttack === "function") {
            receiver.receiveAttack(finalDamage, this.ownerNode, hitInfo);
            return;
        }

        target.takeDamage(finalDamage);
    }

    private finishByLifetime = () => {
        this.finish("lifetime");
    };

    private finish(reason: string) {
        if (this.finishing) {
            return;
        }

        this.finishing = true;
        this.launched = false;
        this.unscheduleAllCallbacks();
        this.log(`finished: ${reason}`);

        if (this.collider) {
            this.collider.enabled = false;
            this.collider.apply();
        }

        if (cc.isValid(this.node)) {
            EffectsManager.play(EffectType.FIRE, this.getNodeWorldPosition(this.node));
            if (this.poolReturnHandler) {
                const handler = this.poolReturnHandler;
                const target = this.poolReturnTarget;
                handler.call(target, this.node);
                return;
            }
            this.node.destroy();
        }
    }

    private hasHit(node: cc.Node): boolean {
        return this.hitTargets.indexOf(node) >= 0;
    }

    private isOwnerHierarchy(node: cc.Node): boolean {
        if (!this.ownerNode || !node) {
            return false;
        }

        let current: cc.Node = node;
        while (current) {
            if (current === this.ownerNode) {
                return true;
            }
            current = current.parent;
        }

        return false;
    }

    private getFactionFromEntity(entity: BaseEntity): CombatFaction {
        switch (entity.type) {
            case EntityType.PLAYER:
                return CombatFaction.PLAYER;
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

    private log(message: string) {
        if (this.debugLog) {
            cc.log(`[CombatProjectile:${this.node.name}] ${message}`);
        }
    }

    private getNodeWorldPosition(node: cc.Node): cc.Vec2 {
        return node.parent
            ? node.parent.convertToWorldSpaceAR(node.position)
            : node.position;
    }
}

import BaseEntity from "../Core/BaseEntity";
import { EntityType, GameEvent } from "../Core/Constants";
import AudioManager, { SfxType } from "../Core/AudioManager";
import EffectsManager, { EffectType } from "../Core/EffectsManager";
import EventCenter from "../Core/EventCenter";

const { ccclass, property } = cc._decorator;

export enum CombatFaction {
    NONE = 0,
    PLAYER = 1,
    PEACE_NPC = 2,
    NEUTRAL_NPC = 3,
    HOSTILE_NPC = 4
}

cc.Enum(CombatFaction);

export interface CombatHitInfo {
    attackerNode: cc.Node;
    hitboxNode: cc.Node;
    damage: number;
    knockbackX: number;
    knockbackY: number;
}

@ccclass
export default class CombatHitbox extends cc.Component {

    @property(cc.Float)
    public activeTime: number = 0.12;

    @property(cc.Float)
    public offsetX: number = 46;

    @property(cc.Float)
    public offsetY: number = 0;

    @property(cc.Float)
    public knockbackX: number = 240;

    @property(cc.Float)
    public knockbackY: number = 120;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    @property({ type: cc.Enum(CombatFaction) })
    public ownerFaction: CombatFaction = CombatFaction.NONE;

    @property(cc.Boolean)
    public ignoreSameFaction: boolean = true;

    @property(cc.Boolean)
    public canHitPlayer: boolean = false;

    @property(cc.Boolean)
    public canHitPeaceNpc: boolean = false;

    @property(cc.Boolean)
    public canHitNeutralNpc: boolean = true;

    @property(cc.Boolean)
    public canHitHostileNpc: boolean = true;

    protected collider: cc.PhysicsCollider = null;
    protected attackerNode: cc.Node = null;
    protected damage: number = 0;
    protected hitTargets: cc.Node[] = [];

    onLoad() {
        this.ensureCollider();
        this.deactivate();
    }

    public activate(facingRight: boolean, damage: number, attackerNode: cc.Node) {
        this.unscheduleAllCallbacks();

        this.attackerNode = attackerNode;
        this.damage = damage;
        this.hitTargets = [];
        this.node.active = true;
        this.node.setPosition(
            facingRight ? Math.abs(this.offsetX) : -Math.abs(this.offsetX),
            this.offsetY
        );

        this.ensureCollider();
        this.setColliderEnabled(true);
        this.log(`enabled damage=${this.damage}, localPos=(${this.node.x}, ${this.node.y})`);

        this.scheduleOnce(() => {
            this.deactivate();
        }, this.activeTime);
    }

    public deactivate() {
        this.unscheduleAllCallbacks();
        this.setColliderEnabled(false);
        this.hitTargets = [];
        this.node.active = false;
        this.log("disabled");
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        this.log(`contact with ${otherCollider.node.name}`);

        const target = this.findTarget(otherCollider.node);
        if (!target || !cc.isValid(target.node) || this.hasHit(target.node)) {
            return;
        }

        this.hitTargets.push(target.node);
        this.applyDamage(target);
    }

    onDestroy() {
        this.unscheduleAllCallbacks();
    }

    private findTarget(startNode: cc.Node): BaseEntity {
        let current = startNode;
        while (current && (current as any).getComponent) {
            if (this.isAttackerNode(current)) {
                return null;
            }

            const entity = current.getComponent(BaseEntity);
            if (entity && this.isValidTarget(entity)) {
                return entity;
            }

            current = current.parent;
        }

        return null;
    }

    private isValidTarget(entity: BaseEntity): boolean {
        if (!entity || entity.node === this.node) {
            return false;
        }

        if (this.attackerNode && entity.node === this.attackerNode) {
            return false;
        }

        const targetFaction = this.getFactionFromEntity(entity);
        if (this.ignoreSameFaction && this.ownerFaction !== CombatFaction.NONE && targetFaction === this.ownerFaction) {
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
        const hitInfo: CombatHitInfo = {
            attackerNode: this.attackerNode,
            hitboxNode: this.node,
            damage: this.damage,
            knockbackX: this.knockbackX,
            knockbackY: this.knockbackY
        };

        this.log(`Hit ${target.node.name}, damage=${this.damage}, knockback=(${this.knockbackX}, ${this.knockbackY})`);
        const hitWorldPosition = this.getNodeWorldPosition(target.node);
        AudioManager.play(SfxType.HIT);
        EffectsManager.play(EffectType.HIT, hitWorldPosition);
        EventCenter.emit(GameEvent.COMBAT_HIT_CONFIRMED, {
            attackerNode: this.attackerNode,
            targetNode: target.node,
            worldPosition: hitWorldPosition,
            damage: this.damage,
            knockbackX: this.knockbackX,
            knockbackY: this.knockbackY,
            sourceType: "melee"
        });

        const receiver = target as any;
        if (receiver.receiveAttack) {
            receiver.receiveAttack(this.damage, this.attackerNode, hitInfo);
            return;
        }

        target.takeDamage(this.damage);
    }

    private log(message: string) {
        if (this.debugLog) {
            cc.log(`[CombatHitbox] ${message}`);
        }
    }

    private setColliderEnabled(enabled: boolean) {
        this.ensureCollider();

        if (!this.collider) {
            return;
        }

        this.collider.enabled = enabled;
        this.collider.apply();
    }

    private ensureCollider() {
        if (this.collider) {
            return;
        }

        this.collider = this.getComponent(cc.PhysicsCollider);
        if (!this.collider) {
            return;
        }

        this.collider.sensor = true;
        (this.collider as any).enabledContactListener = true;
    }

    private hasHit(node: cc.Node): boolean {
        return this.hitTargets.indexOf(node) >= 0;
    }

    private isAttackerNode(node: cc.Node): boolean {
        if (!this.attackerNode) {
            return false;
        }

        let current = node;
        while (current) {
            if (current === this.attackerNode) {
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

    private getNodeWorldPosition(node: cc.Node): cc.Vec2 {
        return node.parent
            ? node.parent.convertToWorldSpaceAR(node.position)
            : node.position;
    }
}

import EventCenter from "./EventCenter";
import { GameEvent } from "./Constants";
import EffectsManager, { EffectType } from "./EffectsManager";

const { ccclass, property } = cc._decorator;

interface CombatHitPayload {
    targetNode: cc.Node;
    worldPosition: cc.Vec2;
    damage: number;
    sourceType: string;
}

@ccclass
export default class DamageNumberManager extends cc.Component {
    public static instance: DamageNumberManager = null;

    @property(cc.Node)
    public numberRoot: cc.Node = null;

    @property(cc.Integer)
    public fontSize: number = 24;

    @property(cc.Float)
    public floatDistance: number = 44;

    @property(cc.Float)
    public lifeTime: number = 0.55;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    private pool: cc.NodePool = null;

    public static getOrCreate(hostNode?: cc.Node): DamageNumberManager {
        if (DamageNumberManager.instance && cc.isValid(DamageNumberManager.instance.node)) {
            return DamageNumberManager.instance;
        }

        const targetNode = hostNode || cc.find("Canvas") || cc.director.getScene();
        if (!targetNode) {
            return null;
        }

        let manager = targetNode.getComponent(DamageNumberManager);
        if (!manager) {
            manager = targetNode.addComponent(DamageNumberManager);
        }
        return manager;
    }

    onLoad(): void {
        DamageNumberManager.instance = this;
        this.pool = new cc.NodePool();
        if (!this.numberRoot) {
            this.numberRoot = cc.find("Canvas/UI Root") || cc.find("Canvas") || this.node;
        }
        EventCenter.on(GameEvent.COMBAT_HIT_CONFIRMED, this.onCombatHitConfirmed, this);
    }

    onDestroy(): void {
        EventCenter.off(GameEvent.COMBAT_HIT_CONFIRMED, this.onCombatHitConfirmed, this);
        if (DamageNumberManager.instance === this) {
            DamageNumberManager.instance = null;
        }
        if (this.pool) {
            this.pool.clear();
        }
    }

    public showDamage(amount: number, worldPosition: cc.Vec2, critical: boolean = false): void {
        if (!this.numberRoot || !cc.isValid(this.numberRoot)) {
            return;
        }

        const node = this.pool && this.pool.size() > 0 ? this.pool.get() : this.createNumberNode();
        node.parent = this.numberRoot;
        node.active = true;
        node.opacity = 255;
        node.scale = critical ? 1.2 : 1;
        node.setPosition(this.numberRoot.convertToNodeSpaceAR(worldPosition.add(cc.v2(0, 26))));

        const label = node.getComponent(cc.Label);
        if (label) {
            label.string = `${Math.max(0, Math.floor(amount || 0))}`;
            label.fontSize = critical ? this.fontSize + 4 : this.fontSize;
            label.node.color = critical ? cc.color(255, 230, 80) : cc.color(255, 245, 245);
        }

        const horizontalJitter = (Math.random() - 0.5) * 18;
        cc.tween(node)
            .by(this.lifeTime, { y: this.floatDistance, x: horizontalJitter, opacity: -255 }, { easing: "quadOut" })
            .call(() => this.recycle(node))
            .start();
    }

    private onCombatHitConfirmed(payload: CombatHitPayload): void {
        if (!payload || !payload.worldPosition || payload.damage <= 0) {
            return;
        }
        EffectsManager.play(EffectType.DAMAGE_SPARK, payload.worldPosition);
        this.showDamage(payload.damage, payload.worldPosition, payload.sourceType === "boss");
    }

    private createNumberNode(): cc.Node {
        const node = new cc.Node("DamageNumber");
        const label = node.addComponent(cc.Label);
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        label.fontSize = this.fontSize;
        return node;
    }

    private recycle(node: cc.Node): void {
        if (!node || !cc.isValid(node)) {
            return;
        }
        node.stopAllActions();
        if (this.pool) {
            this.pool.put(node);
        } else {
            node.destroy();
        }
    }
}

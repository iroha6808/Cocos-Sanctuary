import EventCenter from "../Core/EventCenter";
import { GameEvent } from "../Core/Constants";
import GameManager from "../Core/GameManager";
import MiniBossAI from "./MiniBossAI";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BossArenaController extends cc.Component {
    @property(MiniBossAI)
    public boss: MiniBossAI = null;

    @property(cc.Node)
    public bossNode: cc.Node = null;

    @property(cc.Node)
    public playerNode: cc.Node = null;

    @property(cc.Node)
    public gateNode: cc.Node = null;

    @property(cc.Node)
    public clearRewardNode: cc.Node = null;

    @property(cc.Integer)
    public clearScoreReward: number = 500;

    @property(cc.Boolean)
    public activateOnce: boolean = true;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    private activated: boolean = false;
    private cleared: boolean = false;

    onLoad(): void {
        if (!this.boss && this.bossNode) {
            this.boss = this.bossNode.getComponent(MiniBossAI);
        }
        if (this.clearRewardNode) {
            this.clearRewardNode.active = false;
        }
        EventCenter.on(GameEvent.BOSS_DEFEATED, this.onBossDefeated, this);
    }

    onDestroy(): void {
        EventCenter.off(GameEvent.BOSS_DEFEATED, this.onBossDefeated, this);
    }

    onBeginContact(
        contact: cc.PhysicsContact,
        selfCollider: cc.PhysicsCollider,
        otherCollider: cc.PhysicsCollider
    ): void {
        if (this.cleared || (this.activateOnce && this.activated)) {
            return;
        }

        const actor = this.resolvePlayer(otherCollider ? otherCollider.node : null);
        if (!actor) {
            return;
        }

        this.playerNode = actor;
        this.activated = true;
        if (this.gateNode) {
            this.gateNode.active = true;
        }
        if (this.bossNode) {
            this.bossNode.active = true;
        }
        if (this.boss) {
            this.boss.activateBoss(this.playerNode);
        }
    }

    private onBossDefeated(bossNode: cc.Node): void {
        const expectedNode = this.bossNode || (this.boss ? this.boss.node : null);
        if (!expectedNode || bossNode !== expectedNode) {
            return;
        }

        this.cleared = true;
        if (this.gateNode) {
            this.gateNode.active = false;
        }
        if (this.clearRewardNode) {
            this.clearRewardNode.active = true;
        }
        if (GameManager.instance) {
            GameManager.instance.addScore(this.clearScoreReward);
        }
    }

    private resolvePlayer(startNode: cc.Node): cc.Node {
        let current = startNode;
        while (current) {
            if (current.getComponent("PlayerController")) {
                return current;
            }
            current = current.parent;
        }
        return null;
    }
}

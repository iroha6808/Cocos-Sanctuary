import EventCenter from "../Core/EventCenter";
import { GameEvent } from "../Core/Constants";
import EffectsManager, { EffectType } from "../Core/EffectsManager";
import GameManager from "../Core/GameManager";
import NPC_AI from "./NPC_AI";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MiniBossAI extends cc.Component {
    @property(NPC_AI)
    public npcAI: NPC_AI = null;

    @property(cc.Node)
    public targetPlayer: cc.Node = null;

    @property([cc.Node])
    public teleportPoints: cc.Node[] = [];

    @property([cc.Prefab])
    public minionPrefabs: cc.Prefab[] = [];

    @property(cc.Node)
    public minionParent: cc.Node = null;

    @property(cc.Float)
    public phase2HpRatio: number = 0.5;

    @property(cc.Float)
    public teleportIntervalPhase1: number = 5;

    @property(cc.Float)
    public teleportIntervalPhase2: number = 3;

    @property(cc.Float)
    public summonIntervalPhase1: number = 7;

    @property(cc.Float)
    public summonIntervalPhase2: number = 4.5;

    @property(cc.Integer)
    public maxAliveMinions: number = 4;

    @property(cc.Integer)
    public scoreReward: number = 800;

    @property(cc.Boolean)
    public activeOnStart: boolean = false;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    private active: boolean = false;
    private phase: number = 1;
    private teleportTimer: number = 0;
    private summonTimer: number = 0;
    private minions: cc.Node[] = [];
    private defeated: boolean = false;

    onLoad(): void {
        if (!this.npcAI) {
            this.npcAI = this.getComponent(NPC_AI);
        }
        if (!this.minionParent) {
            this.minionParent = this.node.parent;
        }
        this.active = this.activeOnStart;
        if (!this.active && this.npcAI) {
            this.npcAI.pauseMovement();
        }
        EventCenter.on(GameEvent.NPC_DIED, this.onNpcDied, this);
    }

    start(): void {
        if (this.activeOnStart) {
            this.activateBoss(this.targetPlayer);
        }
    }

    update(dt: number): void {
        if (!this.active || this.defeated || (GameManager.instance && GameManager.instance.isGamePaused())) {
            return;
        }

        this.cleanupMinions();
        this.updatePhase();
        this.teleportTimer -= dt;
        this.summonTimer -= dt;

        if (this.teleportTimer <= 0) {
            this.teleportToNextPoint();
            this.teleportTimer = this.phase === 2 ? this.teleportIntervalPhase2 : this.teleportIntervalPhase1;
        }

        if (this.summonTimer <= 0) {
            this.summonMinion();
            this.summonTimer = this.phase === 2 ? this.summonIntervalPhase2 : this.summonIntervalPhase1;
        }
    }

    onDestroy(): void {
        EventCenter.off(GameEvent.NPC_DIED, this.onNpcDied, this);
    }

    public activateBoss(playerNode?: cc.Node): void {
        if (this.defeated) {
            return;
        }

        this.active = true;
        this.targetPlayer = playerNode || this.targetPlayer;
        if (this.npcAI) {
            if (this.targetPlayer) {
                this.npcAI.setTarget(this.targetPlayer);
            }
            this.npcAI.resumeMovement();
        }
        this.teleportTimer = Math.min(1.2, this.teleportIntervalPhase1);
        this.summonTimer = Math.min(2, this.summonIntervalPhase1);
    }

    public deactivateBoss(): void {
        this.active = false;
        if (this.npcAI) {
            this.npcAI.pauseMovement();
        }
    }

    private updatePhase(): void {
        const entity = this.npcAI || (this.getComponent("BaseEntity") as any);
        if (!entity || this.phase === 2) {
            return;
        }

        const hpRatio = entity.maxHp > 0 ? entity.currentHp / entity.maxHp : 1;
        if (hpRatio <= this.phase2HpRatio) {
            this.phase = 2;
            this.teleportTimer = 0.2;
            this.summonTimer = 0.4;
            EventCenter.emit(GameEvent.BOSS_PHASE_CHANGED, this.node, this.phase);
            EffectsManager.play(EffectType.BOSS_TELEPORT, this.getWorldPosition(this.node));
        }
    }

    private teleportToNextPoint(): void {
        const points = (this.teleportPoints || []).filter(point => !!point && cc.isValid(point));
        if (points.length <= 0 || !this.node.parent) {
            return;
        }

        const fromWorld = this.getWorldPosition(this.node);
        const point = points[Math.floor(Math.random() * points.length)];
        const toWorld = this.getWorldPosition(point);
        EffectsManager.play(EffectType.BOSS_TELEPORT, fromWorld);
        this.node.setPosition(this.node.parent.convertToNodeSpaceAR(toWorld));
        EffectsManager.play(EffectType.BOSS_TELEPORT, toWorld);
        if (this.debugLog) {
            cc.log(`[MiniBossAI] teleported to ${point.name}.`);
        }
    }

    private summonMinion(): void {
        this.cleanupMinions();
        if (!this.minionParent || this.minions.length >= this.maxAliveMinions || !this.minionPrefabs || this.minionPrefabs.length <= 0) {
            return;
        }

        const prefab = this.minionPrefabs[Math.floor(Math.random() * this.minionPrefabs.length)];
        if (!prefab) {
            return;
        }

        const node = cc.instantiate(prefab);
        node.parent = this.minionParent;
        const offset = cc.v2((Math.random() - 0.5) * 140, 24);
        const spawnWorld = this.getWorldPosition(this.node).add(offset);
        node.setPosition(this.minionParent.convertToNodeSpaceAR(spawnWorld));
        const ai = node.getComponent(NPC_AI);
        if (ai && this.targetPlayer) {
            ai.setTarget(this.targetPlayer);
        }
        this.minions.push(node);
        EffectsManager.play(EffectType.BOSS_SUMMON, spawnWorld);
        EventCenter.emit(GameEvent.BOSS_SUMMONED_MINION, this.node, node);
    }

    private onNpcDied(npcNode: cc.Node): void {
        if (npcNode !== this.node || this.defeated) {
            return;
        }

        this.defeated = true;
        this.active = false;
        GameManager.instance && GameManager.instance.addScore(this.scoreReward);
        EventCenter.emit(GameEvent.BOSS_DEFEATED, this.node);
        EffectsManager.play(EffectType.BOSS_TELEPORT, this.getWorldPosition(this.node));
    }

    private cleanupMinions(): void {
        this.minions = this.minions.filter(node => !!node && cc.isValid(node));
    }

    private getWorldPosition(node: cc.Node): cc.Vec2 {
        return node.parent
            ? node.parent.convertToWorldSpaceAR(node.position)
            : cc.v2(node.x, node.y);
    }
}

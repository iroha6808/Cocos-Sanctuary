import EventCenter from "./EventCenter";
import { GameEvent } from "./Constants";
import GameManager from "./GameManager";
import SaveService, { RealtimePlayerState } from "./SaveService";
import { InventoryManager } from "../Player/InventoryManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class RealtimeStateReporter extends cc.Component {
    @property(cc.Node)
    public playerNode: cc.Node = null;

    @property
    public sceneName: string = "Game";

    @property(cc.Float)
    public reportInterval: number = 0.25;

    @property(cc.Integer)
    public staleAfterMs: number = 10000;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    private timer: number = 0;

    update(dt: number): void {
        if (GameManager.instance && GameManager.instance.isGamePaused()) {
            return;
        }

        this.timer -= dt;
        if (this.timer > 0) {
            return;
        }

        this.timer = Math.max(0.05, this.reportInterval);
        this.reportState();
    }

    public reportState(): void {
        const player = this.resolvePlayerNode();
        if (!player || !cc.isValid(player)) {
            return;
        }

        const playerEntity = player.getComponent("PlayerController") as any;
        const username = SaveService.getCurrentUsername() || "guest";
        const inventorySummary = InventoryManager.instance.getSaveSnapshot();
        const worldPosition = player.parent
            ? player.parent.convertToWorldSpaceAR(player.position)
            : cc.v2(player.x, player.y);
        const state: RealtimePlayerState = {
            clientId: SaveService.getClientId(),
            sessionId: SaveService.getSessionId(),
            username,
            displayName: username,
            scene: this.sceneName || cc.director.getScene().name || "Game",
            position: { x: worldPosition.x, y: worldPosition.y },
            hp: playerEntity && typeof playerEntity.currentHp === "number" ? playerEntity.currentHp : 0,
            maxHp: playerEntity && typeof playerEntity.maxHp === "number" ? playerEntity.maxHp : 1,
            score: GameManager.instance ? GameManager.instance.getScore() : 0,
            exp: GameManager.instance ? GameManager.instance.getExp() : 0,
            inventorySummary,
            inventorySlotCount: inventorySummary.length,
            inventoryTotalCount: this.getInventoryTotalCount(inventorySummary),
            status: GameManager.instance && GameManager.instance.isGamePaused() ? "paused" : "online",
            updatedAt: Date.now()
        };

        SaveService.upsertRealtimePlayerState(state);
        SaveService.clearStaleRealtimePlayers(this.staleAfterMs);
        EventCenter.emit(GameEvent.REALTIME_STATE_UPDATED, state, SaveService.getRealtimePlayers());

        if (this.debugLog) {
            cc.log(`[RealtimeStateReporter] ${state.username} (${state.position.x.toFixed(1)}, ${state.position.y.toFixed(1)}).`);
        }
    }

    private resolvePlayerNode(): cc.Node {
        if (this.playerNode && cc.isValid(this.playerNode)) {
            return this.playerNode;
        }
        if (GameManager.instance && GameManager.instance.playerNode && cc.isValid(GameManager.instance.playerNode)) {
            this.playerNode = GameManager.instance.playerNode;
            return this.playerNode;
        }
        return null;
    }

    private getInventoryTotalCount(items: { itemId: string; count: number }[]): number {
        return (items || []).reduce((total, item) => total + Math.max(0, Math.floor(item.count || 0)), 0);
    }
}

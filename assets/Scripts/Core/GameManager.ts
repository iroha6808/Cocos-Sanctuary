import EventCenter from "./EventCenter";
import { GameEvent } from "./Constants";
import SaveService, { SaveData } from "./SaveService";
import AudioManager, { SfxType } from "./AudioManager";
import { InventoryManager } from "../Player/InventoryManager";
import InputManager from "../Input/InputManager";
import { InputAction, InputPayload } from "../Input/InputAction";
import { InputContext } from "../Input/InputContext";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    public static instance: GameManager = null;

    @property(cc.Node)
    playerNode: cc.Node = null; // 在編輯器裡把 Player Prefab 生成的節點拖進來

    @property(cc.Boolean)
    showPhysicsDebugDraw: boolean = false;

    @property(cc.Node)
    pausePanel: cc.Node = null;

    @property(cc.Node)
    fadeOverlay: cc.Node = null;

    @property
    menuSceneName: string = "MenuScene";

    @property
    gameSceneName: string = "Game";

    @property
    gameOverSceneName: string = "GameOver";

    @property(cc.Integer)
    scorePerNpcKill: number = 100;

    @property(cc.Integer)
    expPerNpcKill: number = 20;

    @property(cc.Integer)
    scorePerItemCollected: number = 5;

    @property(cc.Integer)
    scorePerPurchase: number = 10;

    @property(cc.Boolean)
    autoLoadRequestedSave: boolean = true;

    private score: number = 0;
    private exp: number = 0;
    private isPaused: boolean = false;
    private physicsEnabledBeforePause: boolean = true;
    private inputManager: InputManager = null;

    onLoad() {
        // 單例模式 (Singleton)，方便其他腳本直接抓取 GameManager.instance
        if (GameManager.instance === null) {
            GameManager.instance = this;
        } else {
            this.node.destroy();
            return;
        }

        // 註冊全域事件
        EventCenter.on(GameEvent.PLAYER_DIED, this.onGameOver, this);
        EventCenter.on(GameEvent.NPC_DIED, this.onNpcDied, this);
        EventCenter.on(GameEvent.ITEM_COLLECTED, this.onItemCollected, this);
        EventCenter.on(GameEvent.MERCHANT_PURCHASED, this.onMerchantPurchased, this);
        this.inputManager = InputManager.getOrCreate(this.node);
        if (this.inputManager) {
            this.inputManager.pushContext(InputContext.Gameplay, this.handleGameplayInput, this);
        }

        // 啟用物理引擎
        const physicsManager = cc.director.getPhysicsManager();
        physicsManager.enabled = true;
        physicsManager.debugDrawFlags = this.showPhysicsDebugDraw ? 1 : 0;

        if (this.pausePanel) {
            this.pausePanel.active = false;
        }
        this.setFadeAlpha(0);
    }

    start() {
        console.log("遊戲初始化完成，準備進入 Cocos Sanctuary! - GameManager.ts:28");
        // TODO: 在這裡呼叫 MapManager 生成初始地圖
        if (this.autoLoadRequestedSave && SaveService.consumeLoadOnNextGame()) {
            this.loadCurrentUserSave();
        } else {
            this.emitScoreState();
        }
    }

    onGameOver() {
        console.log("玩家死亡，結算分數... - GameManager.ts:33");
        this.resumeGame(false);
        const username = SaveService.getCurrentUsername() || "guest";
        SaveService.setLastRun({
            username,
            score: this.score,
            exp: this.exp,
            updatedAt: Date.now()
        });
        if (SaveService.isLoggedIn()) {
            SaveService.saveGame(this.createSaveData(username));
            const leaderboard = SaveService.submitScore(username, this.score);
            EventCenter.emit(GameEvent.LEADERBOARD_UPDATED, leaderboard);
        }
    }

    public togglePause(): void {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            this.pauseGame();
        }
    }

    public pauseGame(): void {
        if (this.isPaused) {
            return;
        }
        this.isPaused = true;
        cc.director.getScheduler().setTimeScale(0);
        this.setPhysicsPaused(true);
        const inputManager = this.getInputManager();
        if (inputManager) {
            inputManager.pushContext(InputContext.Paused, this.handlePausedInput, this);
        }
        if (this.pausePanel) {
            this.pausePanel.active = true;
        } else {
            cc.warn("[GameManager] pausePanel is not assigned; game is paused without visible UI.");
        }
        EventCenter.emit(GameEvent.GAME_PAUSED);
        AudioManager.play(SfxType.SKILL);
    }

    public resumeGame(playSfx: boolean = true): void {
        if (!this.isPaused) {
            cc.director.getScheduler().setTimeScale(1);
            return;
        }
        this.isPaused = false;
        cc.director.getScheduler().setTimeScale(1);
        this.setPhysicsPaused(false);
        const inputManager = this.getInputManager();
        if (inputManager) {
            inputManager.popContext(InputContext.Paused, this);
        }
        if (this.pausePanel) {
            this.pausePanel.active = false;
        }
        EventCenter.emit(GameEvent.GAME_RESUMED);
        if (playSfx) {
            AudioManager.play(SfxType.SKILL);
        }
    }

    public restartGame(): void {
        this.resumeGame(false);
        this.loadSceneWithFade(this.gameSceneName);
    }

    public backToMenu(): void {
        this.resumeGame(false);
        this.loadSceneWithFade(this.menuSceneName);
    }

    public saveCurrentGame(): boolean {
        if (!SaveService.isLoggedIn()) {
            cc.warn("[GameManager] Save failed: login required.");
            return false;
        }
        return SaveService.saveGame(this.createSaveData(SaveService.getCurrentUsername()));
    }

    public loadCurrentUserSave(): boolean {
        const saveData = SaveService.loadGame();
        if (!saveData) {
            cc.warn("[GameManager] Load failed: no save data.");
            this.emitScoreState();
            return false;
        }

        this.score = Math.max(0, saveData.score || 0);
        this.exp = Math.max(0, saveData.exp || 0);
        InventoryManager.instance.setItemsFromSave(saveData.inventory || []);
        this.restorePlayerHp(saveData);
        this.emitScoreState();
        EventCenter.emit(GameEvent.SAVE_LOADED, saveData);
        return true;
    }

    public addScore(amount: number): void {
        if (amount <= 0) {
            return;
        }
        this.score += Math.floor(amount);
        EventCenter.emit(GameEvent.SCORE_CHANGED, this.score);
    }

    public addExp(amount: number): void {
        if (amount <= 0) {
            return;
        }
        this.exp += Math.floor(amount);
        EventCenter.emit(GameEvent.PLAYER_EXP_CHANGED, this.exp);
    }

    onDestroy() {
        cc.director.getScheduler().setTimeScale(1);
        this.setPhysicsPaused(false);
        if (GameManager.instance === this) {
            GameManager.instance = null;
        }
        EventCenter.off(GameEvent.PLAYER_DIED, this.onGameOver, this);
        EventCenter.off(GameEvent.NPC_DIED, this.onNpcDied, this);
        EventCenter.off(GameEvent.ITEM_COLLECTED, this.onItemCollected, this);
        EventCenter.off(GameEvent.MERCHANT_PURCHASED, this.onMerchantPurchased, this);
        if (this.inputManager) {
            this.inputManager.clearOwner(this);
        }
    }

    private setPhysicsPaused(paused: boolean): void {
        const physicsManager = cc.director.getPhysicsManager();
        if (!physicsManager) {
            return;
        }

        if (paused) {
            this.physicsEnabledBeforePause = physicsManager.enabled;
            physicsManager.enabled = false;
            return;
        }

        physicsManager.enabled = this.physicsEnabledBeforePause;
    }

    private handlePausedInput(payload: InputPayload): boolean {
        if (!payload.isDown) {
            return true;
        }

        switch (payload.action) {
            case InputAction.Cancel:
                this.resumeGame();
                return true;
            case InputAction.Retry:
                this.restartGame();
                return true;
            case InputAction.ToggleMute:
                AudioManager.toggleMute();
                return true;
            default:
                return true;
        }
    }

    private handleGameplayInput(payload: InputPayload): boolean {
        if (!payload.isDown) {
            return false;
        }

        switch (payload.action) {
            case InputAction.Cancel:
                this.togglePause();
                return true;
            case InputAction.Retry:
                this.restartGame();
                return true;
            case InputAction.ToggleMute:
                AudioManager.toggleMute();
                return true;
            default:
                return false;
        }
    }

    private getInputManager(): InputManager {
        if (!this.inputManager || !cc.isValid(this.inputManager.node)) {
            this.inputManager = InputManager.getOrCreate(this.node);
        }
        return this.inputManager;
    }

    private onNpcDied(): void {
        this.addScore(this.scorePerNpcKill);
        this.addExp(this.expPerNpcKill);
    }

    private onItemCollected(itemId: string, count: number): void {
        this.addScore(this.scorePerItemCollected * Math.max(1, count || 1));
    }

    private onMerchantPurchased(): void {
        this.addScore(this.scorePerPurchase);
    }

    private emitScoreState(): void {
        EventCenter.emit(GameEvent.SCORE_CHANGED, this.score);
        EventCenter.emit(GameEvent.PLAYER_EXP_CHANGED, this.exp);
    }

    private createSaveData(username: string): SaveData {
        const player = this.playerNode || cc.find("Canvas/Player");
        const playerEntity = player ? (player.getComponent("PlayerController") as any) : null;
        const hp = playerEntity && typeof playerEntity.currentHp === "number" ? playerEntity.currentHp : 0;
        const maxHp = playerEntity && typeof playerEntity.maxHp === "number" ? playerEntity.maxHp : 1;
        return {
            username,
            score: this.score,
            exp: this.exp,
            hp,
            maxHp,
            inventory: InventoryManager.instance.getSaveSnapshot(),
            updatedAt: Date.now()
        };
    }

    private restorePlayerHp(saveData: SaveData): void {
        const player = this.playerNode || cc.find("Canvas/Player");
        const playerEntity = player ? (player.getComponent("PlayerController") as any) : null;
        if (!playerEntity) {
            return;
        }

        playerEntity.maxHp = Math.max(1, saveData.maxHp || playerEntity.maxHp || 1);
        playerEntity.currentHp = Math.max(0, Math.min(saveData.hp || playerEntity.maxHp, playerEntity.maxHp));
        EventCenter.emit(GameEvent.PLAYER_HP_CHANGED, playerEntity.currentHp, playerEntity.maxHp);
    }

    private loadSceneWithFade(sceneName: string): void {
        if (!sceneName) {
            return;
        }

        if (!this.fadeOverlay) {
            cc.director.loadScene(sceneName);
            return;
        }

        this.fadeOverlay.active = true;
        this.fadeOverlay.opacity = 0;
        cc.tween(this.fadeOverlay)
            .to(0.25, { opacity: 255 })
            .call(() => cc.director.loadScene(sceneName))
            .start();
    }

    private setFadeAlpha(alpha: number): void {
        if (!this.fadeOverlay) {
            return;
        }
        this.fadeOverlay.active = alpha > 0;
        this.fadeOverlay.opacity = alpha;
    }
}

import EventCenter from "./EventCenter";
import { GameEvent } from "./Constants";
import AudioManager, { SfxType } from "./AudioManager";
import { InventoryManager } from "../Player/InventoryManager";
import InputManager from "../Input/InputManager";
import { InputAction, InputPayload } from "../Input/InputAction";
import { InputContext } from "../Input/InputContext";
import CameraRig from "./CameraRig";
import HitFeelManager from "./HitFeelManager";
import RealtimeStateReporter from "./RealtimeStateReporter";
import DamageNumberManager from "./DamageNumberManager";
import MonsterSpawner from "../NPC/MonsterSpawner";
import PhysicsTagValidator from "./PhysicsTagValidator";
import AutoMapGenerator from "../Map/AutoMapGenerator";
import SaveService2, { SaveData } from "./SaveService2";
import MapEditorController from "../Map/MapEditorController";

declare const firebase: any;

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

    @property(CameraRig)
    cameraRig: CameraRig = null;

    @property(AutoMapGenerator)
    autoMapGenerator: AutoMapGenerator = null;

    @property(MapEditorController)
    mapEditorController: MapEditorController = null;

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

    @property(cc.Boolean)
    enableAutomaticMonsterSpawning: boolean = true;

    @property(cc.Boolean)
    monsterSpawnDebugLog: boolean = false;

    @property(cc.Boolean)
    physicsTagDebugLog: boolean = false;

    private score: number = 0;
    private exp: number = 0;
    private isPaused: boolean = false;
    private physicsEnabledBeforePause: boolean = true;
    private inputManager: InputManager = null;
    private hitFeelManager: HitFeelManager = null;
    private realtimeStateReporter: RealtimeStateReporter = null;
    private damageNumberManager: DamageNumberManager = null;
    private isMapEditorFreezingGame: boolean = false;
    private schedulerTimeScaleBeforeMapEditor: number = 1;
    private physicsEnabledBeforeMapEditor: boolean = true;
    private isLoadingSave: boolean = false;

    onLoad() {
        // 單例模式 (Singleton)，方便其他腳本直接抓取 GameManager.instance
        if (GameManager.instance === null) {
            GameManager.instance = this;
        } else {
            this.node.destroy();
            return;
        }

        cc.systemEvent.on("INVENTORY_CHANGED", this.saveCurrentGame, this);
        EventCenter.on(GameEvent.PLAYER_DIED, this.onGameOver, this);
        EventCenter.on(GameEvent.NPC_DIED, this.onNpcDied, this);
        EventCenter.on(GameEvent.ITEM_COLLECTED, this.onItemCollected, this);
        EventCenter.on(GameEvent.MERCHANT_PURCHASED, this.onMerchantPurchased, this);
        EventCenter.on(GameEvent.MAP_EDITOR_MODE_CHANGED, this.onMapEditorModeChanged, this);
        this.inputManager = InputManager.getOrCreate(this.node);
        if (this.inputManager) {
            this.inputManager.pushContext(InputContext.Gameplay, this.handleGameplayInput, this);
        }
        if (this.cameraRig && this.playerNode) {
            this.cameraRig.target = this.playerNode;
        } else if (!this.cameraRig) {
            cc.warn("[GameManager] cameraRig is not assigned; attach CameraRig.ts to Main Camera and drag it here.");
        }
        this.hitFeelManager = HitFeelManager.getOrCreate(this.node);
        this.damageNumberManager = DamageNumberManager.getOrCreate(this.node);
        this.realtimeStateReporter = this.getOrCreateRealtimeReporter();

        // 啟用物理引擎
        const physicsManager = cc.director.getPhysicsManager();
        physicsManager.enabled = true;
        physicsManager.debugDrawFlags = this.showPhysicsDebugDraw ? 1 : 0;
        const physicsTagValidator = PhysicsTagValidator.getOrCreate(this.node);
        if (physicsTagValidator) {
            physicsTagValidator.debugLog = this.physicsTagDebugLog;
            physicsTagValidator.validateNow();
        }
        if (this.enableAutomaticMonsterSpawning) {
            const monsterSpawner = MonsterSpawner.getOrCreate(this.node);
            if (monsterSpawner) {
                monsterSpawner.debugLog = this.monsterSpawnDebugLog;
                if (monsterSpawner.positionResolver) {
                    monsterSpawner.positionResolver.debugLog = this.monsterSpawnDebugLog;
                }
            }
        }

        if (this.pausePanel) {
            this.pausePanel.active = false;
        }
        this.setFadeAlpha(0);
    }

    async start() {
        console.log("遊戲初始化完成，準備進入 Cocos Sanctuary! - GameManager.ts:145");
        await this.loadCurrentUserSave();
    }

    async onGameOver() {
        console.log("玩家死亡，結算分數... - GameManager.ts:150");
        this.resumeGame(false);
        const user = firebase.auth().currentUser;
        if (user) {
            const displayName = user.email ? user.email.split('@')[0] : "Player";
            await this.saveCurrentGame();
            await SaveService2.submitScoreToCloud(user.uid, displayName, this.score);
            const top10 = await SaveService2.getTopLeaderboard();
            EventCenter.emit(GameEvent.LEADERBOARD_UPDATED, top10);
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

    public async saveCurrentGame(): Promise<boolean> {
        if (this.isLoadingSave) {
            return false;
        }
        if (!SaveService2) return false;
        const user = firebase.auth().currentUser;
        if (!user) {
            cc.warn("[GameManager] 存檔失敗：未登入 Firebase。");
            return false;
        }
        const saveData = this.createSaveData(user.uid);
        return await SaveService2.saveToCloud(user.uid, saveData);
    }

    public async loadCurrentUserSave(): Promise<boolean> {
        const user = firebase.auth().currentUser;
        if (!user) return false;
        this.isLoadingSave = true;
        const saveData = await SaveService2.loadFromCloud(user.uid);
        
        if (saveData) {
            cc.log(`[DEBUG] 從雲端拿到的存檔資料 -> HP: ${saveData.hp}, EXP: ${saveData.exp}`);
            this.score = saveData.score || 0;
            this.exp = saveData.exp || 0;
            InventoryManager.instance.setItemsFromSave(saveData.inventory || []);
            this.restorePlayerHp(saveData);

            this.emitScoreState();
            EventCenter.emit(GameEvent.SAVE_LOADED, saveData);
            cc.log(`[GameManager] ✅ 讀檔完成：EXP=${this.exp}, HP=${saveData.hp}`);
        }

        this.isLoadingSave = false; // 解鎖
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

    public isGamePaused(): boolean {
        return this.isPaused || this.isMapEditorFreezingGame;
    }

    public enterMapEditorMode(): void {
        const editor = this.getOrCreateMapEditorController();
        if (!editor) {
            cc.warn("[GameManager] MapEditorController is missing; assign mapEditorController or add AutoMapGenerator under Canvas/platform/auto generate.");
            return;
        }
        editor.enterEditorMode();
    }

    public toggleMapEditorMode(): void {
        const editor = this.getOrCreateMapEditorController();
        if (!editor) {
            cc.warn("[GameManager] MapEditorController is missing; cannot toggle map editor.");
            return;
        }
        editor.toggleEditorMode();
    }

    public getScore(): number {
        return this.score;
    }

    public getExp(): number {
        return this.exp;
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
        EventCenter.off(GameEvent.MAP_EDITOR_MODE_CHANGED, this.onMapEditorModeChanged, this);
        if (this.inputManager) {
            this.inputManager.clearOwner(this);
        }
        this.cameraRig = null;
        this.hitFeelManager = null;
        this.realtimeStateReporter = null;
        this.damageNumberManager = null;
    }

    private setPhysicsPaused(paused: boolean): void {
        const physicsManager = cc.director.getPhysicsManager();
        if (!physicsManager) {
            return;
        }

        if (paused) {
            const hitStopRunning = HitFeelManager.instance && HitFeelManager.instance.isHitStopRunning();
            this.physicsEnabledBeforePause = hitStopRunning ? true : physicsManager.enabled;
            physicsManager.enabled = false;
            return;
        }

        physicsManager.enabled = this.physicsEnabledBeforePause;
    }

    private onMapEditorModeChanged(enabled: boolean): void {
        if (enabled) {
            this.freezeGameForMapEditor();
        } else {
            this.unfreezeGameForMapEditor();
        }
    }

    private freezeGameForMapEditor(): void {
        if (this.isMapEditorFreezingGame) {
            return;
        }

        this.isMapEditorFreezingGame = true;
        const scheduler = cc.director.getScheduler();
        this.schedulerTimeScaleBeforeMapEditor = scheduler && typeof scheduler.getTimeScale === "function"
            ? scheduler.getTimeScale()
            : 1;
        if (scheduler) {
            scheduler.setTimeScale(0);
        }

        const physicsManager = cc.director.getPhysicsManager();
        if (physicsManager) {
            this.physicsEnabledBeforeMapEditor = physicsManager.enabled;
            physicsManager.enabled = false;
        }
        EventCenter.emit(GameEvent.GAME_PAUSED);
    }

    private unfreezeGameForMapEditor(): void {
        if (!this.isMapEditorFreezingGame) {
            return;
        }

        this.isMapEditorFreezingGame = false;
        const scheduler = cc.director.getScheduler();
        if (scheduler) {
            scheduler.setTimeScale(this.isPaused ? 0 : this.schedulerTimeScaleBeforeMapEditor || 1);
        }

        if (!this.isPaused) {
            const physicsManager = cc.director.getPhysicsManager();
            if (physicsManager) {
                physicsManager.enabled = this.physicsEnabledBeforeMapEditor;
            }
            EventCenter.emit(GameEvent.GAME_RESUMED);
        }
    }

    private handlePausedInput(payload: InputPayload): boolean {
        if (!payload.isDown) {
            return true;
        }

        switch (payload.action) {
            case InputAction.Cancel:
                this.resumeGame();
                return true;
            case InputAction.ToggleMute:
                AudioManager.toggleMute();
                return true;
            case InputAction.CameraZoomIn:
                this.adjustCameraZoom(1);
                return true;
            case InputAction.CameraZoomOut:
                this.adjustCameraZoom(-1);
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
            case InputAction.ToggleMute:
                AudioManager.toggleMute();
                return true;
            case InputAction.CameraZoomIn:
                this.adjustCameraZoom(1);
                return true;
            case InputAction.CameraZoomOut:
                this.adjustCameraZoom(-1);
                return true;
            case InputAction.GenerateMap:
                this.beginAutoMapGeneration();
                return true;
            case InputAction.ToggleMapEditor:
                this.toggleMapEditorMode();
                return true;
            default:
                return false;
        }
    }

    private adjustCameraZoom(direction: number): void {
        const rig = this.cameraRig || CameraRig.instance;
        if (!rig || !cc.isValid(rig.node)) {
            cc.warn("[GameManager] cameraRig is not assigned; cannot adjust camera zoom.");
            return;
        }
        rig.adjustBaseZoom(direction);
    }

    private beginAutoMapGeneration(): void {
        const generator = this.getAutoMapGenerator();
        if (!generator || !cc.isValid(generator.node)) {
            cc.warn("[GameManager] autoMapGenerator is not assigned; drag Canvas/platform/auto generate AutoMapGenerator here.");
            return;
        }
        generator.beginTimedGeneration();
    }

    private getAutoMapGenerator(): AutoMapGenerator {
        if (this.autoMapGenerator && cc.isValid(this.autoMapGenerator.node)) {
            return this.autoMapGenerator;
        }

        const scene = cc.director.getScene();
        if (!scene) {
            return null;
        }
        const generators = scene.getComponentsInChildren(AutoMapGenerator);
        this.autoMapGenerator = generators.length > 0 ? generators[0] : null;
        return this.autoMapGenerator;
    }

    private getOrCreateMapEditorController(): MapEditorController {
        if (this.mapEditorController && cc.isValid(this.mapEditorController.node)) {
            this.wireMapEditorController(this.mapEditorController);
            return this.mapEditorController;
        }

        const scene = cc.director.getScene();
        if (scene) {
            const editors = scene.getComponentsInChildren(MapEditorController);
            if (editors.length > 0) {
                this.mapEditorController = editors[0];
                this.wireMapEditorController(this.mapEditorController);
                return this.mapEditorController;
            }
        }

        const generator = this.getAutoMapGenerator();
        const host = generator && cc.isValid(generator.node) ? generator.node : this.node;
        let editor = host.getComponent(MapEditorController);
        if (!editor) {
            editor = host.addComponent(MapEditorController);
        }
        this.mapEditorController = editor;
        this.wireMapEditorController(editor);
        return editor;
    }

    private wireMapEditorController(editor: MapEditorController): void {
        if (!editor) {
            return;
        }

        const generator = this.getAutoMapGenerator();
        if (!editor.autoMapGenerator && generator) {
            editor.autoMapGenerator = generator;
        }
        if (!editor.playerNode && this.playerNode) {
            editor.playerNode = this.playerNode;
        }
        if (!editor.cameraRig && this.cameraRig) {
            editor.cameraRig = this.cameraRig;
        }
        if (generator) {
            if (!editor.terrainRoot && generator.targetRoot) {
                editor.terrainRoot = generator.targetRoot;
            }
            if (!editor.resourceRoot && generator.resourceRoot) {
                editor.resourceRoot = generator.resourceRoot;
            }
        }
    }

    private getInputManager(): InputManager {
        if (!this.inputManager || !cc.isValid(this.inputManager.node)) {
            this.inputManager = InputManager.getOrCreate(this.node);
        }
        return this.inputManager;
    }

    private getOrCreateRealtimeReporter(): RealtimeStateReporter {
        let reporter = this.getComponent(RealtimeStateReporter);
        if (!reporter) {
            reporter = this.node.addComponent(RealtimeStateReporter);
        }
        reporter.playerNode = this.playerNode;
        reporter.sceneName = this.gameSceneName || "Game";
        return reporter;
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

    private createSaveData(uid: string): Partial<SaveData> {
        const player = this.getPlayerNode();
        const playerEntity = player ? (player.getComponent("PlayerController") as any) : null;
        if (playerEntity) {
            cc.log(`[DEBUG] 發現玩家元件，當前 HP=${playerEntity.currentHp}, MAX=${playerEntity.maxHp}`);
        } else {
            cc.error("[DEBUG] ❌ 找不到 PlayerController 元件！");
        }

        return {
            uid: uid,
            score: this.score,
            exp: this.exp,
            hp: playerEntity ? playerEntity.currentHp : 100,
            maxHp: playerEntity ? playerEntity.maxHp : 100,
            inventory: InventoryManager.instance.getSaveSnapshot(),
            updatedAt: Date.now()
        };
    }

    private restorePlayerHp(saveData: SaveData): void {
        const player = this.getPlayerNode();
        const playerEntity = player ? (player.getComponent("PlayerController") as any) : null;
        if (!playerEntity) {
            cc.error("❌ 找不到 PlayerController！");
            return;
        }
        playerEntity.maxHp = saveData.maxHp;
        playerEntity.currentHp = saveData.hp;
        cc.log(`[DEBUG] 強制寫入 HP: ${playerEntity.currentHp} / ${playerEntity.maxHp}`);
        EventCenter.emit(GameEvent.PLAYER_HP_CHANGED, playerEntity.currentHp, playerEntity.maxHp);
    }

    private getPlayerNode(): cc.Node {
        if (this.playerNode && cc.isValid(this.playerNode)) {
            return this.playerNode;
        }

        cc.warn("[GameManager] playerNode is not assigned; drag Player to GameManager.playerNode.");
        return null;
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

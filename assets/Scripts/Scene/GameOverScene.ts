import SaveService from "../Core/SaveService";
import AudioManager, { SfxType } from "../Core/AudioManager";
import { getActionForKey } from "../Input/InputBindings";
import { InputAction } from "../Input/InputAction";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameOverScene extends cc.Component {
    @property
    gameSceneName: string = "Game";

    @property
    menuSceneName: string = "MenuScene";

    @property(cc.Label)
    titleLabel: cc.Label = null;

    @property(cc.Label)
    usernameLabel: cc.Label = null;

    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.Label)
    expLabel: cc.Label = null;

    @property(cc.Label)
    statusLabel: cc.Label = null;

    @property(cc.Node)
    fadeOverlay: cc.Node = null;

    private score: number = 0;

    onLoad(): void {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        this.setFadeAlpha(0);
    }

    start(): void {
        const lastRun = SaveService.getLastRun();
        this.score = lastRun.score || 0;

        if (this.titleLabel) {
            this.titleLabel.string = "Game Over";
        }
        if (this.usernameLabel) {
            this.usernameLabel.string = `Player: ${lastRun.username || "guest"}`;
        }
        if (this.scoreLabel) {
            this.scoreLabel.string = `Score: ${lastRun.score || 0}`;
        }
        if (this.expLabel) {
            this.expLabel.string = `EXP: ${lastRun.exp || 0}`;
        }
        if (this.statusLabel) {
            this.statusLabel.string = SaveService.isLoggedIn()
                ? "Submit score or retry."
                : "Login from menu to save scores.";
        }
    }

    public retry(): void {
        AudioManager.play(SfxType.SKILL);
        this.loadSceneWithFade(this.gameSceneName);
    }

    public goToMainMenu(): void {
        AudioManager.play(SfxType.SKILL);
        this.loadSceneWithFade(this.menuSceneName);
    }

    public submitScore(): void {
        const username = SaveService.getCurrentUsername();
        if (!username) {
            this.setStatus("Login required before submitting score.");
            return;
        }

        SaveService.submitScore(username, this.score);
        this.setStatus("Score submitted.");
        AudioManager.play(SfxType.COLLECT);
    }

    onDestroy(): void {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    private onKeyDown(event: cc.Event.EventKeyboard): void {
        switch (getActionForKey(event.keyCode)) {
            case InputAction.Cancel:
                this.goToMainMenu();
                return;
            case InputAction.ToggleMute:
                AudioManager.toggleMute();
                return;
            default:
                return;
        }
    }

    private setStatus(message: string): void {
        if (this.statusLabel) {
            this.statusLabel.string = message;
        }
    }

    private loadSceneWithFade(sceneName: string): void {
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

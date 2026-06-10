import EventCenter from "../Core/EventCenter";
import { GameEvent } from "../Core/Constants";
import SaveService from "../Core/SaveService";
import AudioManager, { SfxType } from "../Core/AudioManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class MenuScene extends cc.Component {

    @property(cc.string)
    gameScene: string = "Game";

    @property(cc.Node)
    mainPanel: cc.Node = null;

    @property(cc.Node)
    loginPanel: cc.Node = null;

    @property(cc.Node)
    settingsPanel: cc.Node = null;

    @property(cc.Node)
    leaderboardPanel: cc.Node = null;

    @property(cc.Node)
    fadeOverlay: cc.Node = null;

    @property(cc.EditBox)
    usernameInput: cc.EditBox = null;

    @property(cc.EditBox)
    passwordInput: cc.EditBox = null;

    @property(cc.Label)
    statusLabel: cc.Label = null;

    @property(cc.Label)
    currentUserLabel: cc.Label = null;

    @property([cc.Label])
    leaderboardLabels: cc.Label[] = [];

    onLoad(): void {
        EventCenter.on(GameEvent.LEADERBOARD_UPDATED, this.refreshLeaderboard, this);
        this.setFadeAlpha(0);
    }

    start(): void {
        this.showMain();
        this.refreshAuthState();
        this.refreshLeaderboard();
    }

    public goToGameScene(): void {
        AudioManager.play(SfxType.SKILL);
        this.loadSceneWithFade(this.gameScene);
    }

    public loadSavedGame(): void {
        if (!SaveService.requestLoadOnNextGame()) {
            this.setStatus("No save found. Login and save in game first.");
            return;
        }

        this.setStatus("Loading save...");
        this.goToGameScene();
    }

    public register(): void {
        const result = SaveService.register(this.getUsername(), this.getPassword());
        this.setStatus(result.message);
        this.refreshAuthState();
    }

    public login(): void {
        const result = SaveService.login(this.getUsername(), this.getPassword());
        this.setStatus(result.message);
        this.refreshAuthState();
    }

    public logout(): void {
        SaveService.logout();
        this.setStatus("Logged out.");
        this.refreshAuthState();
    }

    public showMain(): void {
        this.setPanel(this.mainPanel, true);
        this.setPanel(this.loginPanel, false);
        this.setPanel(this.settingsPanel, false);
        this.setPanel(this.leaderboardPanel, false);
    }

    public showLogin(): void {
        this.setPanel(this.mainPanel, false);
        this.setPanel(this.loginPanel, true);
        this.setPanel(this.settingsPanel, false);
        this.setPanel(this.leaderboardPanel, false);
    }

    public showSettings(): void {
        this.setPanel(this.mainPanel, false);
        this.setPanel(this.loginPanel, false);
        this.setPanel(this.settingsPanel, true);
        this.setPanel(this.leaderboardPanel, false);
    }

    public showLeaderboard(): void {
        this.setPanel(this.mainPanel, false);
        this.setPanel(this.loginPanel, false);
        this.setPanel(this.settingsPanel, false);
        this.setPanel(this.leaderboardPanel, true);
        this.refreshLeaderboard();
    }

    public toggleMute(): void {
        const muted = AudioManager.toggleMute();
        this.setStatus(muted ? "Audio muted." : "Audio on.");
    }

    onDestroy(): void {
        EventCenter.off(GameEvent.LEADERBOARD_UPDATED, this.refreshLeaderboard, this);
    }

    private refreshAuthState(): void {
        if (this.currentUserLabel) {
            const username = SaveService.getCurrentUsername();
            this.currentUserLabel.string = username ? `User: ${username}` : "User: guest";
        }
    }

    private refreshLeaderboard(): void {
        const entries = SaveService.getLeaderboard();
        for (let i = 0; i < this.leaderboardLabels.length; i++) {
            const label = this.leaderboardLabels[i];
            if (!label) {
                continue;
            }

            const entry = entries[i];
            label.string = entry
                ? `${i + 1}. ${entry.username} - ${entry.score}`
                : `${i + 1}. ---`;
        }
    }

    private getUsername(): string {
        return this.usernameInput ? this.usernameInput.string : "";
    }

    private getPassword(): string {
        return this.passwordInput ? this.passwordInput.string : "";
    }

    private setStatus(message: string): void {
        if (this.statusLabel) {
            this.statusLabel.string = message;
        }
    }

    private setPanel(panel: cc.Node, active: boolean): void {
        if (panel) {
            panel.active = active;
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

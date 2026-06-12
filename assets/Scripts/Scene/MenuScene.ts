import EventCenter from "../Core/EventCenter";
import { GameEvent } from "../Core/Constants";
import SaveService from "../Core/SaveService";
import AudioManager, { SfxType } from "../Core/AudioManager";

const {ccclass, property} = cc._decorator;

// 告訴 TypeScript 我們已經透過插件載入了 firebase
declare const firebase: any;

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
        this.initFirebase();
    }

    start(): void {
        this.showMain();
        this.refreshAuthState();
        this.refreshLeaderboard();
    }

    private initFirebase() {
        const firebaseConfig = {
            apiKey: "AIzaSyCq9gGI7AFY8zY82HLUdJLuDzK1HeUs1EM",
            authDomain: "coconut-sanctuary.firebaseapp.com",
            projectId: "coconut-sanctuary",
            storageBucket: "coconut-sanctuary.firebasestorage.app",
            messagingSenderId: "300648797657",
            appId: "1:300648797657:web:dce0646506855e761fb5c8",
            measurementId: "G-70LXBJCEZY"
        };

        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
            cc.log("[Firebase] 椰子聖地連線成功！");
        }
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
        const email = this.getUsername();
        const password = this.getPassword();

        if (!email || !password) {
            this.setStatus("請輸入帳號密碼");
            return;
        }

        this.setStatus("註冊中...");
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential: any) => {
                this.setStatus("註冊成功！");
                cc.log("註冊成功 UID:", userCredential.user.uid);
                // 註冊成功後直接載入場景 (帶有你原本的淡出特效！)
                this.goToGameScene(); 
            })
            .catch((error: any) => {
                this.setStatus(`註冊失敗: ${error.message}`);
                cc.error("註冊失敗:", error.code, error.message);
            });
    }

    public login(): void {
        const email = this.getUsername();
        const password = this.getPassword();

        if (!email || !password) {
            this.setStatus("請輸入帳號密碼");
            return;
        }

        this.setStatus("登入中...");
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential: any) => {
                this.setStatus("登入成功！");
                cc.log("登入成功 UID:", userCredential.user.uid);
                this.goToGameScene(); 
            })
            .catch((error: any) => {
                this.setStatus(`登入失敗: ${error.message}`);
                cc.error("登入失敗:", error.code, error.message);
            });
    }

    public logout(): void {
        firebase.auth().signOut().then(() => {
            this.setStatus("Logged out.");
            this.refreshAuthState();
        });
    }

    public showMain(): void {
        this.setPanel(this.mainPanel, true);
        this.setPanel(this.loginPanel, false);
        this.setPanel(this.settingsPanel, false);
        this.setPanel(this.leaderboardPanel, false);
    }

    public showLogin(): void {
        cc.log("👉 成功觸發 showLogin！正在切換面板..."); 
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
        // Firebase 抓取當前使用者的狀態
        firebase.auth().onAuthStateChanged((user: any) => {
            if (this.currentUserLabel) {
                this.currentUserLabel.string = user ? `User: ${user.email}` : "User: guest";
            }
        });
    }

    private refreshLeaderboard(): void {
        const entries = SaveService.getLeaderboard();
        for (let i = 0; i < this.leaderboardLabels.length; i++) {
            const label = this.leaderboardLabels[i];
            if (!label) continue;
            const entry = entries[i];
            label.string = entry ? `${i + 1}. ${entry.username} - ${entry.score}` : `${i + 1}. ---`;
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
        if (!this.fadeOverlay) return;
        this.fadeOverlay.active = alpha > 0;
        this.fadeOverlay.opacity = alpha;
    }
}
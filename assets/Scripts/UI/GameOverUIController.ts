const { ccclass, property } = cc._decorator;

@ccclass
export default class GameOverUIController extends cc.Component {
    @property(cc.Node)
    retryBtn: cc.Node = null!;

    @property(cc.Node)
    menuBtn: cc.Node = null!;

    onLoad() {
        if (this.retryBtn) {
            this.retryBtn.on('click', this.onRetryClicked, this);
        }
        if (this.menuBtn) {
            this.menuBtn.on('click', this.onMenuClicked, this);
        }
    }

    private onRetryClicked() {
        cc.log("[GameOver] 重新開始...");
        cc.director.loadScene("Game");
    }

    private onMenuClicked() {
        cc.log("[GameOver] 返回主選單...");
        cc.director.loadScene("MenuScene");
    }
}
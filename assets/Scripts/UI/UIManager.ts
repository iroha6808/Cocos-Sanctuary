// 路徑: assets/Scripts/UI/UIManager.ts
import { EventCenter } from "../Core/EventCenter";
import { GameEvent } from "../Core/Constants";

const { ccclass, property } = cc._decorator;

@ccclass
export default class UIManager extends cc.Component {

    @property(cc.Label)
    expLabel: cc.Label = null;

    @property(cc.ProgressBar)
    hpBar: cc.ProgressBar = null;

    onLoad() {
        // 綁定事件：當資料改變時，UI 才會跟著動
        EventCenter.on(GameEvent.PLAYER_HP_CHANGED, this.onHpUpdated, this);
        EventCenter.on(GameEvent.PLAYER_EXP_CHANGED, this.onExpUpdated, this);
    }

    private onHpUpdated(currentHp: number, maxHp: number) {
        if (this.hpBar) {
            this.hpBar.progress = currentHp / maxHp;
        }
    }

    private onExpUpdated(currentExp: number) {
        if (this.expLabel) {
            this.expLabel.string = `EXP: ${currentExp}`;
        }
    }

    onDestroy() {
        EventCenter.off(GameEvent.PLAYER_HP_CHANGED, this.onHpUpdated);
        EventCenter.off(GameEvent.PLAYER_EXP_CHANGED, this.onExpUpdated);
    }
}
import EventCenter from "../Core/EventCenter";
import { GameEvent } from "../Core/Constants";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BuffUIController extends cc.Component {

    @property(cc.Label)
    buffLabel: cc.Label = null!;

    onLoad() {
        
        EventCenter.on(GameEvent.BUFF_UPDATED, this.onBuffUpdated, this);
        
        if (this.buffLabel) {
            this.buffLabel.string = ""; 
        }
    }

    onDestroy() {
        EventCenter.off(GameEvent.BUFF_UPDATED, this.onBuffUpdated, this);
    }

    private onBuffUpdated(buffs: any[]) {

        if (!this.buffLabel) {
            return;
        }

        if (buffs.length === 0) {
            this.buffLabel.string = ""; 
            return;
        }

        let text = "";
        for (let buff of buffs) {
            if (buff.type === 'attack') {
                text += `ATK+${buff.amount} (${Math.ceil(buff.timer)}s)\n`;
            }
            else if (buff.type === 'defense') {
                text += `DEF+${buff.amount} (${Math.ceil(buff.timer)}s)\n`;
            }
        }
        this.buffLabel.string = text.trim();
    }
}
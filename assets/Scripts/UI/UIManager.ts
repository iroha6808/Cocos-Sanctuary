import EventCenter from "../Core/EventCenter";
import { GameEvent } from "../Core/Constants";

const { ccclass, property } = cc._decorator;

export enum ModalUIType {
    NONE = 0,
    INVENTORY = 1,
    DIALOGUE = 2,
    SHOP = 3,
    CRAFTING = 4
}

cc.Enum(ModalUIType);

@ccclass
export default class UIManager extends cc.Component {

    @property(cc.Label)
    expLabel: cc.Label = null;

    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.ProgressBar)
    hpBar: cc.ProgressBar = null;

    @property(cc.Label)
    hpLabel: cc.Label = null;

    private activeModal: ModalUIType = ModalUIType.NONE;

    onLoad() {
        EventCenter.on(GameEvent.PLAYER_HP_CHANGED, this.onHpUpdated, this);
        EventCenter.on(GameEvent.PLAYER_EXP_CHANGED, this.onExpUpdated, this);
        EventCenter.on(GameEvent.SCORE_CHANGED, this.onScoreUpdated, this);
    }

    public tryOpenModal(type: ModalUIType): boolean {
        if (type === ModalUIType.NONE) {
            return false;
        }
        if (this.activeModal !== ModalUIType.NONE && this.activeModal !== type) {
            return false;
        }
        this.activeModal = type;
        return true;
    }

    public closeModal(type: ModalUIType): void {
        if (this.activeModal === type) {
            this.activeModal = ModalUIType.NONE;
        }
    }

    public isModalOpen(type?: ModalUIType): boolean {
        return type === undefined
            ? this.activeModal !== ModalUIType.NONE
            : this.activeModal === type;
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

    private onScoreUpdated(currentScore: number) {
        if (this.scoreLabel) {
            this.scoreLabel.string = `Score: ${currentScore}`;
        }
    }

    onDestroy() {
        EventCenter.off(GameEvent.PLAYER_HP_CHANGED, this.onHpUpdated, this);
        EventCenter.off(GameEvent.PLAYER_EXP_CHANGED, this.onExpUpdated, this);
        EventCenter.off(GameEvent.SCORE_CHANGED, this.onScoreUpdated, this);
    }
}

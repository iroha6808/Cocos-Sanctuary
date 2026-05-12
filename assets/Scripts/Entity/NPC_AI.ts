import BaseEntity from "../Core/BaseEntity";
import { EntityType } from "../Core/Constants";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NPC_AI extends BaseEntity {

    @property(cc.Float)
    detectRadius: number = 300; 

    private isEnraged: boolean = false;
    private targetPlayer: cc.Node = null;

    update(dt: number) {
        if (!this.targetPlayer) return;

        let distance = this.node.position.sub(this.targetPlayer.position).mag();

        if (this.type === EntityType.NPC_HOSTILE) {
            if (distance < this.detectRadius) {
                this.attackTarget();
            }
        } else if (this.type === EntityType.NPC_NEUTRAL) {
            if (this.isEnraged && distance < this.detectRadius) {
                this.attackTarget();
            }
        }
    }

    public onMocked(playerNode: cc.Node) {
        if (this.type === EntityType.NPC_NEUTRAL) {
            this.isEnraged = true;
            this.targetPlayer = playerNode;
        }
    }

    private attackTarget() {
        // 實作攻擊邏輯
    }

    protected die() {
        this.node.destroy();
    }
}
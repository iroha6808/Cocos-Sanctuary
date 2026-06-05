const { ccclass, property } = cc._decorator;
import DropItem from '../DropItem';
import { InventoryManager } from '../../../Player/InventoryManager';

@ccclass
export default class FoodBase extends DropItem {

    @property({ tooltip: '食物顯示名稱' }) foodName: string = '';
    @property({ tooltip: '恢復生命值' })   hpRestore: number = 0;
    @property({ tooltip: '恢復體力' })     staminaRestore: number = 0;

    init(data: { name: string; hp: number; stamina: number }) {
        this.foodName       = data.name;
        this.hpRestore      = data.hp;
        this.staminaRestore = data.stamina;
    }

    private collect() {
        const id          = (this.foodName || this.itemName).toLowerCase();
        const name        = this.foodName || this.itemName;
        const description = `恢復 ${this.hpRestore} HP 和 ${this.staminaRestore} 體力`;
        // 嘗試找到背包
        cc.log(`[FoodBase] 嘗試將 ${name} 加入背包...`);
        if (!InventoryManager.instance) {
            cc.error('[FoodBase] 無法找到 InventoryManager，無法加入背包');
            return;
        }
        const added = InventoryManager.instance.addItem(id, name, 1, description);
        if (added) {
            cc.log(`[FoodBase] ${name} 已加入背包`);
        } else {
            cc.warn(`[FoodBase] 背包已滿，${name} 無法加入`);
        }
        this.node.destroy();
    }

    eat(player: cc.Node) {
        const stats = player.getComponent('PlayerStats');
        if (stats) {
            stats.restoreHp(this.hpRestore);
            stats.restoreStamina(this.staminaRestore);
        } else {
            cc.error('[FoodBase] Player 缺少 PlayerStats 組件');
        }
        this.node.destroy();
    }
}
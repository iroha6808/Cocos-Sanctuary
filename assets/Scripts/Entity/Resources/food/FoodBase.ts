const { ccclass, property } = cc._decorator;
import DropItem from '../DropItem';
import { InventoryManager } from '../../../Player/InventoryManager';

export enum ItemMode{
    Object = 0, // 物件模式：純物理，不可吸附，不可撿起
    Drop = 1, // 掉落物模式：可被吸附、收進背包
}

export enum ItemState {
    Flying = 0,
    Resting = 1,
    Attracting = 2,
    Held = 3,
}

@ccclass
export default class FoodBase extends DropItem {

    @property({ tooltip: '食物顯示名稱' }) foodName: string = '';
    @property({ tooltip: '吃掉後恢復的 HP' })   hpRestore: number = 0;
    @property({ tooltip: '吃掉後恢復的體力' })  staminaRestore: number = 0;
    @property({ tooltip: '腐敗時間（秒），-1 為永不腐敗' }) rottenTime: number = -1;
    rottenTimer: number = 0;
    isRotten: boolean   = false;

    onLoad() {
        super.onLoad();
        cc.log(`[FoodBase] onLoad → ${this.foodName || this.itemName}, rottenTime=${this.rottenTime}`);
    }

    init(data: { name: string; hp: number; stamina: number }) {
        this.foodName       = data.name;
        this.hpRestore      = data.hp;
        this.staminaRestore = data.stamina;
    }

    collect() {
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
        if (added) cc.log(`[FoodBase] ${name} 已加入背包`);
        else cc.warn(`[FoodBase] 背包已滿，${name} 無法加入`);
        this.node.destroy();
    }

    eat(player: cc.Node) {
        const stats = player.getComponent('PlayerStats');
        if (stats) {
            stats.restoreHp(this.hpRestore);
            stats.restoreStamina(this.staminaRestore);
            cc.log(`[FoodBase] ${this.foodName} 吃掉，恢復 HP=${this.hpRestore} 體力=${this.staminaRestore}`);
        } else cc.error('[FoodBase] Player 缺少 PlayerStats 組件');
        this.node.destroy();
    }

    // ── 腐敗計時（只在 Object 模式下運作） ──────────
    update(dt: number) {
        super.update(dt); // 讓父類處理吸附邏輯（Drop 模式時）

        if (this.mode !== ItemMode.Object) return;
        if (this.rottenTime < 0)           return;
        if (this.isRotten)                 return;

        this.rottenTimer += dt;
        if (this.rottenTimer >= this.rottenTime) {
            this.onRotten();
        }
    }

    protected onRotten() {
        this.isRotten = true;
        cc.log(`[FoodBase] ${this.foodName || this.itemName} 已腐敗，從場景移除`);
        this.node.destroy();
    }

    changeMode(newState: ItemMode) {
        this.mode = newState;
    }

    changeState(newState: ItemState) {
        this.state = newState;
    }
}
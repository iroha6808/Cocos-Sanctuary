export interface Item {
    id: string;          // 道具唯一 ID (例如 "apple", "potion")
    name: string;        // 顯示名稱
    count: number;       // 數量
    description: string; // 描述
}

export class InventoryManager {
    private static _instance: InventoryManager = null;
    
    // 全域唯一訪問點
    public static get instance(): InventoryManager {
        if (!this._instance) {
            this._instance = new InventoryManager();
        }
        return this._instance;
    }

    private items: Item[] = [];
    public maxSlots: number = 45;

    public addItem(id: string, name: string, count: number = 1, description: string = ""): boolean {
        // 1. 檢查背包裡是不是已經有這個道具了（疊加數量）
        let existingItem = this.items.find(item => item.id === id);
        if (existingItem) {
            existingItem.count += count;
            this.notifyUI();
            return true;
        }

        // 2. 如果是新道具，檢查格子夠不夠
        if (this.items.length >= this.maxSlots) {
            cc.log("背包滿了！放不下了！");
            return false;
        }

        this.items.push({ id, name, count, description });
        this.notifyUI();
        return true;
    }

    public getItems(): Item[] {
        return this.items;
    }

    private notifyUI() {
        cc.systemEvent.emit("INVENTORY_CHANGED");
    }
}
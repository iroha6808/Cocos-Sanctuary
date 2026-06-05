export interface Item {
    id: string;
    name: string;
    count: number; // 統一使用 count
    description: string;
}

import { getItemDefinition } from "../Data/ItemData";

export class InventoryManager {
    private static _instance: InventoryManager = null!;

    public static get instance(): InventoryManager {
        if (!this._instance) {
            this._instance = new InventoryManager();
        }
        return this._instance;
    }

    private items: Item[] = [];
    public maxSlots: number = 40; 

    public addItem(id: string, count: any = 1): boolean {
        // ❌ 移除 parseInt 保底！改用嚴格型態檢查
        if (typeof count !== "number" || isNaN(count)) {
            cc.error(`[背包大腦] 🛑 嚴重錯誤！傳入的數量不是有效的數字！`);
            cc.error(`[背包大腦] 錯誤來源 ID: ${id} | 丟進來的數量內容物實際為:`, count);
            return false; // 拒絕寫入，直接暴露問題
        }

        const def = getItemDefinition(id);
        if (!def) {
            cc.error(`[背包大腦] 錯誤：在 ITEM_DATA 中找不到 ID: ${id}`);
            return false;
        }

        let existingItem = this.items.find(i => i.id === id);
        if (existingItem) {
            existingItem.count += count; 
        } else {
            if (this.items.length >= this.maxSlots) { 
                cc.log("[背包大腦] 背包已滿！");
                return false;
            }
            this.items.push({
                id: id,
                name: def.name,
                count: count, 
                description: def.description
            });
        }

        cc.log(`[背包大腦] 🟢 成功放入真實數字：${def.name} x ${count}`);
        this.refreshUI();
        this.notifyUI();
        return true;
    }

    public removeItem(id: string, amount: number = 1): boolean {
        let item = this.items.find(i => i.id === id);
        if (!item) return false;

        // 🟢 修正：amount -> count
        item.count -= amount;
        if (item.count <= 0) {
            this.items = this.items.filter(i => i.id !== id);
        }

        cc.log(`[背包大腦] 扣除 ${id} x ${amount}`);
        this.refreshUI(); 
        this.notifyUI();
        return true;
    }

    private refreshUI() {
        const uiNode = cc.find("Canvas/UI Root/InventoryUI"); 
        if (uiNode) {
            const uiCtrl = uiNode.getComponent("InventoryUIController");
            if (uiCtrl) uiCtrl.refreshUI();
        }
    }

    public getItemCount(id: string): number {
        const existingItem = this.items.find(item => item.id === id);
        return existingItem ? existingItem.count : 0;
    }

    public hasItem(id: string, count: number = 1): boolean {
        return this.getItemCount(id) >= count;
    }

    public getItems(): Item[] {
        return this.items;
    }

    private notifyUI() {
        cc.systemEvent.emit("INVENTORY_CHANGED");
    }
}
import { getItemDefinition } from "../Data/ItemData";

export interface Item {
    id: string;
    name: string;
    count: number;
    description: string;
}

export interface ItemAmount {
    itemId: string;
    count: number;
}

export class InventoryManager {
    private static _instance: InventoryManager = null;

    public static get instance(): InventoryManager {
        if (!this._instance) {
            this._instance = new InventoryManager();
        }
        return this._instance;
    }

    private items: Item[] = [];
    public maxSlots: number = 40;

    public addItem(id: string, count: number = 1): boolean {
        return this.transact([], [{ itemId: id, count }]);
    }

    public removeItem(id: string, count: number = 1): boolean {
        return this.removeItems([{ itemId: id, count }]);
    }

    public canAddItem(itemId: string, count: number): boolean {
        return this.buildTransactionResult([], [{ itemId, count }]) !== null;
    }

    public hasItem(id: string, count: number = 1): boolean {
        return this.getItemCount(id) >= count;
    }

    public hasItems(requirements: ItemAmount[]): boolean {
        const normalized = this.normalizeAmounts(requirements);
        return !!normalized && normalized.every(item => this.getItemCount(item.itemId) >= item.count);
    }

    public removeItems(requirements: ItemAmount[]): boolean {
        return this.transact(requirements, []);
    }

    public transact(remove: ItemAmount[], add: ItemAmount[]): boolean {
        const result = this.buildTransactionResult(remove, add);
        if (!result) {
            return false;
        }

        this.items = result;
        cc.systemEvent.emit("INVENTORY_CHANGED");
        return true;
    }

    public getItemCount(id: string): number {
        const item = this.items.find(current => current.id === id);
        return item ? item.count : 0;
    }

    public getItemsSnapshot(): Item[] {
        return this.items.map(item => ({ ...item }));
    }

    public getItems(): Item[] {
        return this.getItemsSnapshot();
    }

    private buildTransactionResult(remove: ItemAmount[], add: ItemAmount[]): Item[] | null {
        const normalizedRemove = this.normalizeAmounts(remove);
        const normalizedAdd = this.normalizeAmounts(add);
        if (!normalizedRemove || !normalizedAdd || !this.hasItems(normalizedRemove)) {
            return null;
        }

        const counts: { [itemId: string]: number } = {};
        for (const item of this.items) {
            counts[item.id] = item.count;
        }
        for (const item of normalizedRemove) {
            counts[item.itemId] = (counts[item.itemId] || 0) - item.count;
        }
        for (const item of normalizedAdd) {
            counts[item.itemId] = (counts[item.itemId] || 0) + item.count;
        }

        const itemIds = Object.keys(counts).filter(itemId => counts[itemId] > 0);
        if (itemIds.length > this.maxSlots) {
            return null;
        }

        const result: Item[] = [];
        for (const itemId of itemIds) {
            const definition = getItemDefinition(itemId);
            if (!definition) {
                cc.error(`[InventoryManager] Unknown item id: ${itemId}`);
                return null;
            }
            result.push({
                id: itemId,
                name: definition.name,
                count: counts[itemId],
                description: definition.description
            });
        }
        return result;
    }

    private normalizeAmounts(amounts: ItemAmount[]): ItemAmount[] | null {
        if (!amounts) {
            return null;
        }

        const totals: { [itemId: string]: number } = {};
        for (const amount of amounts) {
            if (
                !amount
                || !amount.itemId
                || typeof amount.count !== "number"
                || !isFinite(amount.count)
                || Math.floor(amount.count) !== amount.count
                || amount.count <= 0
                || !getItemDefinition(amount.itemId)
            ) {
                return null;
            }
            totals[amount.itemId] = (totals[amount.itemId] || 0) + amount.count;
        }

        return Object.keys(totals).map(itemId => ({ itemId, count: totals[itemId] }));
    }
}

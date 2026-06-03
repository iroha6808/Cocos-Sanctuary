export interface Item {
    id: string;
    name: string;
    count: number;
    description: string;
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
    public maxSlots: number = 45;

    public addItem(id: string, name: string, count: number = 1, description: string = ""): boolean {
        if (!id || count <= 0) {
            return false;
        }

        const existingItem = this.items.find(item => item.id === id);
        if (existingItem) {
            existingItem.count += count;
            existingItem.name = name || existingItem.name;
            existingItem.description = description || existingItem.description;
            this.notifyUI();
            return true;
        }

        if (this.items.length >= this.maxSlots) {
            cc.log("Inventory is full.");
            return false;
        }

        this.items.push({ id, name, count, description });
        this.notifyUI();
        return true;
    }

    public removeItem(id: string, count: number = 1): boolean {
        if (!id || count <= 0) {
            return false;
        }

        const existingItem = this.items.find(item => item.id === id);
        if (!existingItem || existingItem.count < count) {
            return false;
        }

        existingItem.count -= count;

        if (existingItem.count <= 0) {
            this.items = this.items.filter(item => item.id !== id);
        }

        this.notifyUI();
        return true;
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

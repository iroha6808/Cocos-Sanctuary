import { CraftingRecipe, getCraftingRecipes, RecipeType } from "../Data/RecipeData";
import { InventoryManager, ItemAmount } from "../Player/InventoryManager";
import RecipeMatcher, {
    CraftingGridSlot,
    RecipeMatch,
    SlotConsumption
} from "./RecipeMatcher";

export interface CraftingSlot extends CraftingGridSlot {
}

export default class CraftingSession {
    private static _shared: CraftingSession = null;

    public static get shared(): CraftingSession {
        if (!this._shared) {
            this._shared = new CraftingSession();
        }
        return this._shared;
    }

    private slots: CraftingSlot[] = [];
    private recipes: CraftingRecipe[] = [];
    private stationType: string = "crafting_table";
    private currentMatch: RecipeMatch = null;

    constructor(recipes?: CraftingRecipe[], stationType: string = "crafting_table") {
        this.stationType = stationType;
        this.recipes = recipes ? recipes.slice() : getCraftingRecipes(stationType);
        this.resetSlots();
        this.refreshMatch();
    }

    public placeItem(index: number, itemId: string, count: number = 1): boolean {
        if (!this.isValidIndex(index) || !itemId || !this.isPositiveInteger(count)) {
            return false;
        }

        const slot = this.slots[index];
        if (slot.itemId && slot.itemId !== itemId) {
            return false;
        }
        if (!InventoryManager.instance.removeItem(itemId, count)) {
            return false;
        }

        slot.itemId = itemId;
        slot.count += count;
        this.changed();
        return true;
    }

    public takeItem(index: number, count: number = 1): boolean {
        if (!this.isValidIndex(index) || !this.isPositiveInteger(count)) {
            return false;
        }

        const slot = this.slots[index];
        if (!slot.itemId || slot.count < count) {
            return false;
        }
        if (!InventoryManager.instance.addItem(slot.itemId, count)) {
            return false;
        }

        slot.count -= count;
        if (slot.count === 0) {
            slot.itemId = null;
        }
        this.changed();
        return true;
    }

    public clearSlot(index: number): boolean {
        if (!this.isValidIndex(index)) {
            return false;
        }
        const slot = this.slots[index];
        return !slot.itemId || this.takeItem(index, slot.count);
    }

    public returnSlotToInventory(index: number): boolean {
        if (!this.isValidIndex(index)) {
            return false;
        }
        const slot = this.slots[index];
        return !slot.itemId || this.takeItem(index, slot.count);
    }

    public moveSlot(fromIndex: number, toIndex: number): boolean {
        if (
            !this.isValidIndex(fromIndex)
            || !this.isValidIndex(toIndex)
            || fromIndex === toIndex
        ) {
            return false;
        }

        const source = this.slots[fromIndex];
        const target = this.slots[toIndex];
        if (!source.itemId || source.count <= 0) {
            return false;
        }

        if (!target.itemId) {
            target.itemId = source.itemId;
            target.count = source.count;
            source.itemId = null;
            source.count = 0;
        } else if (target.itemId === source.itemId) {
            target.count += source.count;
            source.itemId = null;
            source.count = 0;
        } else {
            const targetItemId = target.itemId;
            const targetCount = target.count;
            target.itemId = source.itemId;
            target.count = source.count;
            source.itemId = targetItemId;
            source.count = targetCount;
        }

        this.changed();
        return true;
    }

    public getGrid(): CraftingSlot[] {
        return this.slots.map(slot => ({ itemId: slot.itemId, count: slot.count }));
    }

    public getMatchedRecipe(): CraftingRecipe | null {
        return this.currentMatch ? this.currentMatch.recipe : null;
    }

    public getCraftableCount(): number {
        return this.currentMatch ? this.currentMatch.craftableCount : 0;
    }

    public craftOnce(): boolean {
        this.refreshMatch();
        if (!this.currentMatch || this.currentMatch.craftableCount <= 0) {
            return false;
        }

        const recipe = this.currentMatch.recipe;
        if (!InventoryManager.instance.canAddItem(recipe.outputItemId, recipe.outputCount)) {
            return false;
        }

        const before = this.getGrid();
        this.consume(this.getConsumptionForTimes(this.currentMatch, 1));
        if (!InventoryManager.instance.addItem(recipe.outputItemId, recipe.outputCount)) {
            this.slots = before;
            this.refreshMatch();
            return false;
        }

        this.changed();
        return true;
    }

    public craftMax(): number {
        this.refreshMatch();
        if (!this.currentMatch) {
            return 0;
        }

        const recipe = this.currentMatch.recipe;
        const count = this.currentMatch.craftableCount;
        const outputCount = recipe.outputCount * count;
        if (count <= 0 || !InventoryManager.instance.canAddItem(recipe.outputItemId, outputCount)) {
            return 0;
        }

        const before = this.getGrid();
        this.consume(this.getConsumptionForTimes(this.currentMatch, count));
        if (!InventoryManager.instance.addItem(recipe.outputItemId, outputCount)) {
            this.slots = before;
            this.refreshMatch();
            return 0;
        }

        this.changed();
        return count;
    }

    public returnAllToInventory(): boolean {
        const returning = this.aggregateSlots();
        if (returning.length === 0) {
            return true;
        }
        if (!InventoryManager.instance.transact([], returning)) {
            cc.warn("[CraftingSession] Inventory has no room to return crafting materials.");
            return false;
        }

        this.resetSlots();
        this.changed();
        return true;
    }

    public isEmpty(): boolean {
        return this.slots.every(slot => !slot.itemId || slot.count <= 0);
    }

    public setStationType(stationType: string): void {
        this.stationType = stationType || "crafting_table";
        this.recipes = getCraftingRecipes(this.stationType);
        this.changed();
    }

    public getStationType(): string {
        return this.stationType;
    }

    private consume(consumption: SlotConsumption[]): void {
        for (const entry of consumption) {
            const slot = this.slots[entry.index];
            slot.count -= entry.count;
            if (slot.count <= 0) {
                slot.itemId = null;
                slot.count = 0;
            }
        }
    }

    private getConsumptionForTimes(match: RecipeMatch, times: number): SlotConsumption[] {
        if (match.recipe.type === RecipeType.SHAPED) {
            return match.consumption.map(entry => ({
                index: entry.index,
                count: entry.count * times
            }));
        }

        const requirements: { [itemId: string]: number } = {};
        for (const ingredient of match.recipe.ingredients || []) {
            requirements[ingredient.itemId] =
                (requirements[ingredient.itemId] || 0) + ingredient.count * times;
        }

        const result: SlotConsumption[] = [];
        for (const itemId of Object.keys(requirements)) {
            let remaining = requirements[itemId];
            for (let index = 0; index < this.slots.length && remaining > 0; index++) {
                const slot = this.slots[index];
                if (slot.itemId !== itemId) {
                    continue;
                }
                const count = Math.min(slot.count, remaining);
                result.push({ index, count });
                remaining -= count;
            }
        }
        return result;
    }

    private aggregateSlots(): ItemAmount[] {
        const totals: { [itemId: string]: number } = {};
        for (const slot of this.slots) {
            if (slot.itemId && slot.count > 0) {
                totals[slot.itemId] = (totals[slot.itemId] || 0) + slot.count;
            }
        }
        return Object.keys(totals).map(itemId => ({ itemId, count: totals[itemId] }));
    }

    private changed(): void {
        this.refreshMatch();
        cc.systemEvent.emit("CRAFTING_SESSION_CHANGED");
    }

    private refreshMatch(): void {
        this.currentMatch = RecipeMatcher.findMatch(
            this.slots,
            this.recipes,
            this.stationType
        );
    }

    private resetSlots(): void {
        this.slots = [];
        for (let i = 0; i < 9; i++) {
            this.slots.push({ itemId: null, count: 0 });
        }
    }

    private isValidIndex(index: number): boolean {
        return Math.floor(index) === index && index >= 0 && index < this.slots.length;
    }

    private isPositiveInteger(value: number): boolean {
        return typeof value === "number"
            && isFinite(value)
            && Math.floor(value) === value
            && value > 0;
    }
}

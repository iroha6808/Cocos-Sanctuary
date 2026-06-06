import { CraftingRecipe, RecipeType } from "../Data/RecipeData";
import { ItemAmount } from "../Player/InventoryManager";

export interface CraftingGridSlot {
    itemId: string | null;
    count: number;
}

export interface SlotConsumption {
    index: number;
    count: number;
}

export interface RecipeMatch {
    recipe: CraftingRecipe;
    consumption: SlotConsumption[];
    craftableCount: number;
}

interface NormalizedGrid {
    cells: CraftingGridSlot[][];
    indices: number[][];
}

export default class RecipeMatcher {
    public static findMatch(
        grid: CraftingGridSlot[],
        recipes: CraftingRecipe[],
        stationType?: string
    ): RecipeMatch | null {
        if (!grid || grid.length !== 9 || !recipes) {
            return null;
        }

        for (const recipe of recipes) {
            if (stationType && recipe.stationType && recipe.stationType !== stationType) {
                continue;
            }

            const result = recipe.type === RecipeType.SHAPED
                ? this.matchShaped(grid, recipe)
                : this.matchShapeless(grid, recipe);
            if (result) {
                return result;
            }
        }

        return null;
    }

    private static matchShaped(grid: CraftingGridSlot[], recipe: CraftingRecipe): RecipeMatch | null {
        if (!recipe.pattern || recipe.pattern.length === 0) {
            return null;
        }

        const normalizedGrid = this.normalizeGrid(grid);
        const pattern = this.normalizePattern(recipe.pattern);
        if (!normalizedGrid || pattern.length === 0) {
            return null;
        }

        let consumption = this.comparePattern(normalizedGrid, pattern);
        if (!consumption && recipe.allowMirror) {
            consumption = this.comparePattern(normalizedGrid, this.mirrorPattern(pattern));
        }
        if (!consumption) {
            return null;
        }

        return {
            recipe,
            consumption,
            craftableCount: this.getCraftableCount(grid, consumption)
        };
    }

    private static matchShapeless(grid: CraftingGridSlot[], recipe: CraftingRecipe): RecipeMatch | null {
        const ingredients = this.aggregateAmounts(recipe.ingredients || []);
        const occupiedSlots = grid
            .map((slot, index) => ({ slot, index }))
            .filter(entry => !!entry.slot.itemId && entry.slot.count > 0);

        if (Object.keys(ingredients).length === 0 || occupiedSlots.length === 0) {
            return null;
        }

        const gridTotals: { [itemId: string]: number } = {};
        for (const entry of occupiedSlots) {
            const itemId = entry.slot.itemId as string;
            if (!ingredients[itemId]) {
                return null;
            }
            gridTotals[itemId] = (gridTotals[itemId] || 0) + entry.slot.count;
        }

        for (const itemId of Object.keys(ingredients)) {
            if ((gridTotals[itemId] || 0) < ingredients[itemId]) {
                return null;
            }
        }

        const consumption: SlotConsumption[] = [];
        for (const itemId of Object.keys(ingredients)) {
            let remaining = ingredients[itemId];
            for (const entry of occupiedSlots) {
                if (entry.slot.itemId !== itemId || remaining <= 0) {
                    continue;
                }
                const count = Math.min(entry.slot.count, remaining);
                consumption.push({ index: entry.index, count });
                remaining -= count;
            }
            if (remaining > 0) {
                return null;
            }
        }

        let craftableCount = Number.MAX_VALUE;
        for (const itemId of Object.keys(ingredients)) {
            craftableCount = Math.min(
                craftableCount,
                Math.floor(gridTotals[itemId] / ingredients[itemId])
            );
        }

        return {
            recipe,
            consumption,
            craftableCount: Math.max(0, craftableCount)
        };
    }

    private static normalizeGrid(grid: CraftingGridSlot[]): NormalizedGrid | null {
        const rows: CraftingGridSlot[][] = [];
        const indices: number[][] = [];
        for (let row = 0; row < 3; row++) {
            rows.push(grid.slice(row * 3, row * 3 + 3));
            indices.push([row * 3, row * 3 + 1, row * 3 + 2]);
        }

        const bounds = this.findOccupiedBounds(rows);
        if (!bounds) {
            return null;
        }

        return {
            cells: rows
                .slice(bounds.top, bounds.bottom + 1)
                .map(row => row.slice(bounds.left, bounds.right + 1)),
            indices: indices
                .slice(bounds.top, bounds.bottom + 1)
                .map(row => row.slice(bounds.left, bounds.right + 1))
        };
    }

    private static normalizePattern(pattern: (string | null)[][]): (string | null)[][] {
        const width = pattern.reduce((max, row) => Math.max(max, row.length), 0);
        const padded = pattern.map(row => {
            const result = row.slice();
            while (result.length < width) {
                result.push(null);
            }
            return result;
        });
        const bounds = this.findOccupiedBounds(padded.map(row => {
            return row.map(itemId => ({ itemId, count: itemId ? 1 : 0 }));
        }));

        if (!bounds) {
            return [];
        }

        return padded
            .slice(bounds.top, bounds.bottom + 1)
            .map(row => row.slice(bounds.left, bounds.right + 1));
    }

    private static comparePattern(
        grid: NormalizedGrid,
        pattern: (string | null)[][]
    ): SlotConsumption[] | null {
        if (grid.cells.length !== pattern.length) {
            return null;
        }

        const consumption: SlotConsumption[] = [];
        for (let row = 0; row < pattern.length; row++) {
            if (grid.cells[row].length !== pattern[row].length) {
                return null;
            }
            for (let column = 0; column < pattern[row].length; column++) {
                const expected = pattern[row][column];
                const slot = grid.cells[row][column];
                const actual = slot && slot.count > 0 ? slot.itemId : null;
                if (actual !== expected) {
                    return null;
                }
                if (expected) {
                    consumption.push({ index: grid.indices[row][column], count: 1 });
                }
            }
        }

        return consumption;
    }

    private static mirrorPattern(pattern: (string | null)[][]): (string | null)[][] {
        return pattern.map(row => row.slice().reverse());
    }

    private static getCraftableCount(
        grid: CraftingGridSlot[],
        consumption: SlotConsumption[]
    ): number {
        let result = Number.MAX_VALUE;
        for (const consume of consumption) {
            result = Math.min(result, Math.floor(grid[consume.index].count / consume.count));
        }
        return result === Number.MAX_VALUE ? 0 : Math.max(0, result);
    }

    private static aggregateAmounts(amounts: ItemAmount[]): { [itemId: string]: number } {
        const result: { [itemId: string]: number } = {};
        for (const amount of amounts) {
            if (!amount || !amount.itemId || amount.count <= 0) {
                continue;
            }
            result[amount.itemId] = (result[amount.itemId] || 0) + amount.count;
        }
        return result;
    }

    private static findOccupiedBounds(rows: CraftingGridSlot[][]): {
        top: number;
        bottom: number;
        left: number;
        right: number;
    } | null {
        let top = rows.length;
        let bottom = -1;
        let left = rows.length > 0 ? rows[0].length : 0;
        let right = -1;

        for (let row = 0; row < rows.length; row++) {
            for (let column = 0; column < rows[row].length; column++) {
                const slot = rows[row][column];
                if (!slot || !slot.itemId || slot.count <= 0) {
                    continue;
                }
                top = Math.min(top, row);
                bottom = Math.max(bottom, row);
                left = Math.min(left, column);
                right = Math.max(right, column);
            }
        }

        return bottom < 0 ? null : { top, bottom, left, right };
    }
}

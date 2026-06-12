import { CraftingRecipe, getCraftingRecipes, RecipeType } from "../Data/RecipeData";
import { getItemDefinition } from "../Data/ItemData";
import { InventoryManager, ItemAmount } from "../Player/InventoryManager";

export interface RecipePreviewSlot {
    itemId: string | null;
    count: number;
}

export interface RecipeCatalogEntry {
    recipe: CraftingRecipe;
    outputName: string;
    outputDescription: string;
    outputIconPath: string;
    stationCompatible: boolean;
}

export default class RecipeCatalog {
    private static warnedMessages: { [message: string]: boolean } = {};

    public static getCatalogEntries(currentStation?: string): RecipeCatalogEntry[] {
        return getCraftingRecipes().map(recipe => {
            this.validateRecipe(recipe);
            const definition = getItemDefinition(recipe.outputItemId);
            return {
                recipe,
                outputName: definition ? definition.name : recipe.outputItemId,
                outputDescription: definition ? definition.description : "",
                outputIconPath: definition && definition.iconPath ? definition.iconPath : "",
                stationCompatible: !currentStation
                    || !recipe.stationType
                    || recipe.stationType === currentStation
            };
        });
    }

    public static getPreviewGrid(recipe: CraftingRecipe): RecipePreviewSlot[] {
        const slots = this.createEmptyGrid();
        if (!recipe) {
            return slots;
        }

        if (recipe.type === RecipeType.SHAPED) {
            const pattern = recipe.pattern || [];
            for (let row = 0; row < pattern.length && row < 3; row++) {
                const columns = pattern[row] || [];
                for (let column = 0; column < columns.length && column < 3; column++) {
                    const itemId = columns[column];
                    if (itemId) {
                        slots[row * 3 + column] = { itemId, count: 1 };
                    }
                }
            }
            return slots;
        }

        const requirements = this.getRequirements(recipe);
        if (requirements.length > slots.length) {
            cc.warn(
                `[RecipeCatalog] Recipe ${recipe.id || "<unknown>"} has more than 9 unique ingredients.`
            );
        }
        for (let index = 0; index < requirements.length && index < slots.length; index++) {
            slots[index] = {
                itemId: requirements[index].itemId,
                count: requirements[index].count
            };
        }
        return slots;
    }

    public static getRequirements(recipe: CraftingRecipe): ItemAmount[] {
        if (!recipe) {
            return [];
        }

        this.validateRecipe(recipe);
        const requirements: ItemAmount[] = [];
        const addRequirement = (itemId: string, count: number): void => {
            if (!itemId || count <= 0) {
                return;
            }
            const existing = requirements.find(entry => entry.itemId === itemId);
            if (existing) {
                existing.count += count;
            } else {
                requirements.push({ itemId, count });
            }
        };

        if (recipe.type === RecipeType.SHAPED) {
            for (const row of recipe.pattern || []) {
                for (const itemId of row || []) {
                    if (itemId) {
                        addRequirement(itemId, 1);
                    }
                }
            }
        } else {
            for (const ingredient of recipe.ingredients || []) {
                if (ingredient) {
                    addRequirement(ingredient.itemId, ingredient.count);
                }
            }
        }

        return requirements.map(requirement => ({ ...requirement }));
    }

    public static getMissingRequirements(recipe: CraftingRecipe): ItemAmount[] {
        return this.getRequirements(recipe)
            .map(requirement => ({
                itemId: requirement.itemId,
                count: Math.max(
                    0,
                    requirement.count - InventoryManager.instance.getItemCount(requirement.itemId)
                )
            }))
            .filter(requirement => requirement.count > 0);
    }

    private static createEmptyGrid(): RecipePreviewSlot[] {
        const slots: RecipePreviewSlot[] = [];
        for (let index = 0; index < 9; index++) {
            slots.push({ itemId: null, count: 0 });
        }
        return slots;
    }

    private static validateRecipe(recipe: CraftingRecipe): void {
        if (!recipe.id) {
            this.warnOnce("[RecipeCatalog] Recipe is missing a stable id.");
        }
        if (!recipe.outputItemId) {
            this.warnOnce(`[RecipeCatalog] Recipe ${recipe.id || "<unknown>"} has no output item.`);
        } else if (!getItemDefinition(recipe.outputItemId)) {
            this.warnOnce(
                `[RecipeCatalog] Recipe ${recipe.id || "<unknown>"} references unknown output ${recipe.outputItemId}.`
            );
        }

        for (const requirement of this.collectRawRequirements(recipe)) {
            if (!requirement.itemId || requirement.count <= 0) {
                this.warnOnce(
                    `[RecipeCatalog] Recipe ${recipe.id || "<unknown>"} has an invalid ingredient.`
                );
            } else if (!getItemDefinition(requirement.itemId)) {
                this.warnOnce(
                    `[RecipeCatalog] Recipe ${recipe.id || "<unknown>"} references unknown ingredient ${requirement.itemId}.`
                );
            }
        }
    }

    private static collectRawRequirements(recipe: CraftingRecipe): ItemAmount[] {
        const requirements: ItemAmount[] = [];
        if (recipe.type === RecipeType.SHAPED) {
            for (const row of recipe.pattern || []) {
                for (const itemId of row || []) {
                    if (itemId) {
                        requirements.push({ itemId, count: 1 });
                    }
                }
            }
        } else {
            for (const ingredient of recipe.ingredients || []) {
                if (ingredient) {
                    requirements.push({
                        itemId: ingredient.itemId,
                        count: ingredient.count
                    });
                }
            }
        }
        return requirements;
    }

    private static warnOnce(message: string): void {
        if (this.warnedMessages[message]) {
            return;
        }
        this.warnedMessages[message] = true;
        cc.warn(message);
    }
}

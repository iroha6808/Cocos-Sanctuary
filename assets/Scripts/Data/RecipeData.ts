import { ItemAmount } from "../Player/InventoryManager";

export enum RecipeType {
    SHAPED = 0,
    SHAPELESS = 1
}

export interface CraftingRecipe {
    id: string;
    type: RecipeType;
    pattern?: (string | null)[][];
    ingredients?: ItemAmount[];
    outputItemId: string;
    outputCount: number;
    allowMirror?: boolean;
    stationType?: string;
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
    {
        id: "wood_plank",
        type: RecipeType.SHAPED,
        pattern: [["wood"]],
        outputItemId: "wood_plank",
        outputCount: 4,
        stationType: "crafting_table"
    },
    {
        id: "ore_block",
        type: RecipeType.SHAPED,
        pattern: [
            ["ore", "ore"],
            ["ore", "ore"]
        ],
        outputItemId: "ore_block",
        outputCount: 1,
        stationType: "crafting_table"
    },
    {
        id: "fruit_salad",
        type: RecipeType.SHAPELESS,
        ingredients: [
            { itemId: "apple", count: 1 },
            { itemId: "coconut", count: 1 }
        ],
        outputItemId: "fruit_salad",
        outputCount: 1,
        stationType: "crafting_table"
    },
    {
        id: "burning_coconut",
        type: RecipeType.SHAPED,
        pattern: [
            ["fire_essence"],
            ["coconut"]
        ],
        outputItemId: "burning_coconut",
        outputCount: 1,
        allowMirror: false,
        stationType: "crafting_table"
    }
];

export function getCraftingRecipes(stationType?: string): CraftingRecipe[] {
    return CRAFTING_RECIPES.filter(recipe => {
        return !stationType || !recipe.stationType || recipe.stationType === stationType;
    });
}

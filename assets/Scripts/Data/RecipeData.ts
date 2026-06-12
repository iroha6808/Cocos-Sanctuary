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
    // ==========================================
    // CATEGORY 1: 原有與基礎材料 (1-6)
    // ==========================================
    { 
        id: "wood_plank", type: RecipeType.SHAPED, 
        pattern: [
            ["wood", null, null],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "wood_plank", outputCount: 4, stationType: "crafting_table" 
    },
    { 
        id: "ore_block", type: RecipeType.SHAPED, 
        pattern: [
            ["ore", "ore", null],
            ["ore", "ore", null],
            [null, null, null]
        ], 
        outputItemId: "ore_block", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "fruit_salad", type: RecipeType.SHAPED, 
        pattern: [
            ["apple", "coconut", null],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "fruit_salad", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "burning_coconut", type: RecipeType.SHAPED, 
        pattern: [
            ["fire_essence", null, null],
            ["coconut", null, null],
            [null, null, null]
        ], 
        outputItemId: "burning_coconut", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "torch", type: RecipeType.SHAPED, 
        pattern: [
            ["coallump", null, null],
            ["wood", null, null],
            [null, null, null]
        ], 
        outputItemId: "torch", outputCount: 4, stationType: "crafting_table" 
    },
    { 
        id: "charcoal", type: RecipeType.SHAPED, 
        pattern: [
            ["wood", null, null],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "coallump", outputCount: 1, stationType: "crafting_table" 
    },

    // ==========================================
    // CATEGORY 2: 水果、堅果與料理盛宴 (7-25)
    // ==========================================
    { 
        id: "apple_juice", type: RecipeType.SHAPED, 
        pattern: [
            ["apple", "apple", null],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "apple_juice", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "sweet_berry_jam", type: RecipeType.SHAPED, 
        pattern: [
            ["blueberries", "blueberries", null],
            ["redberries", "redberries", null],
            [null, null, null]
        ], 
        outputItemId: "sweet_berry_jam", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "trail_mix", type: RecipeType.SHAPED, 
        pattern: [
            ["acorn", "cashew", "chestnut"],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "trail_mix", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "roasted_chestnut", type: RecipeType.SHAPED, 
        pattern: [
            ["chestnut", null, null],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "roasted_chestnut", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "baked_pumpkin_fake", type: RecipeType.SHAPED, 
        pattern: [
            ["orange", "orange", null],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "baked_orange", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "tropical_smoothie", type: RecipeType.SHAPED, 
        pattern: [
            ["kiwi", "pineapple", "banana"],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "tropical_smoothie", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "energy_bar", type: RecipeType.SHAPED, 
        pattern: [
            ["peanuts", "peanuts", null],
            ["coffeebean", "coffeebean", null],
            [null, null, null]
        ], 
        outputItemId: "energy_bar", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "melon_punch", type: RecipeType.SHAPED, 
        pattern: [
            ["watermelonslice", "watermelonslice", "watermelonslice"],
            ["coconut", null, null],
            [null, null, null]
        ], 
        outputItemId: "melon_punch", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "durian_stew", type: RecipeType.SHAPED, 
        pattern: [
            ["durian", "coconut", null],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "durian_stew", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "avocado_toast", type: RecipeType.SHAPED, 
        pattern: [
            ["avacado", "wood_plank", null],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "avocado_toast", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "cherry_pie", type: RecipeType.SHAPED, 
        pattern: [
            ["cherry", "cherry", "cherry"],
            ["acorn", null, null],
            [null, null, null]
        ], 
        outputItemId: "cherry_pie", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "grape_wine", type: RecipeType.SHAPED, 
        pattern: [
            ["grapes", "grapes", "grapes"],
            ["grapes", "grapes", null],
            [null, null, null]
        ], 
        outputItemId: "grape_wine", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "plum_pudding", type: RecipeType.SHAPED, 
        pattern: [
            ["plum", "plum", "mulberry"],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "plum_pudding", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "citrus_tea", type: RecipeType.SHAPED, 
        pattern: [
            ["orange", "greenapple", null],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "citrus_tea", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "salted_guazi", type: RecipeType.SHAPED, 
        pattern: [
            ["guazi", "guazi", null],
            ["guazi", "guazi", null],
            [null, null, null]
        ], 
        outputItemId: "salted_guazi", outputCount: 2, stationType: "crafting_table" 
    },
    { 
        id: "hot_coffee", type: RecipeType.SHAPED, 
        pattern: [
            ["coffeebean", "coffeebean", "coffeebean"],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "hot_coffee", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "strawberry_sundae", type: RecipeType.SHAPED, 
        pattern: [
            ["strawberry", "strawberry", "strawberry"],
            ["icecrystal", null, null],
            [null, null, null]
        ], 
        outputItemId: "strawberry_sundae", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "premium_fruit_platter", type: RecipeType.SHAPED, 
        pattern: [
            ["peach", "pear", "kiwi"],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "premium_fruit_platter", outputCount: 1, stationType: "crafting_table" 
    },

    // ==========================================
    // CATEGORY 3: 進階煉金與功能藥水 (26-40)
    // ==========================================
    { 
        id: "redpotion", type: RecipeType.SHAPED, 
        pattern: [
            ["rubycrystal", "firestone", null],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "redpotion", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "bluepotion", type: RecipeType.SHAPED, 
        pattern: [
            ["manapearl", "icecrystal", null],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "bluepotion", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "yellowpotion", type: RecipeType.SHAPED, 
        pattern: [
            ["citrinegeode", "calcitecluster", null],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "yellowpotion", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "antidote_potion", type: RecipeType.SHAPED, 
        pattern: [
            ["calcitecluster", "calcitecluster", "greenapple"],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "antidote_potion", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "rad_shield_serum", type: RecipeType.SHAPED, 
        pattern: [
            ["radslimechunk", "calcitecluster", null],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "rad_shield_serum", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "berserk_brew", type: RecipeType.SHAPED, 
        pattern: [
            ["rubycrystal", "durian", null],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "berserk_brew", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "frozen_tonic", type: RecipeType.SHAPED, 
        pattern: [
            ["icecrystal", "icecrystal", null],
            ["blueberries", "blueberries", null],
            [null, null, null]
        ], 
        outputItemId: "frozen_tonic", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "midas_oil", type: RecipeType.SHAPED, 
        pattern: [
            ["rawgold", "citrinegeode", null],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "midas_oil", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "starlight_elixir", type: RecipeType.SHAPED, 
        pattern: [
            ["starmetalshard", "manapearl", null],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "starlight_elixir", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "xp_boost_potion", type: RecipeType.SHAPED, 
        pattern: [
            ["lapislazuli", "lapislazuli", "peach"],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "xp_boost_potion", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "speed_juice", type: RecipeType.SHAPED, 
        pattern: [
            ["coffeebean", "coffeebean", "coffeebean"],
            ["coffeebean", "coffeebean", "tealprism"],
            [null, null, null]
        ], 
        outputItemId: "speed_juice", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "shadow_essence", type: RecipeType.SHAPED, 
        pattern: [
            ["voidnugget", "coallump", "coallump"],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "shadow_essence", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "love_potion", type: RecipeType.SHAPED, 
        pattern: [
            ["rosequartz", "cherry", "cherry"],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "love_potion", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "regrowth_fertilizer", type: RecipeType.SHAPED, 
        pattern: [
            ["mossagate", "fossilizedshell", null],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "regrowth_fertilizer", outputCount: 3, stationType: "crafting_table" 
    },
    { 
        id: "mana_soup", type: RecipeType.SHAPED, 
        pattern: [
            ["manapearl", "mulberry", "mulberry"],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "mana_soup", outputCount: 1, stationType: "crafting_table" 
    },

    // ==========================================
    // CATEGORY 4: 基礎、進階至頂級工具 (41-55)
    // ==========================================
    { 
        id: "copper_pickaxe", type: RecipeType.SHAPED, 
        pattern: [
            ["coppercluster", "coppercluster", "coppercluster"],
            [null, "wood_plank", null],
            [null, "wood_plank", null]
        ], 
        outputItemId: "copper_pickaxe", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "iron_axe", type: RecipeType.SHAPED, 
        pattern: [
            ["ironore", "ironore", null],
            ["ironore", "wood_plank", null],
            [null, "wood_plank", null]
        ], 
        outputItemId: "iron_axe", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "silver_pickaxe", type: RecipeType.SHAPED, 
        pattern: [
            ["silverbar", "silverbar", "silverbar"],
            [null, "wood_plank", null],
            [null, "wood_plank", null]
        ], 
        outputItemId: "silver_pickaxe", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "gold_pickaxe", type: RecipeType.SHAPED, 
        pattern: [
            ["rawgold", "rawgold", "rawgold"],
            [null, "wood_plank", null],
            [null, "wood_plank", null]
        ], 
        outputItemId: "gold_pickaxe", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "gold_axe", type: RecipeType.SHAPED, 
        pattern: [
            ["rawgold", "rawgold", null],
            ["rawgold", "wood_plank", null],
            [null, "wood_plank", null]
        ], 
        outputItemId: "gold_axe", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "starmetal_pickaxe", type: RecipeType.SHAPED, 
        pattern: [
            ["starmetalshard", "starmetalshard", "starmetalshard"],
            ["lapislazuli", "wood_plank", null],
            [null, "wood_plank", null]
        ], 
        outputItemId: "starmetal_pickaxe", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "starmetal_axe", type: RecipeType.SHAPED, 
        pattern: [
            ["starmetalshard", "starmetalshard", null],
            ["starmetalshard", "wood_plank", null],
            [null, "wood_plank", null]
        ], 
        outputItemId: "starmetal_axe", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "void_hoer", type: RecipeType.SHAPED, 
        pattern: [
            ["voidnugget", "voidnugget", null],
            [null, "wood_plank", null],
            [null, "wood_plank", null]
        ], 
        outputItemId: "void_hoe", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "lucky_fishing_rod", type: RecipeType.SHAPED, 
        pattern: [
            ["wood_plank", null, "jadeorb"],
            [null, "wood_plank", null],
            [null, null, "fossilizedshell"]
        ], 
        outputItemId: "lucky_fishing_rod", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "alchemists_hammer", type: RecipeType.SHAPED, 
        pattern: [
            ["calcitecluster", "ironore", "calcitecluster"],
            [null, "wood_plank", null],
            [null, "wood_plank", null]
        ], 
        outputItemId: "alchemists_hammer", outputCount: 1, stationType: "crafting_table" 
    },

    // ==========================================
    // CATEGORY 5: 武器與遠程彈藥 (56-70)
    // ==========================================
    { 
        id: "copper_sword", type: RecipeType.SHAPED, 
        pattern: [
            ["coppercluster", null, null],
            ["coppercluster", null, null],
            ["wood_plank", null, null]
        ], 
        outputItemId: "copper_sword", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "iron_sword", type: RecipeType.SHAPED, 
        pattern: [
            ["ironore", null, null],
            ["ironore", null, null],
            ["wood_plank", null, null]
        ], 
        outputItemId: "iron_sword", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "silver_sword", type: RecipeType.SHAPED, 
        pattern: [
            ["silverbar", null, null],
            ["silverbar", null, null],
            ["lapislazuli", null, null]
        ], 
        outputItemId: "silver_sword", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "ruby_flameblade", type: RecipeType.SHAPED, 
        pattern: [
            ["rubycrystal", "firestone", "rubycrystal"],
            [null, "rawgold", null],
            [null, "wood_plank", null]
        ], 
        outputItemId: "ruby_flameblade", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "starmetal_sword", type: RecipeType.SHAPED, 
        pattern: [
            ["starmetalshard", null, null],
            ["starmetalshard", null, null],
            ["amethyst", null, null]
        ], 
        outputItemId: "starmetal_sword", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "void_dagger", type: RecipeType.SHAPED, 
        pattern: [
            ["voidnugget", null, null],
            ["radslimechunk", null, null],
            ["wood_plank", null, null]
        ], 
        outputItemId: "void_dagger", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "frost_spear", type: RecipeType.SHAPED, 
        pattern: [
            ["icecrystal", null, null],
            ["wood_plank", null, null],
            ["wood_plank", null, null]
        ], 
        outputItemId: "frost_spear", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "meteor_bullet", type: RecipeType.SHAPED, 
        pattern: [
            ["meteoritechunk", "coallump", null],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "meteor_bullet", outputCount: 20, stationType: "crafting_table" 
    },
    { 
        id: "crystal_arrow", type: RecipeType.SHAPED, 
        pattern: [
            ["citrinegeode", "wood_plank", "wood_plank"],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "crystal_arrow", outputCount: 15, stationType: "crafting_table" 
    },
    { 
        id: "flame_arrow", type: RecipeType.SHAPED, 
        pattern: [
            ["firestone", "wood_plank", "wood_plank"],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "flame_arrow", outputCount: 15, stationType: "crafting_table" 
    },
    { 
        id: "ice_arrow", type: RecipeType.SHAPED, 
        pattern: [
            ["icecrystal", "wood_plank", "wood_plank"],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "ice_arrow", outputCount: 15, stationType: "crafting_table" 
    },
    { 
        id: "poison_dart", type: RecipeType.SHAPED, 
        pattern: [
            ["radslimechunk", "wood_plank", null],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "poison_dart", outputCount: 10, stationType: "crafting_table" 
    },

    // ==========================================
    // CATEGORY 6: 防具與護盾防禦線 (71-85)
    // ==========================================
    { 
        id: "copper_helmet", type: RecipeType.SHAPED, 
        pattern: [
            ["coppercluster", "coppercluster", "coppercluster"],
            ["coppercluster", null, "coppercluster"],
            [null, null, null]
        ], 
        outputItemId: "copper_helmet", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "copper_chestplate", type: RecipeType.SHAPED, 
        pattern: [
            ["coppercluster", null, "coppercluster"],
            ["coppercluster", "coppercluster", "coppercluster"],
            ["coppercluster", "coppercluster", "coppercluster"]
        ], 
        outputItemId: "copper_chestplate", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "iron_helmet", type: RecipeType.SHAPED, 
        pattern: [
            ["ironore", "ironore", "ironore"],
            ["ironore", null, "ironore"],
            [null, null, null]
        ], 
        outputItemId: "iron_helmet", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "iron_chestplate", type: RecipeType.SHAPED, 
        pattern: [
            ["ironore", null, "ironore"],
            ["ironore", "ironore", "ironore"],
            ["ironore", "ironore", "ironore"]
        ], 
        outputItemId: "iron_chestplate", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "silver_helmet", type: RecipeType.SHAPED, 
        pattern: [
            ["silverbar", "silverbar", "silverbar"],
            ["silverbar", null, "silverbar"],
            [null, null, null]
        ], 
        outputItemId: "silver_helmet", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "silver_chestplate", type: RecipeType.SHAPED, 
        pattern: [
            ["silverbar", null, "silverbar"],
            ["silverbar", "silverbar", "silverbar"],
            ["silverbar", "silverbar", "silverbar"]
        ], 
        outputItemId: "silver_chestplate", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "gilded_breastplate", type: RecipeType.SHAPED, 
        pattern: [
            ["rawgold", null, "rawgold"],
            ["rawgold", "jadeorb", "rawgold"],
            ["rawgold", "rawgold", "rawgold"]
        ], 
        outputItemId: "gilded_breastplate", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "starmetal_helmet", type: RecipeType.SHAPED, 
        pattern: [
            ["starmetalshard", "lapislazuli", "starmetalshard"],
            ["starmetalshard", null, "starmetalshard"],
            [null, null, null]
        ], 
        outputItemId: "starmetal_helmet", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "starmetal_chestplate", type: RecipeType.SHAPED, 
        pattern: [
            ["starmetalshard", null, "starmetalshard"],
            ["starmetalshard", "amethyst", "starmetalshard"],
            ["starmetalshard", "starmetalshard", "starmetalshard"]
        ], 
        outputItemId: "starmetal_chestplate", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "fire_ring", type: RecipeType.SHAPED, 
        pattern: [
            ["rawgold", "firestone", "rubycrystal"],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "fire_ring", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "ice_ring", type: RecipeType.SHAPED, 
        pattern: [
            ["silverbar", "icecrystal", "manapearl"],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "ice_ring", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "radiation_ring", type: RecipeType.SHAPED, 
        pattern: [
            ["cobaltore", "radslimechunk", "calcitecluster"],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "radiation_ring", outputCount: 1, stationType: "crafting_table" 
    },

    // ==========================================
    // CATEGORY 7: 首飾與奇特冒險工具 (86-94)
    // ==========================================
    { 
        id: "explorer_goggles", type: RecipeType.SHAPED, 
        pattern: [
            ["tealprism", "ambersphere", "wood_plank"],
            [null, null, null],
            [null, null, null]
        ], 
        outputItemId: "explorer_goggles", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "wayfinder_compass", type: RecipeType.SHAPED, 
        pattern: [
            ["mossagate", "fossilizedshell", "ironore"],
            ["ironore", null, null],
            [null, null, null]
        ], 
        outputItemId: "wayfinder_compass", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "recall_hearthstone", type: RecipeType.SHAPED, 
        pattern: [
            [null, "rosequartz", null],
            ["ore", "manapearl", "ore"],
            [null, "ore", null]
        ], 
        outputItemId: "recall_hearthstone", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "lucky_jade_amulet", type: RecipeType.SHAPED, 
        pattern: [
            ["silverbar", "silverbar", "silverbar"],
            ["silverbar", "jadeorb", "silverbar"],
            [null, "rosequartz", null]
        ], 
        outputItemId: "lucky_jade_amulet", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "haste_talisman", type: RecipeType.SHAPED, 
        pattern: [
            ["citrinegeode", "coffeebean", "coffeebean"],
            ["coffeebean", "coffeebean", "rawgold"],
            [null, null, null]
        ], 
        outputItemId: "haste_talisman", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "diving_charm", type: RecipeType.SHAPED, 
        pattern: [
            ["tealprism", "tealprism", "fossilizedshell"],
            ["fossilizedshell", "coconut", null],
            [null, null, null]
        ], 
        outputItemId: "diving_charm", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "gravitational_orb", type: RecipeType.SHAPED, 
        pattern: [
            ["meteoritechunk", "meteoritechunk", "voidnugget"],
            ["manapearl", null, null],
            [null, null, null]
        ], 
        outputItemId: "gravitational_orb", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "toxic_filter", type: RecipeType.SHAPED, 
        pattern: [
            ["calcitecluster", "calcitecluster", "calcitecluster"],
            ["charcoal", "fossilizedshell", "charcoal"],
            [null, null, null]
        ], 
        outputItemId: "toxic_filter", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "magnet_charm", type: RecipeType.SHAPED, 
        pattern: [
            ["ironore", "ironore", "ironore"],
            ["ironore", "amethyst", null],
            [null, null, null]
        ], 
        outputItemId: "magnet_charm", outputCount: 1, stationType: "crafting_table" 
    },

    // ==========================================
    // CATEGORY 8: 基地家具與傳送結構 (95-100)
    // ==========================================
    { 
        id: "ruby_lamp", type: RecipeType.SHAPED, 
        pattern: [
            ["rubycrystal", null, null],
            ["torch", null, null],
            ["wood_plank", null, null]
        ], 
        outputItemId: "ruby_lamp", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "amethyst_lamp", type: RecipeType.SHAPED, 
        pattern: [
            ["amethyst", null, null],
            ["torch", null, null],
            ["wood_plank", null, null]
        ], 
        outputItemId: "amethyst_lamp", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "crystal_display_stand", type: RecipeType.SHAPED, 
        pattern: [
            ["wood_plank", "tealprism", "wood_plank"],
            ["wood_plank", "wood_plank", "wood_plank"],
            [null, null, null]
        ], 
        outputItemId: "display_stand", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "teleporter_core", type: RecipeType.SHAPED, 
        pattern: [
            ["starmetalshard", "manapearl", "starmetalshard"],
            ["voidnugget", "recall_hearthstone", "voidnugget"],
            ["starmetalshard", "manapearl", "starmetalshard"]
        ], 
        outputItemId: "teleporter_core", outputCount: 1, stationType: "crafting_table" 
    },
    { 
        id: "cosmic_anvil", type: RecipeType.SHAPED, 
        pattern: [
            ["starmetalshard", "starmetalshard", "starmetalshard"],
            [null, "meteoritechunk", null],
            ["ironore", "ironore", "ironore"]
        ], 
        outputItemId: "cosmic_anvil", outputCount: 1, stationType: "crafting_table" 
    }
];

export function getCraftingRecipes(stationType?: string): CraftingRecipe[] {
    return CRAFTING_RECIPES.filter(recipe => {
        return !stationType || !recipe.stationType || recipe.stationType === stationType;
    });
}
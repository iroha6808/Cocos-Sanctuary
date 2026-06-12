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
    { id: "wood_plank", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "wood", count: 1 }], outputItemId: "wood_plank", outputCount: 4, stationType: "crafting_table" },
    { id: "ore_block", type: RecipeType.SHAPED, pattern: [["ore", "ore"], ["ore", "ore"]], outputItemId: "ore_block", outputCount: 1, stationType: "crafting_table" },
    { id: "fruit_salad", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "apple", count: 1 }, { itemId: "coconut", count: 1 }], outputItemId: "fruit_salad", outputCount: 1, stationType: "crafting_table" },
    { id: "burning_coconut", type: RecipeType.SHAPED, pattern: [["fire_essence"], ["coconut"]], outputItemId: "burning_coconut", outputCount: 1, stationType: "crafting_table" },
    { id: "torch", type: RecipeType.SHAPED, pattern: [["coallump"], ["wood"]], outputItemId: "torch", outputCount: 4, stationType: "crafting_table" },
    { id: "charcoal", type: RecipeType.SHAPED, pattern: [["wood"]], outputItemId: "coallump", outputCount: 1, stationType: "furnace" },

    // ==========================================
    // CATEGORY 2: 水果、堅果與料理盛宴 (7-25)
    // ==========================================
    { id: "apple_juice", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "apple", count: 2 }], outputItemId: "apple_juice", outputCount: 1, stationType: "crafting_table" },
    { id: "sweet_berry_jam", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "blueberries", count: 2 }, { itemId: "redberries", count: 2 }], outputItemId: "sweet_berry_jam", outputCount: 1, stationType: "crafting_table" },
    { id: "trail_mix", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "acorn", count: 1 }, { itemId: "cashew", count: 1 }, { itemId: "chestnut", count: 1 }], outputItemId: "trail_mix", outputCount: 1, stationType: "crafting_table" },
    { id: "roasted_chestnut", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "chestnut", count: 1 }], outputItemId: "roasted_chestnut", outputCount: 1, stationType: "furnace" },
    { id: "baked_pumpkin_fake", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "orange", count: 2 }], outputItemId: "baked_orange", outputCount: 1, stationType: "furnace" },
    { id: "tropical_smoothie", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "kiwi", count: 1 }, { itemId: "pineapple", count: 1 }, { itemId: "banana", count: 1 }], outputItemId: "tropical_smoothie", outputCount: 1, stationType: "crafting_table" },
    { id: "energy_bar", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "peanuts", count: 2 }, { itemId: "coffeebean", count: 2 }], outputItemId: "energy_bar", outputCount: 1, stationType: "crafting_table" },
    { id: "melon_punch", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "watermelonslice", count: 3 }, { itemId: "coconut", count: 1 }], outputItemId: "melon_punch", outputCount: 1, stationType: "crafting_table" },
    { id: "durian_stew", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "durian", count: 1 }, { itemId: "coconut", count: 1 }], outputItemId: "durian_stew", outputCount: 1, stationType: "crafting_table" },
    { id: "avocado_toast", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "avacado", count: 1 }, { itemId: "wood_plank", count: 1 }], outputItemId: "avocado_toast", outputCount: 1, stationType: "crafting_table" },
    { id: "cherry_pie", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "cherry", count: 3 }, { itemId: "acorn", count: 1 }], outputItemId: "cherry_pie", outputCount: 1, stationType: "furnace" },
    { id: "grape_wine", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "grapes", count: 5 }], outputItemId: "grape_wine", outputCount: 1, stationType: "alchemy_lab" },
    { id: "pistachio_butter", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "pistachio", count: 3 }], outputItemId: "pistachio_butter", outputCount: 1, stationType: "crafting_table" },
    { id: "plum_pudding", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "plum", count: 2 }, { itemId: "mulberry", count: 1 }], outputItemId: "plum_pudding", outputCount: 1, stationType: "furnace" },
    { id: "citrus_tea", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "orange", count: 1 }, { itemId: "greenapple", count: 1 }], outputItemId: "citrus_tea", outputCount: 1, stationType: "furnace" },
    { id: "salted_guazi", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "guazi", count: 4 }], outputItemId: "salted_guazi", outputCount: 2, stationType: "furnace" },
    { id: "hot_coffee", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "coffeebean", count: 3 }], outputItemId: "hot_coffee", outputCount: 1, stationType: "furnace" },
    { id: "strawberry_sundae", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "strawberry", count: 3 }, { itemId: "icecrystal", count: 1 }], outputItemId: "strawberry_sundae", outputCount: 1, stationType: "crafting_table" },
    { id: "premium_fruit_platter", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "peach", count: 1 }, { itemId: "pear", count: 1 }, { itemId: "kiwi", count: 1 }], outputItemId: "premium_fruit_platter", outputCount: 1, stationType: "crafting_table" },

    // ==========================================
    // CATEGORY 3: 進階煉金與功能藥水 (26-40)
    // ==========================================
    { id: "redpotion", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "rubycrystal", count: 1 }, { itemId: "firestone", count: 1 }], outputItemId: "redpotion", outputCount: 1, stationType: "alchemy_lab" },
    { id: "bluepotion", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "manapearl", count: 1 }, { itemId: "icecrystal", count: 1 }], outputItemId: "bluepotion", outputCount: 1, stationType: "alchemy_lab" },
    { id: "yellowpotion", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "citrinegeode", count: 1 }, { itemId: "calcitecluster", count: 1 }], outputItemId: "yellowpotion", outputCount: 1, stationType: "alchemy_lab" },
    { id: "antidote_potion", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "calcitecluster", count: 2 }, { itemId: "greenapple", count: 1 }], outputItemId: "antidote_potion", outputCount: 1, stationType: "alchemy_lab" },
    { id: "rad_shield_serum", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "radslimechunk", count: 1 }, { itemId: "calcitecluster", count: 1 }], outputItemId: "rad_shield_serum", outputCount: 1, stationType: "alchemy_lab" },
    { id: "berserk_brew", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "rubycrystal", count: 1 }, { itemId: "durian", count: 1 }], outputItemId: "berserk_brew", outputCount: 1, stationType: "alchemy_lab" },
    { id: "frozen_tonic", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "icecrystal", count: 2 }, { itemId: "blueberries", count: 2 }], outputItemId: "frozen_tonic", outputCount: 1, stationType: "alchemy_lab" },
    { id: "midas_oil", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "rawgold", count: 1 }, { itemId: "citrinegeode", count: 1 }], outputItemId: "midas_oil", outputCount: 1, stationType: "alchemy_lab" },
    { id: "starlight_elixir", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "starmetalshard", count: 1 }, { itemId: "manapearl", count: 1 }], outputItemId: "starlight_elixir", outputCount: 1, stationType: "alchemy_lab" },
    { id: "xp_boost_potion", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "lapislazuli", count: 2 }, { itemId: "peach", count: 1 }], outputItemId: "xp_boost_potion", outputCount: 1, stationType: "alchemy_lab" },
    { id: "speed_juice", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "coffeebean", count: 5 }, { itemId: "tealprism", count: 1 }], outputItemId: "speed_juice", outputCount: 1, stationType: "alchemy_lab" },
    { id: "shadow_essence", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "voidnugget", count: 1 }, { itemId: "coallump", count: 2 }], outputItemId: "shadow_essence", outputCount: 1, stationType: "alchemy_lab" },
    { id: "love_potion", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "rosequartz", count: 1 }, { itemId: "cherry", count: 2 }], outputItemId: "love_potion", outputCount: 1, stationType: "alchemy_lab" },
    { id: "regrowth_fertilizer", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "mossagate", count: 1 }, { itemId: "fossilizedshell", count: 1 }], outputItemId: "regrowth_fertilizer", outputCount: 3, stationType: "crafting_table" },
    { id: "mana_soup", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "manapearl", count: 1 }, { itemId: "mulberry", count: 2 }], outputItemId: "mana_soup", outputCount: 1, stationType: "furnace" },

    // ==========================================
    // CATEGORY 4: 基礎、進階至頂級工具 (41-55)
    // ==========================================
    { id: "copper_pickaxe", type: RecipeType.SHAPED, pattern: [["coppercluster", "coppercluster", "coppercluster"], [null, "wood_plank", null], [null, "wood_plank", null]], outputItemId: "copper_pickaxe", outputCount: 1, stationType: "crafting_table" },
    { id: "copper_axe", type: RecipeType.SHAPED, pattern: [["coppercluster", "coppercluster", null], ["coppercluster", "wood_plank", null], [null, "wood_plank", null]], outputItemId: "copper_axe", outputCount: 1, stationType: "crafting_table" },
    { id: "iron_pickaxe", type: RecipeType.SHAPED, pattern: [["ironore", "ironore", "ironore"], [null, "wood_plank", null], [null, "wood_plank", null]], outputItemId: "iron_pickaxe", outputCount: 1, stationType: "crafting_table" },
    { id: "iron_axe", type: RecipeType.SHAPED, pattern: [["ironore", "ironore", null], ["ironore", "wood_plank", null], [null, "wood_plank", null]], outputItemId: "iron_axe", outputCount: 1, stationType: "crafting_table" },
    { id: "silver_pickaxe", type: RecipeType.SHAPED, pattern: [["silverbar", "silverbar", "silverbar"], [null, "wood_plank", null], [null, "wood_plank", null]], outputItemId: "silver_pickaxe", outputCount: 1, stationType: "crafting_table" },
    { id: "silver_axe", type: RecipeType.SHAPED, pattern: [["silverbar", "silverbar", null], ["silverbar", "wood_plank", null], [null, "wood_plank", null]], outputItemId: "silver_axe", outputCount: 1, stationType: "crafting_table" },
    { id: "gold_pickaxe", type: RecipeType.SHAPED, pattern: [["rawgold", "rawgold", "rawgold"], [null, "wood_plank", null], [null, "wood_plank", null]], outputItemId: "gold_pickaxe", outputCount: 1, stationType: "crafting_table" },
    { id: "gold_axe", type: RecipeType.SHAPED, pattern: [["rawgold", "rawgold", null], ["rawgold", "wood_plank", null], [null, "wood_plank", null]], outputItemId: "gold_axe", outputCount: 1, stationType: "crafting_table" },
    { id: "cobalt_pickaxe", type: RecipeType.SHAPED, pattern: [["cobaltore", "meteoritechunk", "cobaltore"], [null, "wood_plank", null], [null, "wood_plank", null]], outputItemId: "cobalt_pickaxe", outputCount: 1, stationType: "crafting_table" },
    { id: "cobalt_axe", type: RecipeType.SHAPED, pattern: [["cobaltore", "meteoritechunk", null], ["cobaltore", "wood_plank", null], [null, "wood_plank", null]], outputItemId: "cobalt_axe", outputCount: 1, stationType: "crafting_table" },
    { id: "starmetal_pickaxe", type: RecipeType.SHAPED, pattern: [["starmetalshard", "starmetalshard", "starmetalshard"], ["lapislazuli", "wood_plank", null], [null, "wood_plank", null]], outputItemId: "starmetal_pickaxe", outputCount: 1, stationType: "crafting_table" },
    { id: "starmetal_axe", type: RecipeType.SHAPED, pattern: [["starmetalshard", "starmetalshard", null], ["starmetalshard", "wood_plank", null], [null, "wood_plank", null]], outputItemId: "starmetal_axe", outputCount: 1, stationType: "crafting_table" },
    { id: "void_hoer", type: RecipeType.SHAPED, pattern: [["voidnugget", "voidnugget", null], [null, "wood_plank", null], [null, "wood_plank", null]], outputItemId: "void_hoe", outputCount: 1, stationType: "crafting_table" },
    { id: "lucky_fishing_rod", type: RecipeType.SHAPED, pattern: [["wood_plank", null, "jadeorb"], [null, "wood_plank", null], [null, null, "fossilizedshell"]], outputItemId: "lucky_fishing_rod", outputCount: 1, stationType: "crafting_table" },
    { id: "alchemists_hammer", type: RecipeType.SHAPED, pattern: [["calcitecluster", "ironore", "calcitecluster"], [null, "wood_plank", null], [null, "wood_plank", null]], outputItemId: "alchemists_hammer", outputCount: 1, stationType: "crafting_table" },

    // ==========================================
    // CATEGORY 5: 武器與遠程彈藥 (56-70)
    // ==========================================
    { id: "copper_sword", type: RecipeType.SHAPED, pattern: [["coppercluster"], ["coppercluster"], ["wood_plank"]], outputItemId: "copper_sword", outputCount: 1, stationType: "crafting_table" },
    { id: "iron_sword", type: RecipeType.SHAPED, pattern: [["ironore"], ["ironore"], ["wood_plank"]], outputItemId: "iron_sword", outputCount: 1, stationType: "crafting_table" },
    { id: "silver_sword", type: RecipeType.SHAPED, pattern: [["silverbar"], ["silverbar"], ["lapislazuli"]], outputItemId: "silver_sword", outputCount: 1, stationType: "crafting_table" },
    { id: "golden_rapier", type: RecipeType.SHAPED, pattern: [["rawgold"], ["rawgold"], ["citrinegeode"]], outputItemId: "golden_rapier", outputCount: 1, stationType: "crafting_table" },
    { id: "ruby_flameblade", type: RecipeType.SHAPED, pattern: [["rubycrystal", "firestone", "rubycrystal"], [null, "rawgold", null], [null, "wood_plank", null]], outputItemId: "ruby_flameblade", outputCount: 1, stationType: "crafting_table" },
    { id: "starmetal_sword", type: RecipeType.SHAPED, pattern: [["starmetalshard"], ["starmetalshard"], ["amethyst"]], outputItemId: "starmetal_sword", outputCount: 1, stationType: "crafting_table" },
    { id: "void_dagger", type: RecipeType.SHAPED, pattern: [["voidnugget"], ["radslimechunk"], ["wood_plank"]], outputItemId: "void_dagger", outputCount: 1, stationType: "crafting_table" },
    { id: "frost_spear", type: RecipeType.SHAPED, pattern: [["icecrystal"], ["wood_plank"], ["wood_plank"]], outputItemId: "frost_spear", outputCount: 1, stationType: "crafting_table" },
    { id: "ocean_mace", type: RecipeType.SHAPED, pattern: [["tealprism", "fossilizedshell", "tealprism"], [null, "ironore", null], [null, "wood_plank", null]], outputItemId: "ocean_mace", outputCount: 1, stationType: "crafting_table" },
    { id: "nature_staff", type: RecipeType.SHAPED, pattern: [["mossagate"], ["wood_plank"], ["rosequartz"]], outputItemId: "nature_staff", outputCount: 1, stationType: "crafting_table" },
    { id: "meteor_bullet", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "meteoritechunk", count: 1 }, { itemId: "coallump", count: 1 }], outputItemId: "meteor_bullet", outputCount: 20, stationType: "crafting_table" },
    { id: "crystal_arrow", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "citrinegeode", count: 1 }, { itemId: "wood_plank", count: 2 }], outputItemId: "crystal_arrow", outputCount: 15, stationType: "crafting_table" },
    { id: "flame_arrow", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "firestone", count: 1 }, { itemId: "wood_plank", count: 2 }], outputItemId: "flame_arrow", outputCount: 15, stationType: "crafting_table" },
    { id: "ice_arrow", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "icecrystal", count: 1 }, { itemId: "wood_plank", count: 2 }], outputItemId: "ice_arrow", outputCount: 15, stationType: "crafting_table" },
    { id: "poison_dart", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "radslimechunk", count: 1 }, { itemId: "wood_plank", count: 1 }], outputItemId: "poison_dart", outputCount: 10, stationType: "crafting_table" },

    // ==========================================
    // CATEGORY 6: 防具與護盾防禦線 (71-85)
    // ==========================================
    { id: "iron_shield", type: RecipeType.SHAPED, pattern: [["ironore", "coallump", "ironore"], ["ironore", "wood_plank", "ironore"], [null, "ironore", null]], outputItemId: "iron_shield", outputCount: 1, stationType: "crafting_table" },
    { id: "copper_helmet", type: RecipeType.SHAPED, pattern: [["coppercluster", "coppercluster", "coppercluster"], ["coppercluster", null, "coppercluster"]], outputItemId: "copper_helmet", outputCount: 1, stationType: "crafting_table" },
    { id: "copper_chestplate", type: RecipeType.SHAPED, pattern: [["coppercluster", null, "coppercluster"], ["coppercluster", "coppercluster", "coppercluster"], ["coppercluster", "coppercluster", "coppercluster"]], outputItemId: "copper_chestplate", outputCount: 1, stationType: "crafting_table" },
    { id: "iron_helmet", type: RecipeType.SHAPED, pattern: [["ironore", "ironore", "ironore"], ["ironore", null, "ironore"]], outputItemId: "iron_helmet", outputCount: 1, stationType: "crafting_table" },
    { id: "iron_chestplate", type: RecipeType.SHAPED, pattern: [["ironore", null, "ironore"], ["ironore", "ironore", "ironore"], ["ironore", "ironore", "ironore"]], outputItemId: "iron_chestplate", outputCount: 1, stationType: "crafting_table" },
    { id: "silver_helmet", type: RecipeType.SHAPED, pattern: [["silverbar", "silverbar", "silverbar"], ["silverbar", null, "silverbar"]], outputItemId: "silver_helmet", outputCount: 1, stationType: "crafting_table" },
    { id: "silver_chestplate", type: RecipeType.SHAPED, pattern: [["silverbar", null, "silverbar"], ["silverbar", "silverbar", "silverbar"], ["silverbar", "silverbar", "silverbar"]], outputItemId: "silver_chestplate", outputCount: 1, stationType: "crafting_table" },
    { id: "gilded_breastplate", type: RecipeType.SHAPED, pattern: [["rawgold", null, "rawgold"], ["rawgold", "jadeorb", "rawgold"], ["rawgold", "rawgold", "rawgold"]], outputItemId: "gilded_breastplate", outputCount: 1, stationType: "crafting_table" },
    { id: "cobalt_shield", type: RecipeType.SHAPED, pattern: [["cobaltore", "meteoritechunk", "cobaltore"], ["cobaltore", "ironore", "cobaltore"]], outputItemId: "cobalt_shield", outputCount: 1, stationType: "crafting_table" },
    { id: "starmetal_helmet", type: RecipeType.SHAPED, pattern: [["starmetalshard", "lapislazuli", "starmetalshard"], ["starmetalshard", null, "starmetalshard"]], outputItemId: "starmetal_helmet", outputCount: 1, stationType: "crafting_table" },
    { id: "starmetal_chestplate", type: RecipeType.SHAPED, pattern: [["starmetalshard", null, "starmetalshard"], ["starmetalshard", "amethyst", "starmetalshard"], ["starmetalshard", "starmetalshard", "starmetalshard"]], outputItemId: "starmetal_chestplate", outputCount: 1, stationType: "crafting_table" },
    { id: "void_armor", type: RecipeType.SHAPED, pattern: [["voidnugget", null, "voidnugget"], ["voidnugget", "radslimechunk", "voidnugget"], ["voidnugget", "voidnugget", "voidnugget"]], outputItemId: "void_armor", outputCount: 1, stationType: "crafting_table" },
    { id: "fire_ring", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "rawgold", count: 1 }, { itemId: "firestone", count: 1 }, { itemId: "rubycrystal", count: 1 }], outputItemId: "fire_ring", outputCount: 1, stationType: "crafting_table" },
    { id: "ice_ring", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "silverbar", count: 1 }, { itemId: "icecrystal", count: 1 }, { itemId: "manapearl", count: 1 }], outputItemId: "ice_ring", outputCount: 1, stationType: "crafting_table" },
    { id: "radiation_ring", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "cobaltore", count: 1 }, { itemId: "radslimechunk", count: 1 }, { itemId: "calcitecluster", count: 1 }], outputItemId: "radiation_ring", outputCount: 1, stationType: "crafting_table" },

    // ==========================================
    // CATEGORY 7: 首飾與奇特冒險工具 (86-94)
    // ==========================================
    { id: "explorer_goggles", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "tealprism", count: 1 }, { itemId: "ambersphere", count: 1 }, { itemId: "wood_plank", count: 1 }], outputItemId: "explorer_goggles", outputCount: 1, stationType: "crafting_table" },
    { id: "wayfinder_compass", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "mossagate", count: 1 }, { itemId: "fossilizedshell", count: 1 }, { itemId: "ironore", count: 2 }], outputItemId: "wayfinder_compass", outputCount: 1, stationType: "crafting_table" },
    { id: "recall_hearthstone", type: RecipeType.SHAPED, pattern: [[null, "rosequartz", null], ["ore", "manapearl", "ore"], [null, "ore", null]], outputItemId: "recall_hearthstone", outputCount: 1, stationType: "crafting_table" },
    { id: "lucky_jade_amulet", type: RecipeType.SHAPED, pattern: [["silverbar", "silverbar", "silverbar"], ["silverbar", "jadeorb", "silverbar"], [null, "rosequartz", null]], outputItemId: "lucky_jade_amulet", outputCount: 1, stationType: "crafting_table" },
    { id: "haste_talisman", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "citrinegeode", count: 1 }, { itemId: "coffeebean", count: 4 }, { itemId: "rawgold", count: 1 }], outputItemId: "haste_talisman", outputCount: 1, stationType: "crafting_table" },
    { id: "diving_charm", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "tealprism", count: 2 }, { itemId: "fossilizedshell", count: 2 }, { itemId: "coconut", count: 1 }], outputItemId: "diving_charm", outputCount: 1, stationType: "crafting_table" },
    { id: "gravitational_orb", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "meteoritechunk", count: 2 }, { itemId: "voidnugget", count: 1 }, { itemId: "manapearl", count: 1 }], outputItemId: "gravitational_orb", outputCount: 1, stationType: "crafting_table" },
    { id: "toxic_filter", type: RecipeType.SHAPED, pattern: [["calcitecluster", "calcitecluster", "calcitecluster"], ["charcoal", "fossilizedshell", "charcoal"]], outputItemId: "toxic_filter", outputCount: 1, stationType: "crafting_table" },
    { id: "magnet_charm", type: RecipeType.SHAPELESS, ingredients: [{ itemId: "ironore", count: 4 }, { itemId: "amethyst", count: 1 }], outputItemId: "magnet_charm", outputCount: 1, stationType: "crafting_table" },

    // ==========================================
    // CATEGORY 8: 基地家具與傳送結構 (95-100)
    // ==========================================
    { id: "ruby_lamp", type: RecipeType.SHAPED, pattern: [["rubycrystal"], ["torch"], ["wood_plank"]], outputItemId: "ruby_lamp", outputCount: 1, stationType: "crafting_table" },
    { id: "amethyst_lamp", type: RecipeType.SHAPED, pattern: [["amethyst"], ["torch"], ["wood_plank"]], outputItemId: "amethyst_lamp", outputCount: 1, stationType: "crafting_table" },
    { id: "crystal_display_stand", type: RecipeType.SHAPED, pattern: [["wood_plank", "tealprism", "wood_plank"], ["wood_plank", "wood_plank", "wood_plank"]], outputItemId: "display_stand", outputCount: 1, stationType: "crafting_table" },
    { id: "alchemy_brewing_stand", type: RecipeType.SHAPED, pattern: [["calcitecluster", "calcitecluster", "calcitecluster"], [null, "ironore", null], ["ironore", "ironore", "ironore"]], outputItemId: "alchemy_lab", outputCount: 1, stationType: "crafting_table" },
    { id: "teleporter_core", type: RecipeType.SHAPED, pattern: [["starmetalshard", "manapearl", "starmetalshard"], ["voidnugget", "recall_hearthstone", "voidnugget"], ["starmetalshard", "manapearl", "starmetalshard"]], outputItemId: "teleporter_core", outputCount: 1, stationType: "crafting_table" },
    { id: "cosmic_anvil", type: RecipeType.SHAPED, pattern: [["starmetalshard", "starmetalshard", "starmetalshard"], [null, "meteoritechunk", null], ["ironore", "ironore", "ironore"]], outputItemId: "cosmic_anvil", outputCount: 1, stationType: "crafting_table" }
];

export function getCraftingRecipes(stationType?: string): CraftingRecipe[] {
    return CRAFTING_RECIPES.filter(recipe => {
        return !stationType || !recipe.stationType || recipe.stationType === stationType;
    });
}
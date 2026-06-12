export interface ItemDefinition {
    id: string;
    name: string;
    description: string;
    iconPath?: string;
    hpRestore?: number;
    staminaRestore?: number;
    rottenTime?: number;
    attackBoost?: number;
    defBoost?: number;
    // ---- 2026 新增：裝備與冒險工具數值加成 ----
    attack?: number;          // 武器：攻擊力
    defense?: number;         // 防具/盾牌：防禦力
    speedBonus?: number;      // 鞋子/飾品：移動速度加成 (%)
    critChance?: number;      // 飾品：暴擊率加成 (%)
    miningPower?: number;     // 工具：挖掘力 (影響破壞方塊速度)
    radResistance?: number;   // 防具/藥水：抗輻射能力 (%)
}

export const ITEM_DATA: { [id: string]: ItemDefinition } = {
    acorn: {
        id: "acorn",
        name: "Acorn",
        description: "A nut from an oak tree.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/nuts/acorn.png",
        hpRestore: 0,
        staminaRestore: 2,
        rottenTime: 3600 // 1 hour
    },
    apple: {
        id: "apple",
        name: "Apple",
        description: "A common fruit.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits1/apple.png",
        hpRestore: 4,
        staminaRestore: 7,
        rottenTime: 1800 // 30 minutes
    },
    ambersphere: {
        id: "ambersphere",
        name: "Amber Sphere",
        description: "A translucent orb of ancient resin with a spark of solar light trapped inside.",
        iconPath: "smallore/ambersphere.png",
    },
    amethyst: {
        id: "amethyst",
        name: "Amethyst Spikes",
        description: "A sharp, violently purple geode that cracks with static energy.",
        iconPath: "smallore/amethyst.png",
    },
    avacado: {
        id: "avacado",
        name: "Avacado",
        description: "A creamy fruit.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits2/avacado.png",
        hpRestore: 13,
        staminaRestore: 16,
        rottenTime: 1580
    },
    blueberries: {
        id: "blueberries",
        name: "Blueberries",
        description: "Small and sweet berries.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits2/blueberrys.png",
        hpRestore: 11,
        staminaRestore: 2,
        rottenTime: 819
    },
    bluepotion: {
        id: "bluepotion",
        name: "Blue Potion",
        description: "Potion for high stamina restore.",
        iconPath: "potions/bluepotion.png",
        hpRestore: 100,
        staminaRestore: 10,
        attackBoost: 5
    },
    calcitecluster: {
        id: "calcitecluster",
        name: "Calcite Cluster",
        description: "A brittle mineral cluster, often crushed for alchemy or mortar.",
        iconPath: "smallore/calcitecluster.png",
    },
    cashew: {
        id: "cashew",
        name: "Cashew",
        description: "A creamy nut.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/nuts/cashew.png",
        hpRestore: 0,
        staminaRestore: 3,
        rottenTime: 3469
    },
    cherry: {
        id: "cherry",
        name: "Cherry",
        description: "A small and sweet fruit.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits1/cherry.png",
        hpRestore: 9,
        staminaRestore: 3,
        rottenTime: 916
    },
    chestnut: {
        id: "chestnut",
        name: "Chestnut",
        description: "A nut from a chestnut tree.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/nuts/chestnut.png",
        hpRestore: 0,
        staminaRestore: 8,
        rottenTime: 3241
    },
    citrinegeode: {
        id: "citrinegeode",
        name: "Citrine Geode",
        description: "A sharply angled gemstone used in high-tier crafting recipes.",
        iconPath: "smallore/citrinegeode.png",
    },
    coallump: {
        id: "coallump",
        name: "Coal Lump",
        description: "A common but vital lump of fuel, perfect for keeping torches lit.",
        iconPath: "smallore/coallump.png",
    },
    cobaltore: {
        id: "cobaltore",
        name: "Cobalt Ore",
        description: "A lightweight, durable ore with distinct porous patterns.",
        iconPath: "smallore/cobaltore.png",
    },
    coconut: {
        id: "coconut",
        name: "Coconut",
        description: "A sturdy coconut. Used as temporary currency for merchant testing.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits2/coconut.png",
        hpRestore: 8,
        staminaRestore: 5,
        rottenTime: 1800 // 30 min
    },
    coffeebean: {
        id: "coffeebean",
        name: "coffeebean",
        description: "Raw coffee beans.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/nuts/coffeebean.png",
        hpRestore: 0,
        staminaRestore: 1,
        rottenTime: 4096
    },
    coppercluster: {
        id: "coppercluster",
        name: "Copper Cluster",
        description: "A brittle cluster of raw copper ore, essential for early-game wiring.",
        iconPath: "smallore/coppercluster.png",
    },
    durian: {
        id: "durian",
        name: "Durian",
        description: "A spiky fruit with a strong smell.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits2/durian.png",
        hpRestore: 6,
        staminaRestore: 7,
        rottenTime: 6767
    },
    firestone: {
        id: "firestone",
        name: "Firestone",
        description: "A warm, angular stone containing a faint ember of volcanic heat.",
        iconPath: "smallore/firestone.png",
    },
    fossilizedshell: {
        id: "fossilizedshell",
        name: "Fossilized Shell",
        description: "A hardened piece of ancient remains, highly valued by historians.",
        iconPath: "smallore/fossilizedshell.png",
    },
    grapes: {
        id: "grapes",
        name: "Grapes",
        description: "Small and sweet berries.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits2/grapes.png",
        hpRestore: 9,
        staminaRestore: 3,
        rottenTime: 1018
    },
    greenapple: {
        id: "greenapple",
        name: "greenapple",
        description: "A crisp and tart apple.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits1/greenApple.png",
        hpRestore: 5,
        staminaRestore: 7,
        rottenTime: 1900
    },
    guazi: {
        id: "guazi",
        name: "Guazi",
        description: "A small and sweet fruit.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/nuts/guazi.png",
        hpRestore: 1,
        staminaRestore: 1,
        rottenTime: 2100
    },
    icecrystal: {
        id: "icecrystal",
        name: "Ice Crystal",
        description: "A frosty mineral that never melts, radiating a freezing aura.",
        iconPath: "smallore/icecrystal.png",
    },
    ironore: {
        id: "ironore",
        name: "Iron Ore",
        description: "A sturdy, metallic block that serves as the backbone of industry.",
        iconPath: "smallore/ironore.png",
    },
    jadeorb: {
        id: "jadeorb",
        name: "Jade Orb",
        description: "A polished sphere of green jade, said to bring luck to its holder.",
        iconPath: "smallore/jadeorb.png",
    },
    kiwi: {
        id: "kiwi",
        name: "Kiwi",
        description: "A fuzzy tropical fruit.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits2/kiwi.png",
        hpRestore: 11,
        staminaRestore: 2,
        rottenTime: 985
    },
    lapislazuli: {
        id: "lapislazuli",
        name: "Lapis Lazuli",
        description: "A deep blue stone highly prized by enchanters for its mystical properties.",
        iconPath: "smallore/lapislazuli.png",
    },
    manapearl: {
        id: "manapearl",
        name: "Mana Pearl",
        description: "A glowing orb concentrated with raw, pure magical energy.",
        iconPath: "smallore/manapearl.png",
    },
    meteoritechunk: {
        id: "meteoritechunk",
        name: "Meteorite Chunk",
        description: "A heavy chunk of space rock with an unusually high density.",
        iconPath: "smallore/meteoritechunk.png",
    },
    mossagate: {
        id: "mossagate",
        name: "Moss Agate",
        description: "A dull green stone covered in a natural, protective layer of moss.",
        iconPath: "smallore/mossagate.png",
    },
    mulberry: {
        id: "mulberry",
        name: "Mulberry",
        description: "A sweet and juicy berry.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits2/mulberry.png",
        hpRestore: 12,
        staminaRestore: 1,
        rottenTime: 1137
    },
    orange: {
        id: "orange",
        name: "Orange",
        description: "A citrus fruit.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits2/orange.png",
        hpRestore: 6,
        staminaRestore: 8,
        rottenTime: 1987
    },
    ore: {
        id: "ore",
        name: "Ore",
        description: "Raw ore for crafting.",
        iconPath: "Purple Planet - Platformer Tileset/Assets/Purple Planet/png/128px/objects/Diamond (1)",
    },
    peach: {
        id: "peach",
        name: "Peach",
        description: "A juicy and sweet fruit.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits1/peach.png",
        hpRestore: 13,
        staminaRestore: 4,
        rottenTime: 1153
    },
    peanuts: {
        id: "peanuts",
        name: "Peanuts",
        description: "A crunchy and protein-rich nut.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/nuts/peanuts.png",
        hpRestore: 1,
        staminaRestore: 0,
        rottenTime: 2048
    },
    pear: {
        id: "pear",
        name: "Pear",
        description: "A soft and sweet fruit.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits1/pear.png",
        hpRestore: 1,
        staminaRestore: 7,
        rottenTime: 1657
    },
    pineapple: {
        id: "pineapple",
        name: "Pineapple",
        description: "A tropical fruit with a sweet and tangy flavor.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits1/pineapple.png",
        hpRestore: 0,
        staminaRestore: 18,
        rottenTime: 2430
    },
    pistachio: {
        id: "pistachio",
        name: "Pistachio",
        description: "A delicious and nutritious nut.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/nuts/pistachio.png",
        hpRestore: -11,
        staminaRestore: 28,
        rottenTime: 2843
    },
    plum: {
        id: "plum",
        name: "Plum",
        description: "A juicy and sweet fruit.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits1/plum.png",
        hpRestore: 1,
        staminaRestore: 5,
        rottenTime: 1415
    },
    radslimechunk: {
        id: "radslimechunk",
        name: "Rad-Slime Chunk",
        description: "A toxic, glowing mass that radiates a strange chemical heat.",
        iconPath: "smallore/radslimechunk.png",
    },
    rawgold: {
        id: "rawgold",
        name: "Raw Gold",
        description: "A soft, heavy lump of pure gold gleaming with natural luxury.",
        iconPath: "smallore/rawgold.png",
    },
    redberries: {
        id: "redberries",
        name: "redberries",
        description: "Small and sweet red berries.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits2/mulberry.png",
        hpRestore: 16,
        staminaRestore: 1,
        rottenTime: 856
    },
    redpotion: {
        id: "redpotion",
        name: "Red Potion",
        description: "Potion for high hp restore.",
        iconPath: "potions/redpotion.png",
        hpRestore: 800,
        staminaRestore: 100,
        defBoost:5
    },
    rubycrystal: {
        id: "rubycrystal",
        name: "Ruby Crystal",
        description: "A perfectly formed crystalline cluster that feels warm to the touch.",
        iconPath: "smallore/rubycrystal.png",
    },
    silverbar: {
        id: "silverbar",
        name: "Silver Bar",
        description: "A refined bar of precious silver, ready for smithing holy equipment.",
        iconPath: "smallore/silverbar.png",
    },
    rosequartz: {
        id: "rosequartz",
        name: "Rose Quartz",
        description: "A smooth, pale pink crystal radiating a soothing, gentle energy.",
        iconPath: "smallore/rosequartz.png",
    },
    starmetalshard: {
        id: "starmetalshard",
        name: "Star Metal Shard",
        description: "An angular fragment of a fallen star, harder than ordinary steel.",
        iconPath: "smallore/starmetalshard.png",
    },
    strawberry: {
        id: "strawberry",
        name: "Strawberry",
        description: "A sweet and juicy berry.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits1/strawberry.png",
        hpRestore: 25,
        staminaRestore: 2,
        rottenTime: 680
    },
    tealprism: {
        id: "tealprism",
        name: "Teal Prism",
        description: "A rare crystal that refracts light into stunning oceanic hues.",
        iconPath: "smallore/tealprism.png",
    },
    voidnugget: {
        id: "voidnugget",
        name: "Void Nugget",
        description: "An unstable chunk of deep-underground ore infused with dark energy.",
        iconPath: "smallore/voidnugget.png",
    },
    watermelonslice: {
        id: "watermelonslice",
        name: "watermelonslice",
        description: "A refreshing slice of watermelon.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits2/watermelonslice.png",
        hpRestore: 3,
        staminaRestore: 6,
        rottenTime: 458
    },
    wood: {
        id: "wood",
        name: "Wood",
        description: "Basic building material."
    },
    wood_plank: {
        id: "wood_plank",
        name: "Wood Plank",
        description: "Processed wood used for building."
    },
    yellowpotion: {
        id: "yellowpotion",
        name: "Yellow Potion",
        description: "Potion for balance restore.",
        iconPath: "potions/yellowpotion.png",
        hpRestore: 450,
        staminaRestore: 450
    },
    ore_block: {
        id: "ore_block",
        name: "Ore Block",
        description: "A compact block crafted from four pieces of ore.",
        iconPath: "Purple Planet - Platformer Tileset/Assets/Purple Planet/png/128px/objects/Diamond (1)"
    },
    fruit_salad: {
        id: "fruit_salad",
        name: "Fruit Salad",
        description: "A simple dish made from apple and coconut.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits1/apple.png",
        hpRestore: 12,
        staminaRestore: 12,
        rottenTime: 1200
    },
    fire_essence: {
        id: "fire_essence",
        name: "Fire Essence",
        description: "A concentrated source of heat."
    },
    burning_coconut: {
        id: "burning_coconut",
        name: "Burning Coconut",
        description: "A coconut infused with fire essence.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits2/coconut.png"
    },
    // ==========================================
    // 2. 新增合成道具：料理類 (48 - 62)
    // ==========================================
    apple_juice: { id: "apple_juice", name: "Apple Juice", description: "Pure squeezed apple juice. Highly refreshing.", iconPath: "combined/apple_juice.png", hpRestore: 15, staminaRestore: 25, rottenTime: 600 },
    sweet_berry_jam: { id: "sweet_berry_jam", name: "Sweet Berry Jam", description: "A jar of mixed berries boiled into a thick, sweet spread.", iconPath: "combined/sweet_berry_jam.png", hpRestore: 40, staminaRestore: 10, rottenTime: 2400 },
    trail_mix: { id: "trail_mix", name: "Grandmaster Trail Mix", description: "A perfect blend of high-energy nuts for hikers.", iconPath: "combined/trail_mix.png", hpRestore: 5, staminaRestore: 35, rottenTime: 7200 },
    roasted_chestnut: { id: "roasted_chestnut", name: "Roasted Chestnut", description: "Warm, smoky chestnut cracked open and ready to eat.", iconPath: "combined/roasted_chestnut.png", hpRestore: 10, staminaRestore: 20, rottenTime: 1200 },
    baked_orange: { id: "baked_orange", name: "Baked Volcano Orange", description: "A warm citrus treat baked with specialized heat.", iconPath: "combined/baked_orange.png", hpRestore: 25, staminaRestore: 25, rottenTime: 900 },
    tropical_smoothie: { id: "tropical_smoothie", name: "Tropical Smoothie", description: "An icy blend of exotic tropical fruits.", iconPath: "combined/tropical_smoothie.png", hpRestore: 30, staminaRestore: 50, rottenTime: 400 },
    energy_bar: { id: "energy_bar", name: "Caffeine Crackle Bar", description: "Peanuts and coffee beans smashed into an energy bar.", iconPath: "combined/energy_bar.png", hpRestore: 0, staminaRestore: 120, rottenTime: 9999 },
    melon_punch: { id: "melon_punch", name: "Melon Coconut Punch", description: "A cool punch served straight inside a carved coconut.", iconPath: "combined/melon_punch.png", hpRestore: 20, staminaRestore: 40, rottenTime: 500 },
    durian_stew: { id: "durian_stew", name: "Thick Durian Stew", description: "Smells awful, tastes incredibly rich and empowering.", iconPath: "combined/durian_stew.png", hpRestore: 50, staminaRestore: 50, rottenTime: 1800 },
    avocado_toast: { id: "avocado_toast", name: "Avocado Plank Toast", description: "Slices of avocado served over a plank-shaped hardtack.", iconPath: "combined/avocado_toast.png", hpRestore: 45, staminaRestore: 45, rottenTime: 800 },
    cherry_pie: { id: "cherry_pie", name: "Golden Crust Cherry Pie", description: "A delicious baked pie with a crispy nut-based crust.", iconPath: "combined/cherry_pie.png", hpRestore: 60, staminaRestore: 30, rottenTime: 1500 },
    grape_wine: { id: "grape_wine", name: "Aged Grape Wine", description: "Finely fermented grapes. Restores immense stamina but slightly blurs vision.", iconPath: "combined/grape_wine.png", hpRestore: 20, staminaRestore: 200, rottenTime: 99999 },
    pistachio_butter: { id: "pistachio_butter", name: "Creamy Pistachio Butter", description: "A heavy paste that completely negates the raw nut's negative traits.", iconPath: "combined/pistachio_butter.png", hpRestore: 20, staminaRestore: 90, rottenTime: 5000 },
    plum_pudding: { id: "plum_pudding", name: "Plum Mulberry Pudding", description: "A dark, sweet gelatinous holiday dessert.", iconPath: "combined/plum_pudding.png", hpRestore: 40, staminaRestore: 40, rottenTime: 1000 },
    citrus_tea: { id: "citrus_tea", name: "Tart Citrus Tea", description: "A hot brew made from apples and orange peels.", iconPath: "combined/citrus_tea.png", hpRestore: 30, staminaRestore: 30, rottenTime: 600 },
    salted_guazi: { id: "salted_guazi", name: "Roasted Salted Guazi", description: "A perfect pastime snack. Crack them open!", iconPath: "combined/salted_guazi.png", hpRestore: 5, staminaRestore: 5, rottenTime: 8000 },
    hot_coffee: { id: "hot_coffee", name: "Steaming Black Coffee", description: "Pure adrenaline in a cup. Keeps you wide awake.", iconPath: "combined/hot_coffee.png", hpRestore: 0, staminaRestore: 80, rottenTime: 600 },
    strawberry_sundae: { id: "strawberry_sundae", name: "Glacial Strawberry Sundae", description: "Chilled with real ice crystals. Incredibly refreshing.", iconPath: "combined/strawberry_sundae.png", hpRestore: 70, staminaRestore: 40, rottenTime: 300 },
    premium_fruit_platter: { id: "premium_fruit_platter", name: "Royal Fruit Platter", description: "An elite arrangement of the finest orchard fruits.", iconPath: "combined/premium_fruit_platter.png", hpRestore: 100, staminaRestore: 100, rottenTime: 600 },

    // ==========================================
    // 3. 新增合成道具：進階藥水類 (63 - 73)
    // ==========================================
    antidote_potion: { id: "antidote_potion", name: "Purifying Antidote", description: "Neutralizes all basic toxins and poisons instantly.", iconPath: "combined/antidote_potion.png", hpRestore: 50 },
    rad_shield_serum: { id: "rad_shield_serum", name: "Rad-Shield Serum", description: "Tastes metallic. Grants heavy immunity to environmental radiation.", iconPath: "combined/rad_shield_serum.png", radResistance: 75 },
    berserk_brew: { id: "berserk_brew", name: "Crimson Berserk Brew", description: "Ignites your blood! Grants temporary damage boost but drains stamina.", iconPath: "combined/berserk_brew.png", hpRestore: -50, attack: 15 },
    frozen_tonic: { id: "frozen_tonic", name: "Glacial Ward Tonic", description: "Freezes your body temperature, making you completely immune to fire areas.", iconPath: "combined/frozen_tonic.png", staminaRestore: 50 },
    midas_oil: { id: "midas_oil", name: "Midas Touch Oil", description: "Coat your weapons to make monsters explode into extra coins upon death.", iconPath: "combined/midas_oil.png", critChance: 5 },
    starlight_elixir: { id: "starlight_elixir", name: "Cosmic Starlight Elixir", description: "An otherworldly potion that increases spell power and speed.", iconPath: "combined/starlight_elixir.png", hpRestore: 200, staminaRestore: 200 },
    xp_boost_potion: { id: "xp_boost_potion", name: "Enchanter's Wisdom Potion", description: "Doubles all experience gained from mining and combat temporarily.", iconPath: "combined/xp_boost_potion.png" },
    speed_juice: { id: "speed_juice", name: "Hyperdrive Juice", description: "You feel like you can run faster than the wind.", iconPath: "combined/speed_juice.png", speedBonus: 25, staminaRestore: 50 },
    shadow_essence: { id: "shadow_essence", name: "Liquid Shadow Essence", description: "Allows you to become completely invisible to monsters for a short duration.", iconPath: "combined/shadow_essence.png" },
    love_potion: { id: "love_potion", name: "Rose Quartz Elixir", description: "Increases charisma and reduces shop prices by 20%.", iconPath: "combined/love_potion.png", hpRestore: 150 },
    regrowth_fertilizer: { id: "regrowth_fertilizer", name: "Regrowth Fertilizer", description: "Throw it on crops to make them grow to full size instantly.", iconPath: "combined/regrowth_fertilizer.png" },
    mana_soup: { id: "mana_soup", name: "Glowing Mana Soup", description: "A warm soup that tastes like stardust and blue berries.", iconPath: "combined/mana_soup.png", hpRestore: 80, staminaRestore: 150 },

    // ==========================================
    // 4. 新增合成道具：工具類 (74 - 83)
    // ==========================================
    copper_pickaxe: { id: "copper_pickaxe", name: "Copper Pickaxe", description: "A simple starter tool for breakable rocks.", iconPath: "combined/copper_pickaxe.png", attack: 4, miningPower: 25 },
    copper_axe: { id: "copper_axe", name: "Copper Axe", description: "Basic hatchet to chop down wooden trees.", iconPath: "combined/copper_axe.png", attack: 5, miningPower: 20 },
    iron_pickaxe: { id: "iron_pickaxe", name: "Heavy Iron Pickaxe", description: "Sturdy industrial pickaxe capable of breaking mid-tier ores.", iconPath: "combined/iron_pickaxe.png", attack: 8, miningPower: 50 },
    iron_axe: { id: "iron_axe", name: "Heavy Iron Axe", description: "Chops trees down in just a few heavy swings.", iconPath: "combined/iron_axe.png", attack: 10, miningPower: 45 },
    silver_pickaxe: { id: "silver_pickaxe", name: "Gleaming Silver Pickaxe", description: "Beautiful tool that glimmers in the dark. Higher speed.", iconPath: "combined/silver_pickaxe.png", attack: 11, miningPower: 65 },
    silver_axe: { id: "silver_axe", name: "Gleaming Silver Axe", description: "Polished silver edge cuts smoothly through dense logs.", iconPath: "combined/silver_axe.png", attack: 13, miningPower: 60 },
    gold_pickaxe: { id: "gold_pickaxe", name: "Gilded Pickaxe", description: "Extremely fast, but has slightly lower durability.", iconPath: "combined/gold_pickaxe.png", attack: 12, miningPower: 80 },
    gold_axe: { id: "gold_axe", name: "Gilded Axe", description: "Luxury woodcutting axe that occasionally yields rare drops.", iconPath: "combined/gold_axe.png", attack: 14, miningPower: 75 },
    cobalt_pickaxe: { id: "cobalt_pickaxe", name: "Cobalt Sonic Pickaxe", description: "Lightweight otherworldly pickaxe that mines exceptionally fast.", iconPath: "combined/cobalt_pickaxe.png", attack: 16, miningPower: 110 },
    cobalt_axe: { id: "cobalt_axe", name: "Cobalt Sonic Axe", description: "Slices through ancient wood like butter.", iconPath: "combined/cobalt_axe.png", attack: 18, miningPower: 100 },
    starmetal_pickaxe: { id: "starmetal_pickaxe", name: "Cosmic Star-Metal Pickaxe", description: "Forged from fallen stars. Can mine any deep-underground block.", iconPath: "combined/starmetal_pickaxe.png", attack: 22, miningPower: 150 },
    starmetal_axe: { id: "starmetal_axe", name: "Cosmic Star-Metal Axe", description: "Infused with stellar light. Leaves trail effects on swing.", iconPath: "combined/starmetal_axe.png", attack: 25, miningPower: 140 },
    void_hoe: { id: "void_hoe", name: "Void Infused Hoe", description: "Tills soil in a 3x3 area instantly using spatial rifts.", iconPath: "combined/void_hoe.png", attack: 5 },
    lucky_fishing_rod: { id: "lucky_fishing_rod", name: "Jade Lucky Rod", description: "Increases the chance of pulling up rare treasure chests while fishing.", iconPath: "combined/lucky_fishing_rod.png", critChance: 10 },
    alchemists_hammer: { id: "alchemists_hammer", name: "Alchemist's Breaker Hammer", description: "Used to crush geodes and raw mineral clusters into double ingredients.", iconPath: "combined/alchemists_hammer.png", attack: 15, miningPower: 40 },

    // ==========================================
    // 5. 新增合成道具：武器與彈藥類 (84 - 94)
    // ==========================================
    copper_sword: { id: "copper_sword", name: "Copper Shortsword", description: "Better than your bare fists, but not by much.", iconPath: "combined/copper_sword.png", attack: 6 },
    iron_sword: { id: "iron_sword", name: "Iron Broadsword", description: "A reliable weapon forged with the backbone of classic smithing.", iconPath: "combined/iron_sword.png", attack: 14 },
    silver_sword: { id: "silver_sword", name: "Holy Silver Blade", description: "Deals 50% bonus radiant damage to undead and shadow monsters.", iconPath: "combined/silver_sword.png", attack: 22, critChance: 5 },
    golden_rapier: { id: "golden_rapier", name: "Royal Citrine Rapier", description: "A swift thrusting sword that boosts critical strike rates.", iconPath: "combined/golden_rapier.png", attack: 26, critChance: 12 },
    ruby_flameblade: { id: "ruby_flameblade", name: "Ruby Volcano Flameblade", description: "Sears enemies with a volcanic burn, dealing damage over time.", iconPath: "combined/ruby_flameblade.png", attack: 38 },
    starmetal_sword: { id: "starmetal_sword", name: "Celestial Star-Metal Greatsword", description: "Summons tiny falling stars to strike targets on critical hits.", iconPath: "combined/starmetal_sword.png", attack: 52, critChance: 8 },
    void_dagger: { id: "void_dagger", name: "Void Fracture Dagger", description: "Attacks incredibly fast. Ignores 30% of the target's physical armor.", iconPath: "combined/void_dagger.png", attack: 28, speedBonus: 10 },
    frost_spear: { id: "frost_spear", name: "Glacial Shard Spear", description: "Long melee reach. Freezes and slows down enemy movement speeds.", iconPath: "combined/frost_spear.png", attack: 32 },
    ocean_mace: { id: "ocean_mace", name: "Deep Ocean Mace", description: "A heavy blunt weapon crafted from calcified ancient materials.", iconPath: "combined/ocean_mace.png", attack: 45, miningPower: 30 },
    nature_staff: { id: "nature_staff", name: "Gaean Moss Agate Staff", description: "Shoots homing nature orbs that heal the user for a small fraction of damage dealt.", iconPath: "combined/nature_staff.png", attack: 30 },
    meteor_bullet: { id: "meteor_bullet", name: "Meteorite Bullets", description: "High velocity firearm ammunition that pierces through one enemy.", iconPath: "combined/meteor_bullet.png", attack: 12 },
    crystal_arrow: { id: "crystal_arrow", name: "Citrine Crystal Arrow", description: "Shatters on impact, dealing minor splash damage to surrounding targets.", iconPath: "combined/crystal_arrow.png", attack: 10 },
    flame_arrow: { id: "flame_arrow", name: "Incendiary Flame Arrow", description: "Sets targets on fire upon impact.", iconPath: "combined/flame_arrow.png", attack: 8 },
    ice_arrow: { id: "ice_arrow", name: "Frostbite Crystal Arrow", description: "Slows down target hit boxes.", iconPath: "combined/ice_arrow.png", attack: 8 },
    poison_dart: { id: "poison_dart", name: "Rad-Toxic Blowpipe Dart", description: "Inflicts a nasty chemical sickness that ticks away health.", iconPath: "combined/poison_dart.png", attack: 5 },

    // ==========================================
    // 6. 新增合成道具：防具與飾品類 (95 - 105)
    // ==========================================
    iron_shield: { id: "iron_shield", name: "Iron Round Shield", description: "Block oncoming projectiles and physical strikes to mitigate damage.", iconPath: "combined/iron_shield.png", defense: 5 },
    copper_helmet: { id: "copper_helmet", name: "Copper Cap", description: "Cheap skull protection.", iconPath: "combined/copper_helmet.png", defense: 2 },
    copper_chestplate: { id: "copper_chestplate", name: "Copper Mail", description: "A basic metallic coat to guard your vitals.", iconPath: "combined/copper_chestplate.png", defense: 4 },
    iron_helmet: { id: "iron_helmet", name: "Iron Great Helm", description: "Provides reliable physical head protection.", iconPath: "combined/iron_helmet.png", defense: 4 },
    iron_chestplate: { id: "iron_chestplate", name: "Iron Cuirass", description: "The standard military armor plate for seasoned guards.", iconPath: "combined/iron_chestplate.png", defense: 8 },
    silver_helmet: { id: "silver_helmet", name: "Knightly Silver Visor", description: "Exquisite craftsmanship offering holy defensive boosts.", iconPath: "combined/silver_helmet.png", defense: 6 },
    silver_chestplate: { id: "silver_chestplate", name: "Knightly Silver Breastplate", description: "Polished and bright armor plating.", iconPath: "combined/silver_chestplate.png", defense: 12 },
    gilded_breastplate: { id: "gilded_breastplate", name: "Gilded Jade Vest", description: "Regal gold plated heavy armor that increases luck metrics.", iconPath: "combined/gilded_breastplate.png", defense: 15, critChance: 4 },
    cobalt_shield: { id: "cobalt_shield", name: "Cobalt Aegis Shield", description: "Completely immunizes the user against knockback effects.", iconPath: "combined/cobalt_shield.png", defense: 10 },
    starmetal_helmet: { id: "starmetal_helmet", name: "Astral Star-Metal Mask", description: "Increases starlight attunement and critical multipliers.", iconPath: "combined/starmetal_helmet.png", defense: 10, critChance: 5 },
    starmetal_chestplate: { id: "starmetal_chestplate", name: "Astral Star-Metal Chestplate", description: "Defends with the protective hardness of a meteor shield.", iconPath: "combined/starmetal_chestplate.png", defense: 22 },
    void_armor: { id: "void_armor", name: "Abyssal Void Exoskeleton", description: "Endgame plates that wrap the user in a defensive spatial shroud.", iconPath: "combined/void_armor.png", defense: 30, radResistance: 50 },
    fire_ring: { id: "fire_ring", name: "Volcanic Ruby Band", description: "Accessory. Adds +5 fire damage to all base physical attacks.", iconPath: "combined/fire_ring.png", attack: 5 },
    ice_ring: { id: "ice_ring", name: "Glacial Mana Loop", description: "Accessory. Reduces stamina consumption of sprinting and tools by 15%.", iconPath: "combined/ice_ring.png", defense: 2 },
    radiation_ring: { id: "radiation_ring", name: "Lead-Coated Rad Ring", description: "Accessory. Passively cleanses minor radioactive exposure build up.", iconPath: "combined/radiation_ring.png", radResistance: 25 },

    // ==========================================
    // 7. 新增合成道具：飾品與特殊功能類 (106 - 114)
    // ==========================================
    explorer_goggles: { id: "explorer_goggles", name: "Teal Vision Goggles", description: "Light spectrum glasses that illuminate pitch black caves.", iconPath: "combined/explorer_goggles.png" },
    wayfinder_compass: { id: "wayfinder_compass", name: "Wayfinder Moss Compass", description: "Points directly toward the nearest deep-underground temple or dungeon.", iconPath: "combined/wayfinder_compass.png" },
    recall_hearthstone: { id: "recall_hearthstone", name: "Hearthstone of Return", description: "Channel for 5 seconds to warp instantly back to your spawn bed.", iconPath: "combined/recall_hearthstone.png" },
    lucky_jade_amulet: { id: "lucky_jade_amulet", name: "Lucky Jade Charm", description: "Significantly enhances loot tables and monster coin value drop chances.", iconPath: "combined/lucky_jade_amulet.png", critChance: 7 },
    haste_talisman: { id: "haste_talisman", name: "Caffeinated Gold Medallion", description: "Accessory. Boosts attack and mining speed velocities by 12%.", iconPath: "combined/haste_talisman.png", speedBonus: 10 },
    diving_charm: { id: "diving_charm", name: "Fossilized Oceanic Totem", description: "Allows the user to breathe underwater for twice as long.", iconPath: "combined/diving_charm.png" },
    gravitational_orb: { id: "gravitational_orb", name: "Dense Gravitational Core", description: "Increases item pickup radius by 4 blocks and slows falling speed.", iconPath: "combined/gravitational_orb.png" },
    toxic_filter: { id: "toxic_filter", name: "Bio-Hazard Charcoal Mask", description: "Provides temporary total protection against toxic gas pockets.", iconPath: "combined/toxic_filter.png", radResistance: 40 },
    magnet_charm: { id: "magnet_charm", name: "Lodestone Amethyst Ring", description: "Accessory. Magnetizes fallen metallic ore drops straight to your inventory.", iconPath: "combined/magnet_charm.png" },

    // ==========================================
    // 8. 新增合成道具：公用建築與終極核心 (115 - 120)
    // ==========================================
    ruby_lamp: { id: "ruby_lamp", name: "Ruby Warm Lantern", description: "A furniture object that radiates a cozy red glow and melts nearby snow blocks.", iconPath: "combined/ruby_lamp.png" },
    amethyst_lamp: { id: "amethyst_lamp", name: "Amethyst Static Lantern", description: "An electronic lantern that deters bat monsters from flying nearby.", iconPath: "combined/amethyst_lamp.png" },
    display_stand: { id: "display_stand", name: "Prismatic Display Pedestal", description: "Place it in your house to showcase your favorite rare gems and achievements.", iconPath: "combined/display_stand.png" },
    alchemy_lab: { id: "alchemy_lab", name: "Advanced Alchemy Station", description: "Crafting station used to mix tier-2 potions and cook high-end magical elixirs.", iconPath: "combined/alchemy_lab.png" },
    teleporter_core: { id: "teleporter_core", name: "Interstellar Teleporter Node", description: "Place two of these across your game world to build a custom fast travel portal.", iconPath: "combined/teleporter_core.png" },
    cosmic_anvil: { id: "cosmic_anvil", name: "Cosmic Anvil Block", description: "The ultimate endgame smithy needed to forge star-metal and void armaments.", iconPath: "combined/cosmic_anvil.png" }
};

export function getItemDefinition(id: string): ItemDefinition | null {
    return ITEM_DATA[id] || null;
}
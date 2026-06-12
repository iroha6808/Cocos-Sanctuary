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
    }
};

export function getItemDefinition(id: string): ItemDefinition | null {
    return ITEM_DATA[id] || null;
}

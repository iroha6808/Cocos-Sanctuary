export interface ItemDefinition {
    id: string;
    name: string;
    description: string;
    iconPath?: string;
    hpRestore?: number; // for food items and potions, how much HP they restore
    staminaRestore?: number; // for food items, how much stamina they restore
    rottenTime?: number; // for food items, how long until they rot (in seconds)
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
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits2/blueberries.png",
        hpRestore: 11,
        staminaRestore: 2,
        rottenTime: 819
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
    coconut: {
        id: "coconut",
        name: "Coconut",
        description: "A sturdy coconut. Used as temporary currency for merchant testing.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits2/coconut.png",
        hpRestore: 8,
        staminaRestore: 5,
        rottenTime: 1800 // 30 minutes
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
    durian: {
        id: "durian",
        name: "Durian",
        description: "A spiky fruit with a strong smell.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits2/durian.png",
        hpRestore: 6,
        staminaRestore: 7,
        rottenTime: 6767
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
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits1/greenapple.png",
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
    kiwi: {
        id: "kiwi",
        name: "Kiwi",
        description: "A fuzzy tropical fruit.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits2/kiwi.png",
        hpRestore: 11,
        staminaRestore: 2,
        rottenTime: 985
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
    potion: {
        id: "potion",
        name: "Potion",
        description: "A simple healing potion.",
        hpRestore: 110
    },
    redberries: {
        id: "redberries",
        name: "redberries",
        description: "Small and sweet red berries.",
        iconPath: "100 FOOD ASSETS/Assets/food/food/fruits2/redberries.png",
        hpRestore: 16,
        staminaRestore: 1,
        rottenTime: 856
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
    }
};

export function getItemDefinition(id: string): ItemDefinition | null {
    return ITEM_DATA[id] || null;
}

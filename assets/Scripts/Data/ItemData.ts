export interface ItemDefinition {
    id: string;
    name: string;
    description: string;
    iconPath?: string;
}

export const ITEM_DATA: { [id: string]: ItemDefinition } = {
    coconut: {
        id: "coconut",
        name: "Coconut",
        description: "A sturdy coconut. Used as temporary currency for merchant testing.",
        iconPath: "assets/Textures/100 FOOD ASSETS/Assets/food/food/fruits2/coconut.png"
    },
    potion: {
        id: "potion",
        name: "Potion",
        description: "A simple healing potion."
    },
    apple: {
        id: "apple",
        name: "Apple",
        description: "A common fruit."
    },
    ore: {
        id: "ore",
        name: "Ore",
        description: "Raw ore for crafting."
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

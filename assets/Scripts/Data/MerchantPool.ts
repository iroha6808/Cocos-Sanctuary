import { getItemDefinition } from "./ItemData";

export interface MerchantStockItem {
    itemId: string;
    price: number;
    stock: number;
}

export interface MerchantPoolEntry {
    itemId: string;
    weight: number;
    price: number;
    minStock: number;
    maxStock: number;
}

export const TRAVELING_MERCHANT_POOL: MerchantPoolEntry[] = [
    { itemId: "potion", weight: 10, price: 3, minStock: 2, maxStock: 5 },
    { itemId: "apple", weight: 8, price: 1, minStock: 3, maxStock: 8 },
    { itemId: "ore", weight: 5, price: 4, minStock: 1, maxStock: 4 },
    { itemId: "wood", weight: 6, price: 2, minStock: 2, maxStock: 6 }
];

export function getDefaultMerchantStock(): MerchantStockItem[] {
    return [
        { itemId: "potion", price: 3, stock: 3 },
        { itemId: "apple", price: 1, stock: 5 },
        { itemId: "ore", price: 4, stock: 2 }
    ];
}

export function isKnownMerchantItem(itemId: string): boolean {
    return !!getItemDefinition(itemId);
}

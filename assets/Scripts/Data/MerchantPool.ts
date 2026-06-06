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

export interface MerchantRollContext {
    gameStage?: number;
    weather?: string;
    merchantTrait?: string;
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

export function rollMerchantStock(count: number, context?: MerchantRollContext): MerchantStockItem[] {
    const safeCount = Math.max(0, Math.floor(count));
    if (safeCount <= 0) {
        return [];
    }

    const candidates = TRAVELING_MERCHANT_POOL
        .filter(entry => isKnownMerchantItem(entry.itemId) && entry.weight > 0)
        .map(entry => {
            return {
                entry,
                weight: getContextualWeight(entry, context)
            };
        })
        .filter(candidate => candidate.weight > 0);

    const result: MerchantStockItem[] = [];
    const remaining = candidates.slice();

    while (result.length < safeCount && remaining.length > 0) {
        const selectedIndex = rollWeightedIndex(remaining.map(candidate => candidate.weight));
        if (selectedIndex < 0) {
            break;
        }

        const selected = remaining.splice(selectedIndex, 1)[0].entry;
        result.push({
            itemId: selected.itemId,
            price: selected.price,
            stock: randomInt(selected.minStock, selected.maxStock)
        });
    }

    return result;
}

function rollWeightedIndex(weights: number[]): number {
    const totalWeight = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
    if (totalWeight <= 0) {
        return -1;
    }

    let roll = Math.random() * totalWeight;
    for (let i = 0; i < weights.length; i++) {
        roll -= Math.max(0, weights[i]);
        if (roll <= 0) {
            return i;
        }
    }

    return weights.length - 1;
}

function randomInt(min: number, max: number): number {
    const safeMin = Math.ceil(Math.min(min, max));
    const safeMax = Math.floor(Math.max(min, max));
    return safeMin + Math.floor(Math.random() * (safeMax - safeMin + 1));
}

function getContextualWeight(entry: MerchantPoolEntry, context?: MerchantRollContext): number {
    if (!context) {
        return entry.weight;
    }

    let weight = entry.weight;

    if (context.gameStage && context.gameStage >= 2 && entry.itemId === "ore") {
        weight += 3;
    }

    if (context.weather === "rain" && entry.itemId === "apple") {
        weight += 2;
    }

    if (context.merchantTrait === "miner" && entry.itemId === "ore") {
        weight += 5;
    }

    if (context.merchantTrait === "forager" && (entry.itemId === "apple" || entry.itemId === "wood")) {
        weight += 3;
    }

    return weight;
}

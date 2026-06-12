const { ccclass, property } = cc._decorator;

export enum SpawnEnvironment {
    LAND = 0,
    WATER = 1
}

cc.Enum(SpawnEnvironment);

@ccclass("MonsterSpawnEntry")
export class MonsterSpawnEntry {
    @property(cc.String)
    public id: string = "monster";

    @property(cc.Prefab)
    public prefab: cc.Prefab = null;

    @property(cc.Float)
    public weight: number = 1;

    @property(cc.Integer)
    public maxAlive: number = 3;

    @property(cc.Integer)
    public spawnCost: number = 1;

    @property(cc.Integer)
    public minGameStage: number = 0;

    @property(cc.String)
    public region: string = "";

    @property(cc.String)
    public requiredTimeOfDay: string = "";

    @property(cc.String)
    public requiredWeather: string = "";

    @property(cc.Float)
    public spawnClearanceWidth: number = 48;

    @property(cc.Float)
    public spawnClearanceHeight: number = 64;

    @property({
        type: cc.Float,
        range: [0, 1, 0.05],
        slide: true,
        tooltip: "Water only. 0 is near the surface and 1 is near the bottom."
    })
    public minDepthRatio: number = 0;

    @property({
        type: cc.Float,
        range: [0, 1, 0.05],
        slide: true,
        tooltip: "Water only. 0 is near the surface and 1 is near the bottom."
    })
    public maxDepthRatio: number = 1;
}

export interface MonsterSpawnContext {
    gameStage?: number;
    region?: string;
    timeOfDay?: string;
    weather?: string;
}

export interface MonsterAliveCounts {
    [monsterId: string]: number;
}

export function getEligibleMonsterEntries(
    entries: MonsterSpawnEntry[],
    context: MonsterSpawnContext,
    aliveCounts: MonsterAliveCounts,
    remainingBudget: number
): MonsterSpawnEntry[] {
    const stage = context && typeof context.gameStage === "number"
        ? context.gameStage
        : 0;

    return (entries || []).filter(entry => {
        if (!entry || !entry.id || !entry.prefab || entry.weight <= 0) {
            return false;
        }
        if (stage < Math.max(0, entry.minGameStage)) {
            return false;
        }
        if (entry.maxAlive > 0 && (aliveCounts[entry.id] || 0) >= entry.maxAlive) {
            return false;
        }
        if (entry.spawnCost > Math.max(0, remainingBudget)) {
            return false;
        }
        if (entry.region && entry.region !== (context.region || "")) {
            return false;
        }
        if (
            entry.requiredTimeOfDay
            && entry.requiredTimeOfDay !== (context.timeOfDay || "")
        ) {
            return false;
        }
        if (
            entry.requiredWeather
            && entry.requiredWeather !== (context.weather || "")
        ) {
            return false;
        }
        return true;
    });
}

export function pickWeightedMonsterEntry(
    entries: MonsterSpawnEntry[],
    randomValue: number = Math.random()
): MonsterSpawnEntry {
    const candidates = (entries || []).filter(entry => entry && entry.weight > 0);
    const totalWeight = candidates.reduce(
        (sum, entry) => sum + Math.max(0, entry.weight),
        0
    );
    if (totalWeight <= 0) {
        return null;
    }

    const normalizedRandom = Math.max(0, Math.min(0.999999, randomValue));
    let roll = normalizedRandom * totalWeight;
    for (const entry of candidates) {
        roll -= Math.max(0, entry.weight);
        if (roll < 0) {
            return entry;
        }
    }
    return candidates[candidates.length - 1] || null;
}

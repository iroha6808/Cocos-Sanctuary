// 統一管理所有事件名稱
export const GameEvent = {
    PLAYER_HP_CHANGED: "PLAYER_HP_CHANGED",
    PLAYER_EXP_CHANGED: "PLAYER_EXP_CHANGED",
    PLAYER_DIED: "PLAYER_DIED",
    NPC_MOCKED: "NPC_MOCKED",
    NPC_DIED: "NPC_DIED",
    SPAWN_ITEM: "SPAWN_ITEM"
};

// 實體類型
export enum EntityType {
    PLAYER = 0,
    NPC_PEACE = 1,
    NPC_NEUTRAL = 2,
    NPC_HOSTILE = 3
}

cc.Enum(EntityType);

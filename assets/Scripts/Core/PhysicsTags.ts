export enum PhysicsTag {
    DEFAULT = 0,
    PLAYER_BODY = 10,
    NPC_BODY = 20,
    DROP_ITEM = 30,
    TERRAIN = 40,
    ATTACK_HITBOX = 50,
    PROJECTILE = 60,
    TRIGGER = 70
}

const DISABLED_CONTACT_PAIRS: { [key: string]: boolean } = {
    "10:30": true,
    "20:30": true,
    "30:30": true,
    "30:50": true,
    "30:60": true
};

export function isDropItemTag(tag: number): boolean {
    return tag === PhysicsTag.DROP_ITEM;
}

export function shouldDisablePhysicalContact(tagA: number, tagB: number): boolean {
    const low = Math.min(tagA, tagB);
    const high = Math.max(tagA, tagB);
    return !!DISABLED_CONTACT_PAIRS[`${low}:${high}`];
}

export function describePhysicsTag(tag: number): string {
    switch (tag) {
        case PhysicsTag.PLAYER_BODY:
            return "PLAYER_BODY";
        case PhysicsTag.NPC_BODY:
            return "NPC_BODY";
        case PhysicsTag.DROP_ITEM:
            return "DROP_ITEM";
        case PhysicsTag.TERRAIN:
            return "TERRAIN";
        case PhysicsTag.ATTACK_HITBOX:
            return "ATTACK_HITBOX";
        case PhysicsTag.PROJECTILE:
            return "PROJECTILE";
        case PhysicsTag.TRIGGER:
            return "TRIGGER";
        default:
            return `DEFAULT(${tag})`;
    }
}

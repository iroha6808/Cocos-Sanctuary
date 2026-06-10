export enum PlayerToolMode {
    Gun = 1,
    Jetpack = 2,
    Grapple = 3
}

cc.Enum(PlayerToolMode);

export function getPlayerToolModeName(mode: PlayerToolMode): string {
    switch (mode) {
        case PlayerToolMode.Jetpack:
            return "Jetpack";
        case PlayerToolMode.Grapple:
            return "Grapple";
        case PlayerToolMode.Gun:
        default:
            return "Gun";
    }
}

import EventCenter from "./EventCenter";
import { GameEvent } from "./Constants";

const { ccclass, property } = cc._decorator;

export enum ThemeName {
    DEFAULT = "default",
    OCEAN = "ocean"
}

cc.Enum(ThemeName);

@ccclass
export default class ThemeManager extends cc.Component {
    public static instance: ThemeManager = null;

    @property(cc.Node)
    public tintOverlay: cc.Node = null;

    @property([cc.Node])
    public tintTargets: cc.Node[] = [];

    @property(cc.Color)
    public defaultTint: cc.Color = cc.Color.WHITE;

    @property(cc.Color)
    public oceanTint: cc.Color = cc.color(150, 210, 255);

    @property({ type: cc.Float, range: [0, 2, 0.05], slide: true })
    public themeFadeDuration: number = 0.45;

    @property(cc.Boolean)
    public autoApplyOceanTheme: boolean = false;

    private currentTheme: string = ThemeName.DEFAULT;
    private originalColors: { [uuid: string]: cc.Color } = {};

    onLoad(): void {
        ThemeManager.instance = this;
        for (const target of this.tintTargets) {
            this.registerTintTarget(target);
        }
        EventCenter.on(GameEvent.PLAYER_WATER_STATE_CHANGED, this.onWaterStateChanged, this);
    }

    onDestroy(): void {
        if (ThemeManager.instance === this) {
            ThemeManager.instance = null;
        }
        EventCenter.off(GameEvent.PLAYER_WATER_STATE_CHANGED, this.onWaterStateChanged, this);
    }

    public static apply(themeName: string, duration?: number): void {
        if (ThemeManager.instance) {
            ThemeManager.instance.applyTheme(themeName, duration);
        }
    }

    public registerTintTarget(node: cc.Node): void {
        if (!node || !cc.isValid(node)) {
            return;
        }
        if (this.tintTargets.indexOf(node) === -1) {
            this.tintTargets.push(node);
        }
        if (!this.originalColors[node.uuid]) {
            this.originalColors[node.uuid] = cc.color(node.color.r, node.color.g, node.color.b, node.color.a);
        }
    }

    public applyTheme(themeName: string, duration: number = this.themeFadeDuration): void {
        const nextTheme = themeName || ThemeName.DEFAULT;
        const targetColor = this.getThemeColor(nextTheme);
        this.currentTheme = nextTheme;

        for (const target of this.tintTargets) {
            if (!target || !cc.isValid(target)) {
                continue;
            }
            const color = nextTheme === ThemeName.DEFAULT && this.originalColors[target.uuid]
                ? this.originalColors[target.uuid]
                : targetColor;
            this.tweenNodeColor(target, color, duration);
        }

        if (this.tintOverlay && cc.isValid(this.tintOverlay)) {
            this.tintOverlay.active = true;
            this.tweenNodeColor(this.tintOverlay, targetColor, duration);
            const opacity = nextTheme === ThemeName.DEFAULT ? 0 : 70;
            cc.tween(this.tintOverlay)
                .to(Math.max(0, duration), { opacity })
                .call(() => {
                    if (this.tintOverlay && cc.isValid(this.tintOverlay)) {
                        this.tintOverlay.active = this.tintOverlay.opacity > 0;
                    }
                })
                .start();
        }

        EventCenter.emit(GameEvent.THEME_CHANGED, this.currentTheme);
    }

    public getCurrentTheme(): string {
        return this.currentTheme;
    }

    private onWaterStateChanged(isInWater: boolean): void {
        if (!this.autoApplyOceanTheme) {
            return;
        }
        this.applyTheme(isInWater ? ThemeName.OCEAN : ThemeName.DEFAULT);
    }

    private getThemeColor(themeName: string): cc.Color {
        switch (themeName) {
            case ThemeName.OCEAN:
                return this.oceanTint;
            case ThemeName.DEFAULT:
            default:
                return this.defaultTint;
        }
    }

    private tweenNodeColor(node: cc.Node, color: cc.Color, duration: number): void {
        if (duration <= 0) {
            node.color = color;
            return;
        }
        cc.tween(node).to(duration, { color }).start();
    }
}

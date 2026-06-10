const { ccclass, property } = cc._decorator;

export enum EffectType {
    HIT = "hit",
    COLLECT = "collect",
    HEAL = "heal",
    FIRE = "fire",
    WATER = "water",
    GUN_MUZZLE = "gun_muzzle",
    DAMAGE_SPARK = "damage_spark",
    BOSS_TELEPORT = "boss_teleport",
    BOSS_SUMMON = "boss_summon",
    JETPACK_FLAME = "jetpack_flame",
    GRAPPLE_ATTACH = "grapple_attach"
}

@ccclass
export default class EffectsManager extends cc.Component {
    public static instance: EffectsManager = null;

    @property(cc.Node)
    public effectRoot: cc.Node = null;

    @property(cc.SpriteFrame)
    public particleSpriteFrame: cc.SpriteFrame = null;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    onLoad(): void {
        EffectsManager.instance = this;
        if (!this.effectRoot) {
            this.effectRoot = this.node;
        }
    }

    onDestroy(): void {
        if (EffectsManager.instance === this) {
            EffectsManager.instance = null;
        }
    }

    public static play(type: EffectType, worldPosition: cc.Vec2): void {
        if (EffectsManager.instance) {
            EffectsManager.instance.playEffect(type, worldPosition);
        }
    }

    public playEffect(type: EffectType, worldPosition: cc.Vec2): void {
        if (!this.effectRoot || !cc.isValid(this.effectRoot)) {
            return;
        }

        const effectNode = new cc.Node(`Effect_${type}`);
        effectNode.parent = this.effectRoot;
        effectNode.setPosition(this.toLocalPosition(worldPosition));

        const particle = effectNode.addComponent(cc.ParticleSystem);
        this.configureParticle(particle, type);
        particle.resetSystem();

        this.scheduleOnce(() => {
            if (cc.isValid(effectNode)) {
                effectNode.destroy();
            }
        }, 1.2);

        if (this.debugLog) {
            cc.log(`[EffectsManager] ${type} at (${worldPosition.x.toFixed(1)}, ${worldPosition.y.toFixed(1)})`);
        }
    }

    private configureParticle(particle: cc.ParticleSystem, type: EffectType): void {
        const config = this.getConfig(type);
        const anyParticle = particle as any;
        particle.duration = config.duration;
        particle.life = config.life;
        particle.lifeVar = config.lifeVar;
        particle.totalParticles = config.totalParticles;
        particle.emissionRate = config.emissionRate;
        particle.speed = config.speed;
        particle.speedVar = config.speedVar;
        particle.startSize = config.startSize;
        particle.startSizeVar = config.startSizeVar;
        particle.endSize = config.endSize;
        particle.angle = config.angle;
        particle.angleVar = config.angleVar;
        particle.startColor = config.startColor;
        particle.endColor = config.endColor;
        const positionType = (cc.ParticleSystem as any).PositionType;
        anyParticle.positionType = positionType ? positionType.FREE : 0;
        anyParticle.autoRemoveOnFinish = false;

        if (this.particleSpriteFrame) {
            anyParticle.texture = this.particleSpriteFrame.getTexture();
        }
    }

    private getConfig(type: EffectType) {
        switch (type) {
            case EffectType.COLLECT:
                return this.config(0.25, 0.45, 14, 60, 70, 14, cc.color(255, 230, 90, 230), cc.color(255, 255, 255, 0), 90, 180);
            case EffectType.HEAL:
                return this.config(0.35, 0.6, 18, 52, 50, 18, cc.color(90, 255, 120, 230), cc.color(90, 255, 120, 0), 90, 60);
            case EffectType.FIRE:
                return this.config(0.25, 0.5, 22, 88, 90, 22, cc.color(255, 110, 30, 240), cc.color(120, 0, 0, 0), 90, 160);
            case EffectType.WATER:
                return this.config(0.3, 0.55, 20, 70, 85, 18, cc.color(80, 190, 255, 220), cc.color(80, 190, 255, 0), 90, 130);
            case EffectType.GUN_MUZZLE:
                return this.config(0.08, 0.18, 10, 160, 130, 16, cc.color(255, 245, 160, 240), cc.color(255, 90, 20, 0), 0, 80);
            case EffectType.DAMAGE_SPARK:
                return this.config(0.12, 0.28, 12, 140, 125, 14, cc.color(255, 255, 255, 240), cc.color(255, 40, 40, 0), 0, 180);
            case EffectType.BOSS_TELEPORT:
                return this.config(0.28, 0.55, 26, 96, 135, 26, cc.color(150, 90, 255, 230), cc.color(40, 0, 120, 0), 90, 360);
            case EffectType.BOSS_SUMMON:
                return this.config(0.35, 0.65, 30, 92, 120, 22, cc.color(255, 70, 180, 230), cc.color(70, 0, 70, 0), 90, 360);
            case EffectType.JETPACK_FLAME:
                return this.config(0.08, 0.22, 12, 160, 115, 18, cc.color(255, 180, 40, 230), cc.color(255, 40, 0, 0), -90, 50);
            case EffectType.GRAPPLE_ATTACH:
                return this.config(0.15, 0.32, 14, 110, 100, 13, cc.color(120, 220, 255, 230), cc.color(60, 120, 255, 0), 90, 180);
            case EffectType.HIT:
            default:
                return this.config(0.18, 0.35, 16, 95, 110, 20, cc.color(255, 255, 255, 240), cc.color(255, 80, 80, 0), 0, 180);
        }
    }

    private config(
        duration: number,
        life: number,
        totalParticles: number,
        emissionRate: number,
        speed: number,
        startSize: number,
        startColor: cc.Color,
        endColor: cc.Color,
        angle: number,
        angleVar: number
    ) {
        return {
            duration,
            life,
            lifeVar: life * 0.35,
            totalParticles,
            emissionRate,
            speed,
            speedVar: speed * 0.45,
            startSize,
            startSizeVar: startSize * 0.4,
            endSize: 0,
            startColor,
            endColor,
            angle,
            angleVar
        };
    }

    private toLocalPosition(worldPosition: cc.Vec2): cc.Vec2 {
        if (!this.effectRoot) {
            return worldPosition;
        }
        return this.effectRoot.convertToNodeSpaceAR(worldPosition);
    }
}

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
    GRAPPLE_ATTACH = "grapple_attach",
    RUN_TRAIL = "run_trail",
    WATER_DRIP = "water_drip",
    EXP_BURST = "exp_burst"
}

@ccclass
export default class EffectsManager extends cc.Component {
    public static instance: EffectsManager = null;

    @property(cc.Node)
    public effectRoot: cc.Node = null;

    @property({
        type: cc.SpriteFrame,
        tooltip: "Single particle sprite. Used if Particle Atlas Sprite Frame is empty."
    })
    public particleSpriteFrame: cc.SpriteFrame = null;

    @property({
        type: cc.SpriteFrame,
        tooltip: "Full atlas image, for example a 1500x1500 3x3 spritesheet."
    })
    public particleAtlasSpriteFrame: cc.SpriteFrame = null;

    @property({
        type: cc.Integer,
        tooltip: "Atlas column count. 3 for a 3x3 image."
    })
    public atlasColumns: number = 3;

    @property({
        type: cc.Integer,
        tooltip: "Atlas row count. 3 for a 3x3 image."
    })
    public atlasRows: number = 3;

    @property({
        type: cc.Integer,
        tooltip: "Selected row. Top row is 0."
    })
    public atlasRow: number = 1;

    @property({
        type: cc.Integer,
        tooltip: "Selected column. Left column is 0."
    })
    public atlasColumn: number = 1;

    @property({
        type: cc.SpriteFrame,
        tooltip: "Water drip atlas image, for example a 3000x3000 3x3 spritesheet."
    })
    public waterDripAtlasSpriteFrame: cc.SpriteFrame = null;

    @property({
        type: cc.Integer,
        tooltip: "Water drip atlas column count."
    })
    public waterDripAtlasColumns: number = 3;

    @property({
        type: cc.Integer,
        tooltip: "Water drip atlas row count."
    })
    public waterDripAtlasRows: number = 3;

    @property({
        type: cc.Integer,
        tooltip: "Water drip selected row. Top row is 0."
    })
    public waterDripAtlasRow: number = 1;

    @property({
        type: cc.Integer,
        tooltip: "Water drip selected column. Left column is 0."
    })
    public waterDripAtlasColumn: number = 1;

    @property({
        type: cc.SpriteFrame,
        tooltip: "EXP burst atlas image, 3x3 spritesheet. All 9 frames will be played once."
    })
    public expBurstAtlasSpriteFrame: cc.SpriteFrame = null;

    @property({
        type: cc.Integer,
        tooltip: "EXP burst atlas column count."
    })
    public expBurstAtlasColumns: number = 3;

    @property({
        type: cc.Integer,
        tooltip: "EXP burst atlas row count."
    })
    public expBurstAtlasRows: number = 3;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    private cachedAtlasFrame: cc.SpriteFrame = null;
    private cachedAtlasKey: string = "";

    private cachedWaterDripFrame: cc.SpriteFrame = null;
    private cachedWaterDripKey: string = "";

    private cachedExpBurstFrames: cc.SpriteFrame[] = [];
    private cachedExpBurstKey: string = "";

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

    public static playExpBurst(worldPosition: cc.Vec2): void {
        if (EffectsManager.instance) {
            EffectsManager.instance.playExpBurstEffect(worldPosition);
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

    private playExpBurstEffect(worldPosition: cc.Vec2): void {
        if (!this.effectRoot || !cc.isValid(this.effectRoot)) {
            return;
        }

        const offsets = [
            cc.v2(-42, 18),
            cc.v2(34, 42),
            cc.v2(-12, 64),
            cc.v2(56, -6),
            cc.v2(-58, -18),
            cc.v2(18, -46),
            cc.v2(-30, 36),
            cc.v2(46, 22),
            cc.v2(2, 8)
        ];

        for (let i = 0; i < 9; i++) {
            this.scheduleOnce(() => {
                const jitterX = (Math.random() - 0.5) * 18;
                const jitterY = (Math.random() - 0.5) * 18;
                const spawnWorldPos = cc.v2(
                    worldPosition.x + offsets[i].x + jitterX,
                    worldPosition.y + offsets[i].y + jitterY
                );

                this.spawnExpBurstParticle(i, spawnWorldPos);
            }, i * 0.07);
        }

        if (this.debugLog) {
            cc.log(`[EffectsManager] EXP burst at (${worldPosition.x.toFixed(1)}, ${worldPosition.y.toFixed(1)})`);
        }
    }

    private spawnExpBurstParticle(frameIndex: number, worldPosition: cc.Vec2): void {
        const effectNode = new cc.Node(`Effect_exp_burst_${frameIndex}`);
        effectNode.parent = this.effectRoot;
        effectNode.setPosition(this.toLocalPosition(worldPosition));

        const particle = effectNode.addComponent(cc.ParticleSystem);
        this.configureParticle(particle, EffectType.EXP_BURST);

        const frame = this.getExpBurstAtlasSubFrame(frameIndex);
        if (frame) {
            const anyParticle = particle as any;
            anyParticle.spriteFrame = frame;
            anyParticle.texture = frame.getTexture();
        }

        particle.resetSystem();

        this.scheduleOnce(() => {
            if (cc.isValid(effectNode)) {
                effectNode.destroy();
            }
        }, 1.35);
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

        const selectedFrame = this.getSelectedParticleFrame(type);
        if (selectedFrame) {
            anyParticle.spriteFrame = selectedFrame;
            anyParticle.texture = selectedFrame.getTexture();
        }
    }

    private getSelectedParticleFrame(type: EffectType): cc.SpriteFrame {
        if (type === EffectType.WATER_DRIP && this.waterDripAtlasSpriteFrame) {
            return this.getWaterDripAtlasSubFrame();
        }

        if (this.particleAtlasSpriteFrame) {
            return this.getAtlasSubFrame();
        }

        return this.particleSpriteFrame;
    }

    private getAtlasSubFrame(): cc.SpriteFrame {
        const texture = this.particleAtlasSpriteFrame.getTexture();
        if (!texture) {
            return null;
        }

        const textureWidth = (texture as any).width || 0;
        const textureHeight = (texture as any).height || 0;

        if (textureWidth <= 0 || textureHeight <= 0) {
            return null;
        }

        const columns = Math.max(1, Math.floor(this.atlasColumns));
        const rows = Math.max(1, Math.floor(this.atlasRows));
        const safeColumn = Math.max(0, Math.min(columns - 1, Math.floor(this.atlasColumn)));
        const safeRow = Math.max(0, Math.min(rows - 1, Math.floor(this.atlasRow)));

        const cellWidth = Math.floor(textureWidth / columns);
        const cellHeight = Math.floor(textureHeight / rows);

        const x = safeColumn * cellWidth;
        const y = (rows - 1 - safeRow) * cellHeight;

        const key = `${textureWidth}x${textureHeight}_${columns}_${rows}_${safeRow}_${safeColumn}`;

        if (this.cachedAtlasFrame && this.cachedAtlasKey === key) {
            return this.cachedAtlasFrame;
        }

        const frame = new cc.SpriteFrame();
        const rect = cc.rect(x, y, cellWidth, cellHeight);
        const originalSize = cc.size(cellWidth, cellHeight);
        const offset = cc.v2(0, 0);

        (frame as any).setTexture(texture, rect, false, offset, originalSize);

        this.cachedAtlasFrame = frame;
        this.cachedAtlasKey = key;

        if (this.debugLog) {
            cc.log(`[EffectsManager] Atlas frame rect x=${x}, y=${y}, w=${cellWidth}, h=${cellHeight}`);
        }

        return frame;
    }

    private getWaterDripAtlasSubFrame(): cc.SpriteFrame {
        const texture = this.waterDripAtlasSpriteFrame.getTexture();
        if (!texture) {
            return null;
        }

        const textureWidth = (texture as any).width || 0;
        const textureHeight = (texture as any).height || 0;

        if (textureWidth <= 0 || textureHeight <= 0) {
            return null;
        }

        const columns = Math.max(1, Math.floor(this.waterDripAtlasColumns));
        const rows = Math.max(1, Math.floor(this.waterDripAtlasRows));
        const safeColumn = Math.max(0, Math.min(columns - 1, Math.floor(this.waterDripAtlasColumn)));
        const safeRow = Math.max(0, Math.min(rows - 1, Math.floor(this.waterDripAtlasRow)));

        const cellWidth = Math.floor(textureWidth / columns);
        const cellHeight = Math.floor(textureHeight / rows);

        const x = safeColumn * cellWidth;
        const y = (rows - 1 - safeRow) * cellHeight;

        const key = `${textureWidth}x${textureHeight}_${columns}_${rows}_${safeRow}_${safeColumn}`;

        if (this.cachedWaterDripFrame && this.cachedWaterDripKey === key) {
            return this.cachedWaterDripFrame;
        }

        const frame = new cc.SpriteFrame();
        const rect = cc.rect(x, y, cellWidth, cellHeight);
        const originalSize = cc.size(cellWidth, cellHeight);
        const offset = cc.v2(0, 0);

        (frame as any).setTexture(texture, rect, false, offset, originalSize);

        this.cachedWaterDripFrame = frame;
        this.cachedWaterDripKey = key;

        if (this.debugLog) {
            cc.log(`[EffectsManager] Water drip atlas frame rect x=${x}, y=${y}, w=${cellWidth}, h=${cellHeight}`);
        }

        return frame;
    }

    private getExpBurstAtlasSubFrame(frameIndex: number): cc.SpriteFrame {
        if (!this.expBurstAtlasSpriteFrame) {
            return null;
        }

        const texture = this.expBurstAtlasSpriteFrame.getTexture();
        if (!texture) {
            return null;
        }

        const textureWidth = (texture as any).width || 0;
        const textureHeight = (texture as any).height || 0;

        if (textureWidth <= 0 || textureHeight <= 0) {
            return null;
        }

        const columns = Math.max(1, Math.floor(this.expBurstAtlasColumns));
        const rows = Math.max(1, Math.floor(this.expBurstAtlasRows));
        const totalFrames = columns * rows;
        const safeIndex = Math.max(0, Math.min(totalFrames - 1, Math.floor(frameIndex)));

        const key = `${textureWidth}x${textureHeight}_${columns}_${rows}`;
        if (this.cachedExpBurstFrames[safeIndex] && this.cachedExpBurstKey === key) {
            return this.cachedExpBurstFrames[safeIndex];
        }

        if (this.cachedExpBurstKey !== key) {
            this.cachedExpBurstFrames = [];
            this.cachedExpBurstKey = key;
        }

        const cellWidth = Math.floor(textureWidth / columns);
        const cellHeight = Math.floor(textureHeight / rows);

        const rowFromTop = Math.floor(safeIndex / columns);
        const column = safeIndex % columns;

        const x = column * cellWidth;
        const y = (rows - 1 - rowFromTop) * cellHeight;

        const frame = new cc.SpriteFrame();
        const rect = cc.rect(x, y, cellWidth, cellHeight);
        const originalSize = cc.size(cellWidth, cellHeight);
        const offset = cc.v2(0, 0);

        (frame as any).setTexture(texture, rect, false, offset, originalSize);

        this.cachedExpBurstFrames[safeIndex] = frame;

        if (this.debugLog) {
            cc.log(`[EffectsManager] EXP frame ${safeIndex}, rect x=${x}, y=${y}, w=${cellWidth}, h=${cellHeight}`);
        }

        return frame;
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
            case EffectType.RUN_TRAIL:
                return this.config(0.08, 0.75, 8, 90, 28, 28, cc.color(210, 210, 210, 170), cc.color(210, 210, 210, 0), 90, 35);            case EffectType.HIT:
            case EffectType.WATER_DRIP:
                return this.config(0.12, 0.85, 10, 85, 45, 26, cc.color(120, 210, 255, 190), cc.color(120, 210, 255, 0), -90, 25);
            case EffectType.EXP_BURST:
                return this.config(0.16, 0.75, 6, 42, 36, 30, cc.color(255, 245, 120, 220), cc.color(255, 245, 120, 0), 90, 180);
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
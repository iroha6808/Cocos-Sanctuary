import EventCenter from "./EventCenter";
import { GameEvent } from "./Constants";
import CameraRig from "./CameraRig";

const { ccclass, property } = cc._decorator;

export interface CombatHitFeelPayload {
    attackerNode: cc.Node;
    targetNode: cc.Node;
    worldPosition: cc.Vec2;
    damage: number;
    knockbackX: number;
    knockbackY: number;
    sourceType: string;
}

@ccclass
export default class HitFeelManager extends cc.Component {
    public static instance: HitFeelManager = null;

    @property(cc.Float)
    public hitStopDuration: number = 0.045;

    @property(cc.Float)
    public hitStopTimeScale: number = 0.08;

    @property(cc.Float)
    public shakeDuration: number = 0.12;

    @property(cc.Float)
    public shakeAmplitude: number = 1.8;

    @property(cc.Float)
    public cameraImpulseStrength: number = 4;

    @property(cc.Float)
    public zoomKickAmount: number = 0.02;

    @property(cc.Float)
    public zoomKickDuration: number = 0.12;

    @property(cc.Float)
    public flashDuration: number = 0.08;

    private paused: boolean = false;
    private hitStopActive: boolean = false;
    private savedTimeScale: number = 1;
    private savedPhysicsEnabled: boolean = true;

    public static getOrCreate(hostNode?: cc.Node): HitFeelManager {
        if (HitFeelManager.instance && cc.isValid(HitFeelManager.instance.node)) {
            return HitFeelManager.instance;
        }

        const targetNode = hostNode || cc.director.getScene();
        if (!targetNode) {
            return null;
        }

        let manager = targetNode.getComponent(HitFeelManager);
        if (!manager) {
            manager = targetNode.addComponent(HitFeelManager);
        }
        return manager;
    }

    public isHitStopRunning(): boolean {
        return this.hitStopActive;
    }

    onLoad(): void {
        if (HitFeelManager.instance && HitFeelManager.instance !== this) {
            this.destroy();
            return;
        }

        HitFeelManager.instance = this;
        EventCenter.on(GameEvent.COMBAT_HIT_CONFIRMED, this.onCombatHitConfirmed, this);
        EventCenter.on(GameEvent.GAME_PAUSED, this.onGamePaused, this);
        EventCenter.on(GameEvent.GAME_RESUMED, this.onGameResumed, this);
    }

    onDestroy(): void {
        EventCenter.off(GameEvent.COMBAT_HIT_CONFIRMED, this.onCombatHitConfirmed, this);
        EventCenter.off(GameEvent.GAME_PAUSED, this.onGamePaused, this);
        EventCenter.off(GameEvent.GAME_RESUMED, this.onGameResumed, this);
        this.restoreHitStop();
        if (HitFeelManager.instance === this) {
            HitFeelManager.instance = null;
        }
    }

    private onCombatHitConfirmed(payload: CombatHitFeelPayload): void {
        if (!payload || !payload.targetNode || !cc.isValid(payload.targetNode)) {
            return;
        }

        this.playCameraFeedback(payload);
        this.flashTarget(payload.targetNode);

        if (!this.paused) {
            this.startHitStop();
        }
    }

    private playCameraFeedback(payload: CombatHitFeelPayload): void {
        const rig = CameraRig.getOrCreate();
        if (!rig) {
            return;
        }

        const direction = this.getRandomDirection();
        const projectileScale = payload.sourceType === "projectile" ? 0.75 : 1;
        rig.addShake(this.shakeDuration, this.shakeAmplitude * projectileScale);
        rig.addImpulse(direction, this.cameraImpulseStrength * projectileScale);
        rig.setZoomKick(this.zoomKickAmount * projectileScale, this.zoomKickDuration);
    }

    private getRandomDirection(): cc.Vec2 {
        const angle = Math.random() * Math.PI * 2;
        return cc.v2(Math.cos(angle), Math.sin(angle));
    }

    private startHitStop(): void {
        if (this.hitStopActive || this.hitStopDuration <= 0) {
            return;
        }

        const scheduler = cc.director.getScheduler();
        const physicsManager = cc.director.getPhysicsManager();
        this.hitStopActive = true;
        this.savedTimeScale = (scheduler as any).getTimeScale ? (scheduler as any).getTimeScale() : 1;
        this.savedPhysicsEnabled = physicsManager ? physicsManager.enabled : true;

        scheduler.setTimeScale(this.hitStopTimeScale);
        if (physicsManager) {
            physicsManager.enabled = false;
        }

        setTimeout(() => this.restoreHitStop(), this.hitStopDuration * 1000);
    }

    private restoreHitStop(): void {
        if (!this.hitStopActive) {
            return;
        }

        this.hitStopActive = false;
        if (!this.paused) {
            cc.director.getScheduler().setTimeScale(this.savedTimeScale || 1);
            const physicsManager = cc.director.getPhysicsManager();
            if (physicsManager) {
                physicsManager.enabled = this.savedPhysicsEnabled;
            }
        }
    }

    private flashTarget(targetNode: cc.Node): void {
        const sprites = targetNode.getComponentsInChildren(cc.Sprite);
        if (!sprites || sprites.length <= 0) {
            return;
        }

        const originalColors = sprites.map(sprite => cc.color(
            sprite.node.color.r,
            sprite.node.color.g,
            sprite.node.color.b,
            sprite.node.color.a
        ));

        for (const sprite of sprites) {
            sprite.node.color = cc.Color.WHITE;
        }

        setTimeout(() => {
            for (let index = 0; index < sprites.length; index++) {
                const sprite = sprites[index];
                if (sprite && sprite.node && cc.isValid(sprite.node)) {
                    sprite.node.color = originalColors[index];
                }
            }
        }, this.flashDuration * 1000);
    }

    private onGamePaused(): void {
        this.paused = true;
    }

    private onGameResumed(): void {
        this.paused = false;
    }

    private getNodeWorldPosition(node: cc.Node): cc.Vec2 {
        return node.parent
            ? node.parent.convertToWorldSpaceAR(node.position)
            : cc.v2(node.x, node.y);
    }
}

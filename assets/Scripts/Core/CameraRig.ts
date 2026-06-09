import EventCenter from "./EventCenter";
import { GameEvent } from "./Constants";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CameraRig extends cc.Component {
    public static instance: CameraRig = null;

    @property(cc.Node)
    public target: cc.Node = null;

    @property(cc.Float)
    public minFollowSpeed: number = 4;

    @property(cc.Float)
    public maxFollowSpeed: number = 54;

    @property(cc.Float)
    public distanceExponentScale: number = 2500;

    @property(cc.Float)
    public maxDistance: number = 120;

    @property(cc.Float)
    public lookAheadScale: number = 0.14;

    @property(cc.Float)
    public lookAheadMax: number = 70;

    private lastTargetPosition: cc.Vec2 = null;
    private shakeTime: number = 0;
    private shakeDuration: number = 0;
    private shakeAmplitude: number = 0;
    private impulse: cc.Vec2 = cc.v2(0, 0);
    private baseZoom: number = 1;
    private zoomKick: number = 0;
    private zoomKickTime: number = 0;
    private zoomKickDuration: number = 0;
    private paused: boolean = false;
    private camera: cc.Camera = null;

    public static getOrCreate(cameraNode?: cc.Node): CameraRig {
        if (CameraRig.instance && cc.isValid(CameraRig.instance.node)) {
            return CameraRig.instance;
        }

        const node = cameraNode || cc.find("Canvas/Main Camera") || cc.find("Main Camera");
        if (!node) {
            return null;
        }

        let rig = node.getComponent(CameraRig);
        if (!rig) {
            rig = node.addComponent(CameraRig);
        }
        return rig;
    }

    onLoad(): void {
        if (CameraRig.instance && CameraRig.instance !== this) {
            this.destroy();
            return;
        }

        CameraRig.instance = this;
        this.camera = this.getComponent(cc.Camera);
        this.baseZoom = this.camera ? this.camera.zoomRatio : 1;
        EventCenter.on(GameEvent.GAME_PAUSED, this.onGamePaused, this);
        EventCenter.on(GameEvent.GAME_RESUMED, this.onGameResumed, this);
        this.resolveTarget();
    }

    start(): void {
        this.resolveTarget();
        if (this.target) {
            this.lastTargetPosition = this.getTargetWorldPosition();
        }
    }

    lateUpdate(dt: number): void {
        if (this.paused) {
            return;
        }

        const targetWorld = this.resolveTarget() ? this.getTargetWorldPosition() : null;
        if (!targetWorld || dt <= 0) {
            return;
        }

        const targetVelocity = this.lastTargetPosition
            ? targetWorld.sub(this.lastTargetPosition).mul(1 / dt)
            : cc.v2(0, 0);
        this.lastTargetPosition = targetWorld.clone();

        const lookAhead = this.clampVector(targetVelocity.mul(this.lookAheadScale), this.lookAheadMax);
        const desiredWorld = targetWorld.add(lookAhead);
        const currentWorld = this.getNodeWorldPosition(this.node);
        const delta = desiredWorld.sub(currentWorld);
        const followAlpha = this.getDistanceFollowAlpha(delta.mag(), dt);

        let nextWorld = currentWorld.add(delta.mul(followAlpha)).add(this.consumeImpulse(dt));
        nextWorld = nextWorld.add(this.getShakeOffset(dt));

        this.setNodeWorldPosition(this.node, nextWorld);
        this.updateZoom(dt);
    }

    public addShake(duration: number, amplitude: number): void {
        this.shakeDuration = Math.max(this.shakeDuration, duration);
        this.shakeTime = Math.max(this.shakeTime, duration);
        this.shakeAmplitude = Math.max(this.shakeAmplitude, amplitude);
    }

    public addImpulse(direction: cc.Vec2, strength: number): void {
        if (!direction || strength <= 0) {
            return;
        }

        const normalized = direction.mag() > 0.001 ? direction.normalize() : cc.v2(0, 0);
        this.impulse = this.impulse.add(normalized.mul(strength));
    }

    public setZoomKick(amount: number, duration: number): void {
        this.zoomKick = Math.max(this.zoomKick, amount);
        this.zoomKickDuration = Math.max(0.01, duration);
        this.zoomKickTime = this.zoomKickDuration;
    }

    onDestroy(): void {
        EventCenter.off(GameEvent.GAME_PAUSED, this.onGamePaused, this);
        EventCenter.off(GameEvent.GAME_RESUMED, this.onGameResumed, this);
        if (this.camera) {
            this.camera.zoomRatio = this.baseZoom;
        }
        if (CameraRig.instance === this) {
            CameraRig.instance = null;
        }
    }

    private resolveTarget(): cc.Node {
        if (this.target && cc.isValid(this.target)) {
            return this.target;
        }

        this.target = cc.find("Canvas/Player");
        return this.target;
    }

    private getShakeOffset(dt: number): cc.Vec2 {
        if (this.shakeTime <= 0) {
            this.shakeAmplitude = 0;
            return cc.v2(0, 0);
        }

        this.shakeTime = Math.max(0, this.shakeTime - dt);
        const progress = this.shakeDuration > 0 ? this.shakeTime / this.shakeDuration : 0;
        const amplitude = this.shakeAmplitude * progress;
        return cc.v2(
            (Math.random() * 2 - 1) * amplitude,
            (Math.random() * 2 - 1) * amplitude
        );
    }

    private consumeImpulse(dt: number): cc.Vec2 {
        if (this.impulse.mag() <= 0.01) {
            this.impulse = cc.v2(0, 0);
            return cc.v2(0, 0);
        }

        const value = this.impulse.clone();
        this.impulse = this.impulse.mul(Math.max(0, 1 - dt * 14));
        return value;
    }

    private getDistanceFollowAlpha(distance: number, dt: number): number {
        if (distance <= 0 || dt <= 0) {
            return 0;
        }

        const curveDistance = this.maxDistance > 0 ? Math.min(distance, this.maxDistance) : distance;
        const safeScale = Math.max(1, this.distanceExponentScale);
        const distanceFactor = 1 - Math.exp(-curveDistance / safeScale);
        const followSpeed = this.minFollowSpeed + (this.maxFollowSpeed - this.minFollowSpeed) * distanceFactor;
        const alpha = 1 - Math.exp(-followSpeed * dt);
        return Math.min(1, Math.max(0, alpha));
    }

    private updateZoom(dt: number): void {
        if (!this.camera) {
            return;
        }

        if (this.zoomKickTime <= 0) {
            this.camera.zoomRatio += (this.baseZoom - this.camera.zoomRatio) * Math.min(1, dt * 12);
            this.zoomKick = 0;
            return;
        }

        this.zoomKickTime = Math.max(0, this.zoomKickTime - dt);
        const progress = this.zoomKickDuration > 0 ? this.zoomKickTime / this.zoomKickDuration : 0;
        this.camera.zoomRatio = this.baseZoom + this.zoomKick * progress;
    }

    private onGamePaused(): void {
        this.paused = true;
    }

    private onGameResumed(): void {
        this.paused = false;
        this.lastTargetPosition = this.target && cc.isValid(this.target)
            ? this.getTargetWorldPosition()
            : null;
    }

    private getTargetWorldPosition(): cc.Vec2 {
        return this.getNodeWorldPosition(this.target);
    }

    private getNodeWorldPosition(node: cc.Node): cc.Vec2 {
        return node.parent
            ? node.parent.convertToWorldSpaceAR(node.position)
            : cc.v2(node.x, node.y);
    }

    private setNodeWorldPosition(node: cc.Node, worldPosition: cc.Vec2): void {
        if (node.parent) {
            node.setPosition(node.parent.convertToNodeSpaceAR(worldPosition));
        } else {
            node.setPosition(worldPosition);
        }
    }

    private clampVector(value: cc.Vec2, maxLength: number): cc.Vec2 {
        if (!value || maxLength <= 0) {
            return cc.v2(0, 0);
        }

        const length = value.mag();
        if (length <= maxLength) {
            return value;
        }
        return value.mul(maxLength / length);
    }
}

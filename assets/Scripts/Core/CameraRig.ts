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
    public distanceSpeedK: number = 0.18;

    @property(cc.Float)
    public distanceResponseScale: number = 300;

    @property(cc.Float)
    public lookAheadScale: number = 0.14;

    @property(cc.Float)
    public lookAheadMax: number = 70;

    @property(cc.Float)
    public minZoomRatio: number = 0.55;

    @property(cc.Float)
    public maxZoomRatio: number = 1.8;

    @property(cc.Float)
    public zoomStep: number = 0.1;

    @property(cc.Float)
    public overviewPadding: number = 220;

    @property(cc.Float)
    public overviewMinZoomRatio: number = 0.08;

    @property([cc.Node])
    public zoomScaledNodes: cc.Node[] = [];

    @property([cc.Node])
    public inverseZoomScaledNodes: cc.Node[] = [];

    @property([cc.Node])
    public screenFixedZoomScaledNodes: cc.Node[] = [];

    @property(cc.Float)
    public minZoomNodeScale: number = 0.1;

    @property(cc.Float)
    public maxZoomNodeScale: number = 5;

    @property(cc.Float)
    public maxInverseZoomNodeScale: number = 16;

    @property(cc.Float)
    public overviewInverseZoomScaleBoost: number = 1.25;

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
    private targetWarningShown: boolean = false;
    private overviewActive: boolean = false;
    private overviewReturning: boolean = false;
    private overviewStartWorld: cc.Vec2 = cc.v2(0, 0);
    private overviewTargetWorld: cc.Vec2 = cc.v2(0, 0);
    private overviewStartZoom: number = 1;
    private overviewTargetZoom: number = 1;
    private overviewTime: number = 0;
    private overviewDuration: number = 0;
    private zoomScaleReference: number = 1;
    private zoomScaledBaseScales: cc.Vec2[] = [];
    private inverseZoomScaledBaseScales: cc.Vec2[] = [];
    private screenFixedZoomScaledBaseScales: cc.Vec2[] = [];
    private screenFixedZoomScaledBasePositions: cc.Vec2[] = [];

    public static getOrCreate(cameraNode?: cc.Node): CameraRig {
        if (CameraRig.instance && cc.isValid(CameraRig.instance.node)) {
            return CameraRig.instance;
        }

        const node = cameraNode;
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
        this.zoomScaleReference = Math.max(0.01, this.baseZoom);
        EventCenter.on(GameEvent.GAME_PAUSED, this.onGamePaused, this);
        EventCenter.on(GameEvent.GAME_RESUMED, this.onGameResumed, this);
    }

    start(): void {
        if (this.target) {
            this.lastTargetPosition = this.getTargetWorldPosition();
        }
        this.captureZoomScaleBaselines();
        this.applyZoomScaleToNodes();
    }

    lateUpdate(dt: number): void {
        if (this.paused) {
            return;
        }

        if (this.overviewActive) {
            this.updateOverview(dt);
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
        this.applyZoomScaleToNodes();
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

    public adjustBaseZoom(direction: number): void {
        if (!this.camera || direction === 0) {
            return;
        }

        const minZoom = Math.max(0.1, Math.min(this.minZoomRatio, this.maxZoomRatio));
        const maxZoom = Math.max(minZoom, this.maxZoomRatio);
        this.baseZoom = this.clamp(this.baseZoom + this.zoomStep * direction, minZoom, maxZoom);
        if (this.zoomKickTime <= 0 && !this.overviewActive) {
            this.camera.zoomRatio = this.baseZoom;
            this.applyZoomScaleToNodes();
        }
    }

    public frameWorldRect(minX: number, minY: number, maxX: number, maxY: number, duration: number = 0.45): void {
        if (!this.camera) {
            this.camera = this.getComponent(cc.Camera);
        }
        if (!this.camera) {
            return;
        }

        const safeMinX = Math.min(minX, maxX);
        const safeMaxX = Math.max(minX, maxX);
        const safeMinY = Math.min(minY, maxY);
        const safeMaxY = Math.max(minY, maxY);
        const center = cc.v2((safeMinX + safeMaxX) * 0.5, (safeMinY + safeMaxY) * 0.5);
        const width = Math.max(1, safeMaxX - safeMinX + this.overviewPadding * 2);
        const height = Math.max(1, safeMaxY - safeMinY + this.overviewPadding * 2);
        const visibleSize = cc.winSize || cc.size(960, 640);
        const zoomX = visibleSize.width / width;
        const zoomY = visibleSize.height / height;
        const targetZoom = Math.max(this.overviewMinZoomRatio, Math.min(zoomX, zoomY));

        this.beginOverviewMove(center, targetZoom, duration, false);
    }

    public returnToTarget(duration: number = 0.45): void {
        if (!this.camera) {
            this.camera = this.getComponent(cc.Camera);
        }
        const targetWorld = this.target && cc.isValid(this.target)
            ? this.getTargetWorldPosition()
            : this.getNodeWorldPosition(this.node);
        this.beginOverviewMove(targetWorld, this.baseZoom, duration, true);
    }

    onDestroy(): void {
        EventCenter.off(GameEvent.GAME_PAUSED, this.onGamePaused, this);
        EventCenter.off(GameEvent.GAME_RESUMED, this.onGameResumed, this);
        if (this.camera) {
            this.camera.zoomRatio = this.baseZoom;
            this.applyZoomScaleToNodes();
        }
        if (CameraRig.instance === this) {
            CameraRig.instance = null;
        }
    }

    private resolveTarget(): cc.Node {
        if (this.target && cc.isValid(this.target)) {
            return this.target;
        }

        if (!this.targetWarningShown) {
            cc.warn("[CameraRig] target is not assigned. Drag Player to CameraRig.target or GameManager.playerNode.");
            this.targetWarningShown = true;
        }
        return null;
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

        const safeResponseScale = Math.max(1, this.distanceResponseScale);
        const distanceResponse = 1 - Math.exp(-distance / safeResponseScale);
        const minSpeed = Math.max(0, Math.min(this.minFollowSpeed, this.maxFollowSpeed));
        const maxSpeed = Math.max(minSpeed, this.maxFollowSpeed);
        const followSpeed = this.clamp(
            distance * Math.max(0, this.distanceSpeedK) * distanceResponse,
            minSpeed,
            maxSpeed
        );
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
            this.applyZoomScaleToNodes();
            return;
        }

        this.zoomKickTime = Math.max(0, this.zoomKickTime - dt);
        const progress = this.zoomKickDuration > 0 ? this.zoomKickTime / this.zoomKickDuration : 0;
        this.camera.zoomRatio = this.baseZoom + this.zoomKick * progress;
        this.applyZoomScaleToNodes();
    }

    private beginOverviewMove(targetWorld: cc.Vec2, targetZoom: number, duration: number, returning: boolean): void {
        if (!this.camera) {
            return;
        }

        this.overviewActive = true;
        this.overviewReturning = returning;
        this.overviewStartWorld = this.getNodeWorldPosition(this.node);
        this.overviewTargetWorld = targetWorld.clone();
        this.overviewStartZoom = this.camera.zoomRatio;
        this.overviewTargetZoom = Math.max(0.01, targetZoom);
        this.overviewDuration = Math.max(0.01, duration);
        this.overviewTime = 0;
        this.shakeTime = 0;
        this.impulse = cc.v2(0, 0);
    }

    private updateOverview(dt: number): void {
        if (!this.camera) {
            this.overviewActive = false;
            return;
        }

        this.overviewTime = Math.min(this.overviewDuration, this.overviewTime + Math.max(0, dt));
        const rawT = this.overviewDuration > 0 ? this.overviewTime / this.overviewDuration : 1;
        const t = this.smoothStep(rawT);
        const nextWorld = this.lerpVec2(this.overviewStartWorld, this.overviewTargetWorld, t)
            .add(this.getShakeOffset(dt));
        this.setNodeWorldPosition(this.node, nextWorld);
        this.camera.zoomRatio = this.lerp(this.overviewStartZoom, this.overviewTargetZoom, t);
        this.applyZoomScaleToNodes();

        if (rawT >= 1 && this.overviewReturning) {
            this.overviewActive = false;
            this.overviewReturning = false;
            this.camera.zoomRatio = this.baseZoom;
            this.applyZoomScaleToNodes();
            this.lastTargetPosition = this.target && cc.isValid(this.target)
                ? this.getTargetWorldPosition()
                : null;
        }
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

    private clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    private lerp(a: number, b: number, t: number): number {
        return a + (b - a) * this.clamp(t, 0, 1);
    }

    private lerpVec2(a: cc.Vec2, b: cc.Vec2, t: number): cc.Vec2 {
        const safeT = this.clamp(t, 0, 1);
        return cc.v2(
            this.lerp(a.x, b.x, safeT),
            this.lerp(a.y, b.y, safeT)
        );
    }

    private smoothStep(t: number): number {
        const value = this.clamp(t, 0, 1);
        return value * value * (3 - 2 * value);
    }

    private captureZoomScaleBaselines(): void {
        this.zoomScaledBaseScales = this.captureNodeScales(this.zoomScaledNodes);
        this.inverseZoomScaledBaseScales = this.captureNodeScales(this.inverseZoomScaledNodes);
        this.screenFixedZoomScaledBaseScales = this.captureNodeScales(this.screenFixedZoomScaledNodes);
        this.screenFixedZoomScaledBasePositions = this.captureNodeLocalPositions(this.screenFixedZoomScaledNodes);
    }

    private captureNodeScales(nodes: cc.Node[]): cc.Vec2[] {
        const scales: cc.Vec2[] = [];
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            scales.push(node && cc.isValid(node) ? cc.v2(node.scaleX, node.scaleY) : cc.v2(1, 1));
        }
        return scales;
    }

    private applyZoomScaleToNodes(): void {
        if (!this.camera) {
            return;
        }

        const safeZoom = Math.max(0.01, this.camera.zoomRatio || 1);
        const directFactor = this.clamp(safeZoom / this.zoomScaleReference, this.minZoomNodeScale, this.maxZoomNodeScale);
        const inverseMaxScale = Math.max(this.maxZoomNodeScale, this.maxInverseZoomNodeScale);
        const overviewBoost = this.overviewActive ? Math.max(1, this.overviewInverseZoomScaleBoost) : 1;
        const inverseFactor = this.clamp(
            (this.zoomScaleReference / safeZoom) * overviewBoost,
            this.minZoomNodeScale,
            inverseMaxScale
        );
        this.applyScaleList(this.zoomScaledNodes, this.zoomScaledBaseScales, directFactor);
        this.applyScaleList(this.inverseZoomScaledNodes, this.inverseZoomScaledBaseScales, inverseFactor);
        this.applyScreenFixedScaleList(this.screenFixedZoomScaledNodes, this.screenFixedZoomScaledBaseScales, this.screenFixedZoomScaledBasePositions, directFactor);
    }

    private applyScaleList(nodes: cc.Node[], baseScales: cc.Vec2[], factor: number): void {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (!node || !cc.isValid(node)) {
                continue;
            }
            if (!baseScales[i]) {
                baseScales[i] = cc.v2(node.scaleX, node.scaleY);
            }
            node.scaleX = baseScales[i].x * factor;
            node.scaleY = baseScales[i].y * factor;
        }
    }

    private captureNodeLocalPositions(nodes: cc.Node[]): cc.Vec2[] {
        const positions: cc.Vec2[] = [];
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            positions.push(node && cc.isValid(node) ? cc.v2(node.x, node.y) : cc.v2(0, 0));
        }
        return positions;
    }

    private applyScreenFixedScaleList(nodes: cc.Node[], baseScales: cc.Vec2[], basePositions: cc.Vec2[], factor: number): void {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (!node || !cc.isValid(node)) {
                continue;
            }
            if (!baseScales[i]) {
                baseScales[i] = cc.v2(node.scaleX, node.scaleY);
            }
            if (!basePositions[i]) {
                basePositions[i] = cc.v2(node.x, node.y);
            }
            node.scaleX = baseScales[i].x * factor;
            node.scaleY = baseScales[i].y * factor;
            node.setPosition(basePositions[i]);
        }
    }
}

import EventCenter from "../Core/EventCenter";
import { GameEvent } from "../Core/Constants";
import EffectsManager, { EffectType } from "../Core/EffectsManager";
import GameManager from "../Core/GameManager";
import PlayerGun from "./PlayerGun";
import { PlayerToolMode, getPlayerToolModeName } from "./PlayerToolMode";

const { ccclass, property } = cc._decorator;

const KEY_1 = 49;
const KEY_2 = 50;
const KEY_3 = 51;

@ccclass
export default class PlayerToolController extends cc.Component {
    @property({ type: cc.Enum(PlayerToolMode) })
    public currentMode: PlayerToolMode = PlayerToolMode.Gun;

    @property(PlayerGun)
    public playerGun: PlayerGun = null;

    @property(cc.Label)
    public toolLabel: cc.Label = null;

    @property(cc.ProgressBar)
    public jetpackFuelBar: cc.ProgressBar = null;

    @property(cc.Node)
    public jetpackFlameRoot: cc.Node = null;

    @property(cc.Node)
    public grappleLineRoot: cc.Node = null;

    @property(cc.Float)
    public maxFuel: number = 1;

    @property(cc.Float)
    public fuelConsumePerSecond: number = 0.45;

    @property(cc.Float)
    public fuelRecoverPerSecond: number = 0.28;

    @property(cc.Float)
    public jetpackForce: number = 840;

    @property(cc.Float)
    public maxUpwardSpeed: number = 520;

    @property(cc.Float)
    public grappleMaxDistance: number = 760;

    @property(cc.Float)
    public grapplePullAcceleration: number = 1400;

    @property(cc.Float)
    public grappleMaxSpeed: number = 760;

    @property(cc.Float)
    public grappleDetachDistance: number = 860;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    private rb: cc.RigidBody = null;
    private fuel: number = 1;
    private spaceDown: boolean = false;
    private rightMouseDown: boolean = false;
    private grappleAttached: boolean = false;
    private grapplePoint: cc.Vec2 = null;
    private browserMouseDownHandler: any = null;
    private browserMouseUpHandler: any = null;
    private canvasNode: cc.Node = null;
    private grappleGraphics: cc.Graphics = null;

    onLoad(): void {
        this.rb = this.getComponent(cc.RigidBody);
        if (!this.playerGun) {
            this.playerGun = this.getComponent(PlayerGun);
        }
        if (this.playerGun) {
            this.playerGun.setDirectRightMouseInput(false);
        }
        this.fuel = this.maxFuel;
        this.bindInput();
        this.refreshToolUi();
        this.emitFuelChanged();
    }

    update(dt: number): void {
        if (this.isBlocked()) {
            this.stopGrapple(false);
            this.setJetpackFlame(false);
            return;
        }

        this.updateJetpack(dt);
        this.updateGrapple(dt);
        this.recoverFuel(dt);
        this.updateGrappleLine();
    }

    onDestroy(): void {
        this.unbindInput();
        this.stopGrapple(false);
    }

    public setMode(mode: PlayerToolMode): void {
        if (this.currentMode === mode) {
            return;
        }

        this.stopGrapple(true);
        this.currentMode = mode;
        this.refreshToolUi();
        EventCenter.emit(GameEvent.PLAYER_TOOL_CHANGED, mode, getPlayerToolModeName(mode));
        if (this.debugLog) {
            cc.log(`[PlayerToolController] mode=${getPlayerToolModeName(mode)}`);
        }
    }

    private bindInput(): void {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        const gameCanvas = (cc.game as any).canvas;
        if (gameCanvas && gameCanvas.addEventListener) {
            this.browserMouseDownHandler = (event: any) => {
                if (event.button === 2) {
                    this.rightMouseDown = true;
                    this.handleRightMouseDown(this.getMouseWorldPosition(event));
                    if (event.preventDefault) {
                        event.preventDefault();
                    }
                }
            };
            this.browserMouseUpHandler = (event: any) => {
                if (event.button === 2) {
                    this.rightMouseDown = false;
                    this.handleRightMouseUp();
                    if (event.preventDefault) {
                        event.preventDefault();
                    }
                }
            };
            gameCanvas.addEventListener("mousedown", this.browserMouseDownHandler, false);
            gameCanvas.addEventListener("mouseup", this.browserMouseUpHandler, false);
            gameCanvas.addEventListener("contextmenu", this.preventContextMenu, false);
            return;
        }

        this.canvasNode = cc.find("Canvas");
        if (this.canvasNode) {
            this.canvasNode.on(cc.Node.EventType.MOUSE_DOWN, this.onNodeMouseDown, this);
            this.canvasNode.on(cc.Node.EventType.MOUSE_UP, this.onNodeMouseUp, this);
        }
    }

    private unbindInput(): void {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        const gameCanvas = (cc.game as any).canvas;
        if (gameCanvas) {
            if (this.browserMouseDownHandler) {
                gameCanvas.removeEventListener("mousedown", this.browserMouseDownHandler, false);
            }
            if (this.browserMouseUpHandler) {
                gameCanvas.removeEventListener("mouseup", this.browserMouseUpHandler, false);
            }
            gameCanvas.removeEventListener("contextmenu", this.preventContextMenu, false);
        }

        if (this.canvasNode && cc.isValid(this.canvasNode)) {
            this.canvasNode.off(cc.Node.EventType.MOUSE_DOWN, this.onNodeMouseDown, this);
            this.canvasNode.off(cc.Node.EventType.MOUSE_UP, this.onNodeMouseUp, this);
        }
    }

    private onKeyDown(event: cc.Event.EventKeyboard): void {
        if (this.isBlocked()) {
            return;
        }

        switch (event.keyCode) {
            case cc.macro.KEY.num1:
            case KEY_1:
                this.setMode(PlayerToolMode.Gun);
                return;
            case cc.macro.KEY.num2:
            case KEY_2:
                this.setMode(PlayerToolMode.Jetpack);
                return;
            case cc.macro.KEY.num3:
            case KEY_3:
                this.setMode(PlayerToolMode.Grapple);
                return;
            case cc.macro.KEY.space:
                this.spaceDown = true;
                return;
        }
    }

    private onKeyUp(event: cc.Event.EventKeyboard): void {
        if (event.keyCode === cc.macro.KEY.space) {
            this.spaceDown = false;
            this.setJetpackFlame(false);
        }
    }

    private onNodeMouseDown(event: cc.Event.EventMouse): void {
        if (event.getButton() !== cc.Event.EventMouse.BUTTON_RIGHT) {
            return;
        }
        this.rightMouseDown = true;
        this.handleRightMouseDown(this.screenToWorld(event.getLocation()));
    }

    private onNodeMouseUp(event: cc.Event.EventMouse): void {
        if (event.getButton() !== cc.Event.EventMouse.BUTTON_RIGHT) {
            return;
        }
        this.rightMouseDown = false;
        this.handleRightMouseUp();
    }

    private handleRightMouseDown(targetWorld: cc.Vec2): void {
        if (this.isBlocked()) {
            return;
        }

        if (this.currentMode === PlayerToolMode.Gun && this.playerGun) {
            this.playerGun.fireAtWorldPosition(targetWorld);
            return;
        }

        if (this.currentMode === PlayerToolMode.Grapple) {
            this.tryAttachGrapple(targetWorld);
        }
    }

    private handleRightMouseUp(): void {
        if (this.currentMode === PlayerToolMode.Grapple) {
            this.stopGrapple(true);
        }
    }

    private updateJetpack(dt: number): void {
        const active = this.currentMode === PlayerToolMode.Jetpack
            && this.spaceDown
            && this.fuel > 0
            && !!this.rb;

        if (!active) {
            this.setJetpackFlame(false);
            return;
        }

        const velocity = this.rb.linearVelocity || cc.v2(0, 0);
        const nextY = Math.min(this.maxUpwardSpeed, velocity.y + this.jetpackForce * dt);
        this.rb.linearVelocity = cc.v2(velocity.x, nextY);
        this.rb.awake = true;
        this.fuel = Math.max(0, this.fuel - this.fuelConsumePerSecond * dt);
        this.setJetpackFlame(true);
        this.emitFuelChanged();

        if (Math.random() < 0.35) {
            EffectsManager.play(EffectType.JETPACK_FLAME, this.getNodeWorldPosition(this.node).add(cc.v2(0, -28)));
        }
    }

    private recoverFuel(dt: number): void {
        if (this.currentMode === PlayerToolMode.Jetpack && this.spaceDown && this.fuel > 0) {
            return;
        }

        const before = this.fuel;
        this.fuel = Math.min(this.maxFuel, this.fuel + this.fuelRecoverPerSecond * dt);
        if (Math.abs(before - this.fuel) > 0.001) {
            this.emitFuelChanged();
        }
    }

    private tryAttachGrapple(targetWorld: cc.Vec2): void {
        const start = this.getNodeWorldPosition(this.node);
        const delta = targetWorld.sub(start);
        if (delta.magSqr() <= 4) {
            return;
        }

        const end = start.add(delta.normalize().mul(this.grappleMaxDistance));
        const results = cc.director.getPhysicsManager().rayCast(start, end, cc.RayCastType.All);
        for (const result of results) {
            const collider = result.collider;
            if (!collider || collider.sensor || !collider.node || collider.node === this.node || collider.node.isChildOf(this.node)) {
                continue;
            }

            this.grapplePoint = result.point.clone();
            this.grappleAttached = true;
            EffectsManager.play(EffectType.GRAPPLE_ATTACH, this.grapplePoint);
            EventCenter.emit(GameEvent.GRAPPLE_ATTACHED, this.node, this.grapplePoint);
            this.ensureGrappleGraphics();
            return;
        }
    }

    private updateGrapple(dt: number): void {
        if (!this.grappleAttached || !this.rb || !this.grapplePoint) {
            return;
        }

        if (!this.rightMouseDown || this.currentMode !== PlayerToolMode.Grapple) {
            this.stopGrapple(true);
            return;
        }

        const selfWorld = this.getNodeWorldPosition(this.node);
        const delta = this.grapplePoint.sub(selfWorld);
        const distance = delta.mag();
        if (distance > this.grappleDetachDistance || distance <= 12) {
            this.stopGrapple(true);
            return;
        }

        const direction = delta.normalize();
        let velocity = this.rb.linearVelocity.add(direction.mul(this.grapplePullAcceleration * dt));
        if (velocity.mag() > this.grappleMaxSpeed) {
            velocity = velocity.normalize().mul(this.grappleMaxSpeed);
        }
        this.rb.linearVelocity = velocity;
        this.rb.awake = true;
    }

    private stopGrapple(emit: boolean): void {
        if (!this.grappleAttached) {
            this.clearGrappleLine();
            return;
        }

        this.grappleAttached = false;
        this.grapplePoint = null;
        this.clearGrappleLine();
        if (emit) {
            EventCenter.emit(GameEvent.GRAPPLE_DETACHED, this.node);
        }
    }

    private isBlocked(): boolean {
        if (GameManager.instance && GameManager.instance.isGamePaused()) {
            return true;
        }

        const player = this.getComponent("PlayerController") as any;
        return !!(player && typeof player.canUseGameplayAction === "function" && !player.canUseGameplayAction());
    }

    private refreshToolUi(): void {
        if (this.toolLabel) {
            this.toolLabel.string = `Tool: ${getPlayerToolModeName(this.currentMode)}`;
        }
        if (this.jetpackFuelBar) {
            this.jetpackFuelBar.progress = this.maxFuel > 0 ? this.fuel / this.maxFuel : 0;
        }
    }

    private emitFuelChanged(): void {
        if (this.jetpackFuelBar) {
            this.jetpackFuelBar.progress = this.maxFuel > 0 ? this.fuel / this.maxFuel : 0;
        }
        EventCenter.emit(GameEvent.JETPACK_FUEL_CHANGED, this.fuel, this.maxFuel);
    }

    private setJetpackFlame(active: boolean): void {
        if (this.jetpackFlameRoot && cc.isValid(this.jetpackFlameRoot)) {
            this.jetpackFlameRoot.active = active;
        }
    }

    private ensureGrappleGraphics(): void {
        if (!this.grappleLineRoot || !cc.isValid(this.grappleLineRoot)) {
            return;
        }

        this.grappleGraphics = this.grappleLineRoot.getComponent(cc.Graphics);
        if (!this.grappleGraphics) {
            this.grappleGraphics = this.grappleLineRoot.addComponent(cc.Graphics);
        }
    }

    private updateGrappleLine(): void {
        if (!this.grappleGraphics) {
            return;
        }

        this.grappleGraphics.clear();
        if (!this.grappleAttached || !this.grapplePoint) {
            return;
        }

        const selfLocal = this.grappleLineRoot.convertToNodeSpaceAR(this.getNodeWorldPosition(this.node));
        const targetLocal = this.grappleLineRoot.convertToNodeSpaceAR(this.grapplePoint);
        this.grappleGraphics.lineWidth = 3;
        this.grappleGraphics.strokeColor = cc.color(100, 210, 255, 220);
        this.grappleGraphics.moveTo(selfLocal.x, selfLocal.y);
        this.grappleGraphics.lineTo(targetLocal.x, targetLocal.y);
        this.grappleGraphics.stroke();
    }

    private clearGrappleLine(): void {
        if (this.grappleGraphics) {
            this.grappleGraphics.clear();
        }
    }

    private preventContextMenu = (event: any): void => {
        if (event && event.preventDefault) {
            event.preventDefault();
        }
    };

    private getMouseWorldPosition(event: any): cc.Vec2 {
        const canvas = (cc.game as any).canvas;
        const rect = canvas && canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
        const uiLocation = cc.v2();
        cc.view.convertToLocationInView(event.clientX, event.clientY, rect, uiLocation);
        return this.screenToWorld(uiLocation);
    }

    private screenToWorld(screenPosition: cc.Vec2): cc.Vec2 {
        const camera = cc.Camera.main;
        if (camera) {
            return camera.getScreenToWorldPoint(screenPosition);
        }
        return screenPosition;
    }

    private getNodeWorldPosition(node: cc.Node): cc.Vec2 {
        return node.parent
            ? node.parent.convertToWorldSpaceAR(node.position)
            : cc.v2(node.x, node.y);
    }
}

import EventCenter from "../Core/EventCenter";
import { GameEvent } from "../Core/Constants";
import InputManager from "../Input/InputManager";
import { InputAction, InputPayload } from "../Input/InputAction";
import { InputContext } from "../Input/InputContext";
import VehicleInteractable from "./VehicleInteractable";

const { ccclass, property } = cc._decorator;

@ccclass
export default class VehicleController extends cc.Component {
    @property(VehicleInteractable)
    public interactable: VehicleInteractable = null;

    @property(cc.Node)
    public seatNode: cc.Node = null;

    @property(cc.Float)
    public exitOffsetX: number = 80;

    @property(cc.Float)
    public exitOffsetY: number = 0;

    @property(cc.Boolean)
    public hidePlayerWhileMounted: boolean = true;

    @property(cc.Boolean)
    public disablePlayerCollidersWhileMounted: boolean = true;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    protected rb: cc.RigidBody = null;
    protected moveX: number = 0;
    protected moveY: number = 0;
    protected jumpHeld: boolean = false;

    private leftDown: boolean = false;
    private rightDown: boolean = false;
    private upDown: boolean = false;
    private downDown: boolean = false;
    private driverNode: cc.Node = null;
    private driverController: any = null;
    private driverBody: cc.RigidBody = null;
    private driverOpacity: number = 255;
    private driverGravityScale: number = 1;
    private disabledColliders: cc.PhysicsCollider[] = [];
    private disabledColliderStates: boolean[] = [];
    private inputManager: InputManager = null;

    onLoad(): void {
        this.rb = this.getComponent(cc.RigidBody);
        if (!this.interactable) {
            this.interactable = this.getComponent(VehicleInteractable);
        }
        if (!this.seatNode) {
            this.seatNode = this.node;
        }
    }

    update(_dt: number): void {
        this.syncDriverToSeat();
    }

    lateUpdate(): void {
        this.syncDriverToSeat();
    }

    onDestroy(): void {
        this.dismount();
    }

    public tryMount(playerNode: cc.Node): boolean {
        if (this.driverNode || !playerNode || !cc.isValid(playerNode)) {
            return false;
        }

        if (this.interactable && !this.interactable.canInteract(playerNode)) {
            return false;
        }

        this.driverNode = playerNode;
        this.driverController = playerNode.getComponent("PlayerController") as any;
        this.driverBody = playerNode.getComponent(cc.RigidBody);
        this.driverOpacity = playerNode.opacity;

        if (this.driverController && typeof this.driverController.setExternalControlLocked === "function") {
            this.driverController.setExternalControlLocked(true, "vehicle");
        }

        if (this.driverBody) {
            this.driverGravityScale = (this.driverBody as any).gravityScale || 1;
            this.driverBody.linearVelocity = cc.v2(0, 0);
            (this.driverBody as any).gravityScale = 0;
            this.driverBody.awake = true;
        }

        if (this.hidePlayerWhileMounted) {
            this.driverNode.opacity = 0;
        }

        this.setPlayerCollidersEnabled(false);
        this.pushVehicleContext();
        this.syncDriverToSeat();
        EventCenter.emit(GameEvent.VEHICLE_ENTERED, this.node, playerNode);
        this.log("mounted");
        return true;
    }

    public dismount(): void {
        if (!this.driverNode || !cc.isValid(this.driverNode)) {
            this.clearMountState();
            return;
        }

        const driver = this.driverNode;
        this.moveX = 0;
        this.moveY = 0;
        this.jumpHeld = false;
        this.leftDown = false;
        this.rightDown = false;
        this.upDown = false;
        this.downDown = false;

        this.popVehicleContext();
        this.placeDriverAtExit();

        if (this.driverController && typeof this.driverController.setExternalControlLocked === "function") {
            this.driverController.setExternalControlLocked(false, "vehicle");
        }

        if (this.driverBody) {
            (this.driverBody as any).gravityScale = this.driverGravityScale;
            this.driverBody.linearVelocity = cc.v2(0, 0);
            this.driverBody.awake = true;
        }

        driver.opacity = this.driverOpacity;
        this.restorePlayerColliders();
        EventCenter.emit(GameEvent.VEHICLE_EXITED, this.node, driver);
        this.log("dismounted");
        this.clearMountState();
    }

    public isMounted(): boolean {
        return !!(this.driverNode && cc.isValid(this.driverNode));
    }

    protected getMoveX(): number {
        return Math.max(-1, Math.min(1, this.moveX));
    }

    protected getMoveY(): number {
        return Math.max(-1, Math.min(1, this.moveY));
    }

    protected isJumpHeld(): boolean {
        return this.jumpHeld;
    }

    protected syncDriverToSeat(): void {
        if (!this.driverNode || !cc.isValid(this.driverNode) || !this.seatNode || !cc.isValid(this.seatNode)) {
            return;
        }

        const seatWorld = this.seatNode.parent
            ? this.seatNode.parent.convertToWorldSpaceAR(this.seatNode.position)
            : cc.v2(this.seatNode.x, this.seatNode.y);
        const driverLocal = this.driverNode.parent
            ? this.driverNode.parent.convertToNodeSpaceAR(seatWorld)
            : seatWorld;
        this.driverNode.setPosition(driverLocal);

        if (this.driverBody) {
            this.driverBody.linearVelocity = cc.v2(0, 0);
        }
    }

    private pushVehicleContext(): void {
        this.inputManager = InputManager.getOrCreate(this.node);
        if (this.inputManager) {
            this.inputManager.pushContext(InputContext.Vehicle, this.handleVehicleInput, this);
        }
    }

    private popVehicleContext(): void {
        if (this.inputManager) {
            this.inputManager.popContext(InputContext.Vehicle, this);
        }
        this.inputManager = null;
    }

    private handleVehicleInput(payload: InputPayload): boolean {
        switch (payload.action) {
            case InputAction.MoveLeft:
                this.leftDown = payload.isDown;
                this.refreshMoveAxes();
                return true;
            case InputAction.MoveRight:
                this.rightDown = payload.isDown;
                this.refreshMoveAxes();
                return true;
            case InputAction.MoveUp:
                this.upDown = payload.isDown;
                this.refreshMoveAxes();
                return true;
            case InputAction.MoveDown:
                this.downDown = payload.isDown;
                this.refreshMoveAxes();
                return true;
            case InputAction.Jump:
                this.jumpHeld = payload.isDown;
                return true;
            case InputAction.Interact:
                if (payload.isDown) {
                    this.dismount();
                }
                return true;
            default:
                return false;
        }
    }

    private refreshMoveAxes(): void {
        this.moveX = (this.rightDown ? 1 : 0) + (this.leftDown ? -1 : 0);
        this.moveY = (this.upDown ? 1 : 0) + (this.downDown ? -1 : 0);
    }

    private placeDriverAtExit(): void {
        if (!this.driverNode || !cc.isValid(this.driverNode)) {
            return;
        }

        const exitLocal = cc.v2(this.exitOffsetX, this.exitOffsetY);
        const exitWorld = this.node.convertToWorldSpaceAR(exitLocal);
        const driverLocal = this.driverNode.parent
            ? this.driverNode.parent.convertToNodeSpaceAR(exitWorld)
            : exitWorld;
        this.driverNode.setPosition(driverLocal);
    }

    private setPlayerCollidersEnabled(enabled: boolean): void {
        if (!this.disablePlayerCollidersWhileMounted || !this.driverNode || enabled) {
            return;
        }

        this.disabledColliders = this.driverNode.getComponentsInChildren(cc.PhysicsCollider);
        this.disabledColliderStates = [];
        for (const collider of this.disabledColliders) {
            this.disabledColliderStates.push(collider.enabled);
            collider.enabled = false;
            collider.apply();
        }
    }

    private restorePlayerColliders(): void {
        for (let index = 0; index < this.disabledColliders.length; index++) {
            const collider = this.disabledColliders[index];
            if (!collider || !cc.isValid(collider.node)) {
                continue;
            }
            collider.enabled = this.disabledColliderStates[index];
            collider.apply();
        }
        this.disabledColliders = [];
        this.disabledColliderStates = [];
    }

    private clearMountState(): void {
        this.popVehicleContext();
        this.driverNode = null;
        this.driverController = null;
        this.driverBody = null;
        this.disabledColliders = [];
        this.disabledColliderStates = [];
    }

    private log(message: string): void {
        if (this.debugLog) {
            cc.log(`[VehicleController] ${this.node.name}: ${message}`);
        }
    }
}

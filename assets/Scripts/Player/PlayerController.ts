import BaseEntity from "../Core/BaseEntity";
import EventCenter from "../Core/EventCenter";
import { GameEvent, EntityType } from "../Core/Constants";
import CombatHitbox, { CombatFaction, CombatHitInfo } from "../Attack/CombatHitbox";
import { InventoryManager } from "./InventoryManager";
import MerchantNPC from "../NPC/MerchantNPC";
import { DialogueContent, DialogueOption, DialogueOptionId } from "../NPC/NPCDialogue";
import DialogueUIController from "../UI/DialogueUIController";
import MerchantShopUIController from "../UI/MerchantShopUIController";
import CraftingUIController from "../UI/CraftingUIController";
import VehicleInteractable from "../Vehicle/VehicleInteractable";
import PhysicsContactFilter from "../Core/PhysicsContactFilter";
import { PhysicsTag } from "../Core/PhysicsTags";
import Rope from '../Entity/Resources/Rope';
import AudioManager, { SfxType } from "../Core/AudioManager";

const { ccclass, property } = cc._decorator;

export interface BuffInfo {
    type: string;
    amount: number;
    timer: number;
}

@ccclass
export default class PlayerController extends BaseEntity {

    private activeBuffs: BuffInfo[] = [];

    @property(cc.Float)
    moveSpeed: number = 200;

    @property(cc.Float)
    jumpForce: number = 500;

    @property(cc.Float)
    defense: number = 0;

    @property(cc.Float)
    fastFallSpeed: number = 520;

    @property(cc.Float)
    oceanMoveSpeed: number = 160;

    @property(cc.Float)
    oceanVerticalSpeed: number = 220;

    @property(cc.Float)
    oceanSinkSpeed: number = 50;

    @property(cc.Float)
    oceanGravityScale: number = 0.18;

    @property(cc.Float)
    oceanControl: number = 8;

    @property(cc.Float)
    oceanDrag: number = 0.985;

    @property(cc.Float)
    oceanBoostSpeed: number = 520;

    @property(cc.Float)
    oceanBoostCooldown: number = 0.35;

    @property(cc.Node)
    inventoryUI: cc.Node = null!;

    @property(CraftingUIController)
    craftingUI: CraftingUIController = null!;

    @property(cc.Float)
    attackDamage: number = 20;

    @property(CombatHitbox)
    attackHitbox: CombatHitbox = null!;

    @property(DialogueUIController)
    dialogueUI: DialogueUIController = null!;

    @property(MerchantShopUIController)
    merchantShopUI: MerchantShopUIController = null!;

    @property({ type: cc.Float, range: [0, 1, 0.05], slide: true })
    knockbackResistance: number = 0;

    @property(cc.Float)
    knockbackLockTime: number = 0.12;

    @property({ tooltip: '離開藤蔓的水平偏移距離（px）' })
    private climbFallOffDistance: number = 40;

    private moveDir: cc.Vec2 = cc.v2(0, 0);
    private keyStates: { [key: number]: boolean } = {};
    private merchantShopKeyStates: { [key: number]: boolean } = {};

    private anim: cc.Animation = null!;
    private currentAnimName: string = "";
    private bodyNode: cc.Node = null!;
    private rb: cc.RigidBody = null!;

    private isAttacking: boolean = false;
    private isHurting: boolean = false;
    private isDead: boolean = false;
    private canvasNode: cc.Node = null!;
    private currentMerchant: MerchantNPC = null!;
    private promptMerchant: MerchantNPC = null!;
    private promptVehicle: VehicleInteractable = null!;
    private currentDialogueOptions: DialogueOption[] = [];
    private knockbackTimer: number = 0;
    private gameOverTransitionPending: boolean = false;
    private externalControlLocks: { [reason: string]: boolean } = {};

    private isInOcean: boolean = false;
    private originalGravityScale: number = 1;
    private oceanBoostTimer: number = 0;

    private browserMouseDownHandler: any = null!;
    private browserMouseWheelHandler: any = null!;
    private useBrowserMouseInput: boolean = false;

    private isClimbing: boolean = false;
    private currentRope: any = null;
    private nearbyRope: any = null;  

    onLoad() {
        super.onLoad();
        this.type = EntityType.PLAYER;
        this.applyRuntimeMovementTuning();

        const physicsManager = cc.director.getPhysicsManager();
        physicsManager.enabled = true;
        physicsManager.debugDrawFlags = 0;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        cc.systemEvent.on("CRAFTING_UI_OPENED", this.onCraftingUIOpened, this);
        cc.systemEvent.on("CRAFTING_UI_CLOSED", this.onCraftingUIClosed, this);
        cc.systemEvent.on("MERCHANT_SHOP_CLOSE_REQUESTED", this.closeMerchantFlow, this);

        this.canvasNode = cc.find("Canvas") || null!;
        this.setupMouseAttackInput();
        this.setupMouseWheelInput();

        this.bodyNode = this.node.getChildByName("Sprite_Body") || null!;

        this.node.zIndex = 100;

        if (this.bodyNode) {
            this.bodyNode.zIndex = 101;
        }
        
        if (this.bodyNode) {
            this.anim = this.bodyNode.getComponent(cc.Animation) || null!;
            if (this.anim) {
                this.anim.on("finished", this.onAnimFinished, this);
            }
        }

        // this.currentHp = this.maxHp;
        this.rb = this.getComponent(cc.RigidBody) || null!;

        if (this.rb) {
            this.originalGravityScale = (this.rb as any).gravityScale || 1;
        }
        PhysicsContactFilter.ensureForNode(this.node, PhysicsTag.PLAYER_BODY);

        if (!this.attackHitbox) {
            const hitboxNode = this.node.getChildByName("AttackHitbox");
            this.attackHitbox = hitboxNode ? (hitboxNode.getComponent(CombatHitbox) || null!) : null!;
        }

        if (this.attackHitbox) {
            this.attackHitbox.ownerFaction = CombatFaction.PLAYER;
            this.attackHitbox.canHitPlayer = false;
            this.attackHitbox.canHitPeaceNpc = true;
            this.attackHitbox.canHitNeutralNpc = true;
            this.attackHitbox.canHitHostileNpc = true;
        }
    }

    private setupMouseAttackInput() {
        const gameCanvas = (cc.game as any).canvas;

        if (gameCanvas && gameCanvas.addEventListener) {
            this.browserMouseDownHandler = (event: any) => {
                this.handleMouseAttack(event.button);
            };

            gameCanvas.addEventListener("mousedown", this.browserMouseDownHandler, false);
            this.useBrowserMouseInput = true;
            return;
        }

        if (this.canvasNode) {
            this.canvasNode.on(cc.Node.EventType.MOUSE_DOWN, this.onNodeMouseDown, this);
            this.useBrowserMouseInput = false;
        }
    }

    private setupMouseWheelInput() {
        const gameCanvas = (cc.game as any).canvas;

        if (gameCanvas && gameCanvas.addEventListener) {
            this.browserMouseWheelHandler = (event: any) => {
                const fakeWheelEvent = {
                    getScrollY: () => -event.deltaY
                } as cc.Event.EventMouse;

                this.onMouseWheel(fakeWheelEvent);

                if (event.preventDefault) {
                    event.preventDefault();
                }
            };

            gameCanvas.addEventListener("wheel", this.browserMouseWheelHandler, false);
            return;
        }

        if (this.canvasNode) {
            this.canvasNode.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        }
    }

    private onNodeMouseDown(event: cc.Event.EventMouse) {
        this.handleMouseAttack(event.getButton());
    }

    private handleMouseAttack(button: number) {
        if (!this.canUseGameplayAction()) return;

        if (button === cc.Event.EventMouse.BUTTON_LEFT || button === 0) {
            this.attack();
        }
    }

    onKeyDown(event: cc.Event.EventKeyboard) {
        if (this.merchantShopUI && this.merchantShopUI.isOpen()) {
            if (this.merchantShopKeyStates[event.keyCode]) {
                return;
            }

            this.merchantShopKeyStates[event.keyCode] = true;
            this.handleMerchantShopKey(event.keyCode);
            this.blockPlayerControlForUI();
            return;
        }

        this.applyMoveKey(event.keyCode, true);
    }

    onKeyUp(event: cc.Event.EventKeyboard) {
        if (this.merchantShopKeyStates[event.keyCode]) {
            delete this.merchantShopKeyStates[event.keyCode];
            this.keyStates[event.keyCode] = false;
            return;
        }

        this.applyMoveKey(event.keyCode, false);
    }

    private applyMoveKey(keyCode: number, isDown: boolean) {
        const wasDown = !!this.keyStates[keyCode];
        if (wasDown === isDown) return;

        this.keyStates[keyCode] = isDown;

        if (this.isExternalControlLocked()) {
            this.blockPlayerControlForUI();
            return;
        }

        if (this.isCraftingUIOpen()) {
            if (isDown && keyCode === cc.macro.KEY.c) {
                this.toggleCrafting();
            }

            this.blockPlayerControlForUI();
            return;
        }

        if (this.inventoryUI && this.inventoryUI.active) {
            if (isDown && keyCode === cc.macro.KEY.b) {
                this.toggleInventory();
            }

            this.blockPlayerControlForUI();
            return;
        }

        if (isDown && this.handleMerchantShopKey(keyCode)) {
            return;
        }

        if (this.isMerchantUIOpen() && keyCode !== cc.macro.KEY.f) {
            this.blockPlayerControlForUI();
            return;
        }

        const amount = isDown ? 1 : -1;

        switch (keyCode) {
            case cc.macro.KEY.a:
                this.moveDir.x -= amount;
                break;

            case cc.macro.KEY.d:
                this.moveDir.x += amount;
                break;

            case cc.macro.KEY.s:
            case cc.macro.KEY.down:
                if (isDown && !this.isInOcean) {
                    this.tryFastFall();
                }
                break;

            case cc.macro.KEY.space:
                if (isDown) {
                    if (this.isClimbing) {
                        this.exitClimb(true);
                    } else if (this.isInOcean) {
                        this.boostInOcean();
                    } else {
                        this.jump();
                    }
                }
                break;

            case cc.macro.KEY.b:
                if (isDown) {
                    this.toggleInventory();
                }
                break;

            case cc.macro.KEY.c:
                if (isDown) {
                    this.toggleCrafting();
                }
                break;

            case cc.macro.KEY.f:
                if (isDown) {
                    this.tryInteractWithMerchant();
                }
                break;

            case cc.macro.KEY.t:
                if (isDown) {
                    InventoryManager.instance.addItem("coconut", 10);
                }
                break;
            case cc.macro.KEY.w:
            case cc.macro.KEY.up:
                if (isDown && !this.isClimbing && this.nearbyRope) {
                    this.enterClimb(this.nearbyRope);
                }
                break;
        }
    }

    private onMouseWheel(event: cc.Event.EventMouse) {
        const scrollY = event.getScrollY();
        if (scrollY === 0) {
            return;
        }

        if (this.dialogueUI && this.dialogueUI.isOptionsVisible()) {
            if (scrollY < 0) {
                this.dialogueUI.selectNext();
            } else {
                this.dialogueUI.selectPrev();
            }
            return;
        }

        if (this.merchantShopUI && this.merchantShopUI.isOpen()) {
            if (scrollY < 0) {
                this.merchantShopUI.selectNextItem();
            } else {
                this.merchantShopUI.selectPrevItem();
            }
        }
    }

    private tryInteractWithMerchant() {
        if (this.isDead || this.isCraftingUIOpen()) {
            return;
        }

        if (this.inventoryUI && this.inventoryUI.active) {
            return;
        }

        if (this.merchantShopUI && this.merchantShopUI.isOpen()) {
            this.closeMerchantFlow();
            return;
        }

        if (this.dialogueUI && this.dialogueUI.isOptionsVisible()) {
            this.confirmDialogueOption();
            return;
        }

        const merchant = this.promptMerchant || this.findNearestMerchant();
        if (merchant && merchant.canInteract(this.node)) {
            this.currentMerchant = merchant;
            merchant.beginInteraction(this.node);
            this.showMerchantOptions();
            return;
        }

        const vehicle = this.promptVehicle || this.findNearestVehicle();
        if (vehicle && vehicle.canInteract(this.node)) {
            const controller = vehicle.getVehicleController();
            if (controller && typeof controller.tryMount === "function" && controller.tryMount(this.node)) {
                if (this.dialogueUI) {
                    this.dialogueUI.hidePrompt();
                }
                this.promptVehicle = null!;
                return;
            }
        }

        cc.log("[PlayerController] No merchant or vehicle in interaction range.");
    }

    private toggleInventory() {
        if (!this.inventoryUI) return;
        if (this.isCraftingUIOpen()) return;

        const nextActive = !this.inventoryUI.active;
        this.inventoryUI.active = nextActive;

        if (nextActive && this.dialogueUI && !this.isMerchantUIOpen()) {
            this.dialogueUI.hide();
            this.promptMerchant = null!;
        }

        if (nextActive && this.rb) {
            this.blockPlayerControlForUI();
        }
    }

    private toggleCrafting() {
        if (!this.craftingUI) return;
        if (this.isMerchantUIOpen()) return;

        if (this.inventoryUI && this.inventoryUI.active) {
            this.inventoryUI.active = false;
        }

        if (this.isCraftingUIOpen()) {
            this.closeCrafting();
            return;
        }

        if (this.dialogueUI) {
            this.dialogueUI.hide();
        }

        this.promptMerchant = null!;
        this.currentMerchant = null!;

        const anyCraftingUI = this.craftingUI as any;
        if (typeof anyCraftingUI.open === "function") {
            anyCraftingUI.open();
        } else if (this.craftingUI.node) {
            this.craftingUI.node.active = true;
        }

        this.blockPlayerControlForUI();
    }

    private closeCrafting() {
        if (!this.craftingUI) return;

        const anyCraftingUI = this.craftingUI as any;
        if (typeof anyCraftingUI.close === "function") {
            anyCraftingUI.close();
        } else if (this.craftingUI.node) {
            this.craftingUI.node.active = false;
        }
    }

    private isCraftingUIOpen(): boolean {
        if (!this.craftingUI || !cc.isValid(this.craftingUI.node)) {
            return false;
        }

        const anyCraftingUI = this.craftingUI as any;

        if (typeof anyCraftingUI.isOpen === "function") {
            return anyCraftingUI.isOpen();
        }

        if (anyCraftingUI.root && cc.isValid(anyCraftingUI.root)) {
            return !!anyCraftingUI.root.active;
        }

        return !!this.craftingUI.node.activeInHierarchy;
    }

    private onCraftingUIOpened() {
        this.blockPlayerControlForUI();
    }

    private onCraftingUIClosed() {
        // 保留空函式，避免之後需要事件時重找
    }

    private jump() {
        if (this.isDead || this.isHurting || this.isAttacking || !this.rb) return;

        if (this.isInOcean) {
            return;
        }

        if (this.isGrounded()) {
            this.rb.linearVelocity = cc.v2(this.rb.linearVelocity.x, this.jumpForce);
        }
    }

    public receiveAttack(amount: number, attackerNode: cc.Node = null!, hitInfo?: CombatHitInfo) {
        if (this.isDead) {
            return;
        }

        this.applyKnockback(attackerNode, hitInfo);
        this.takeDamage(amount);
    }

    public canUseGameplayAction(): boolean {
        if (this.isDead || this.isExternalControlLocked() || this.isMerchantUIOpen() || this.isCraftingUIOpen()) {
            return false;
        }

        if (this.inventoryUI && this.inventoryUI.active) {
            return false;
        }

        return true;
    }

    public setExternalControlLocked(locked: boolean, reason: string = "external"): void {
        this.externalControlLocks[reason] = locked;
        if (!locked) {
            delete this.externalControlLocks[reason];
            return;
        }

        this.blockPlayerControlForUI();
        if (this.dialogueUI) {
            this.dialogueUI.hidePrompt();
        }
        this.promptMerchant = null!;
        this.promptVehicle = null!;
    }

    public isExternalControlLocked(): boolean {
        return Object.keys(this.externalControlLocks).some(key => this.externalControlLocks[key]);
    }

    private findNearestMerchant(): MerchantNPC {
        const root = this.canvasNode || cc.find("Canvas");
        if (!root) {
            return null!;
        }

        const merchants: MerchantNPC[] = [];
        this.collectMerchants(root, merchants);

        let nearest: MerchantNPC = null!;
        let nearestDistance = Number.MAX_VALUE;
        const playerWorldPos = this.node.parent
            ? this.node.parent.convertToWorldSpaceAR(cc.v2(this.node.x, this.node.y))
            : cc.v2(this.node.x, this.node.y);

        for (const merchant of merchants) {
            if (!merchant || !cc.isValid(merchant.node)) {
                continue;
            }

            const merchantWorldPos = merchant.node.parent
                ? merchant.node.parent.convertToWorldSpaceAR(cc.v2(merchant.node.x, merchant.node.y))
                : cc.v2(merchant.node.x, merchant.node.y);

            const distance = merchantWorldPos.sub(playerWorldPos).mag();

            if (distance < nearestDistance) {
                nearest = merchant;
                nearestDistance = distance;
            }
        }

        return nearest;
    }

    private collectMerchants(root: cc.Node, result: MerchantNPC[]) {
        if (!root) {
            return;
        }

        const merchant = root.getComponent(MerchantNPC);
        if (merchant) {
            result.push(merchant);
        }

        const children = (root as any).children || [];
        for (const child of children) {
            this.collectMerchants(child, result);
        }
    }

    private findNearestVehicle(): VehicleInteractable {
        const root = this.canvasNode || cc.find("Canvas");
        if (!root) {
            return null!;
        }

        const vehicles: VehicleInteractable[] = [];
        this.collectVehicles(root, vehicles);

        let nearest: VehicleInteractable = null!;
        let nearestDistance = Number.MAX_VALUE;
        const playerWorldPos = this.node.parent
            ? this.node.parent.convertToWorldSpaceAR(cc.v2(this.node.x, this.node.y))
            : cc.v2(this.node.x, this.node.y);

        for (const vehicle of vehicles) {
            if (!vehicle || !cc.isValid(vehicle.node)) {
                continue;
            }

            const vehicleWorldPos = vehicle.node.parent
                ? vehicle.node.parent.convertToWorldSpaceAR(cc.v2(vehicle.node.x, vehicle.node.y))
                : cc.v2(vehicle.node.x, vehicle.node.y);

            const distance = vehicleWorldPos.sub(playerWorldPos).mag();
            if (distance < nearestDistance) {
                nearest = vehicle;
                nearestDistance = distance;
            }
        }

        return nearest;
    }

    private collectVehicles(root: cc.Node, result: VehicleInteractable[]) {
        if (!root) {
            return;
        }

        const vehicle = root.getComponent(VehicleInteractable);
        if (vehicle) {
            result.push(vehicle);
        }

        const children = (root as any).children || [];
        for (const child of children) {
            this.collectVehicles(child, result);
        }
    }

    update(dt: number) {
        if (this.activeBuffs.length > 0) {
            for (let i = this.activeBuffs.length - 1; i >= 0; i--) {
                this.activeBuffs[i].timer -= dt;
                if (this.activeBuffs[i].timer <= 0) {
                    if (this.activeBuffs[i].type === 'attack') {
                        this.attackDamage -= this.activeBuffs[i].amount;
                        cc.log(`[PlayerController] Buff 結束！扣回攻擊力 ${this.activeBuffs[i].amount}`);
                    }
                    else if (this.activeBuffs[i].type === 'defense') {
                        this.defense -= this.activeBuffs[i].amount;
                        cc.log(`[PlayerController] Buff 結束！扣回防禦力 ${this.activeBuffs[i].amount}`);
                    }
                    
                    this.activeBuffs.splice(i, 1);
                }
            }
            EventCenter.emit(GameEvent.BUFF_UPDATED, this.activeBuffs);
        } else {
            EventCenter.emit(GameEvent.BUFF_UPDATED, []);
        }
        if (this.currentMerchant && !cc.isValid(this.currentMerchant.node)) {
            this.closeMerchantFlow();
        }

        this.updateMerchantPrompt();
        this.knockbackTimer = Math.max(0, this.knockbackTimer - dt);
        this.oceanBoostTimer = Math.max(0, this.oceanBoostTimer - dt);

        if (this.isExternalControlLocked()) {
            this.blockPlayerControlForUI();
            return;
        }

        if (this.isCraftingUIOpen()) {
            this.blockPlayerControlForUI();
            return;
        }

        if (this.inventoryUI && this.inventoryUI.active) {
            this.blockPlayerControlForUI();
            return;
        }

        if (this.isMerchantUIOpen()) {
            this.blockPlayerControlForUI();
            return;
        }

        if (this.isDead || this.isHurting || this.isAttacking || !this.rb) return;
        if (this.knockbackTimer > 0) return;

        if (this.isInOcean) {
            this.updateOceanMovement(dt);
            return;
        }

        if (this.isClimbing) {
            this.updateClimb(dt);
            return;
        }

        this.updateNearbyRope();

        const isMovingX = this.moveDir.x !== 0;
        const targetSpeedX = this.moveDir.x * this.moveSpeed * 0.8;

        let targetSpeedY = this.rb.linearVelocity.y;

        if (this.isFastFallPressed() && !this.isGrounded()) {
            targetSpeedY = -this.fastFallSpeed;
        } 
        else if (this.isGrounded() && isMovingX) {
            if (targetSpeedY < -0.5 && targetSpeedY > -300) {
                targetSpeedY = -150; 
            }
        }

        this.rb.linearVelocity = cc.v2(targetSpeedX, targetSpeedY);

        if (isMovingX) {
            if (this.bodyNode) {
                this.bodyNode.scaleX = this.moveDir.x > 0 ? 1 : -1;
            }

            if (Math.abs(this.rb.linearVelocity.y) <= 0.1 || this.isGrounded()) {
                this.playAnimation("PlayerRun");
            }
        } else {
            if (Math.abs(this.rb.linearVelocity.y) <= 0.1 || this.isGrounded()) {
                this.playAnimation("PlayerIdle");
            }
        }
        
    }

    public enterOceanArea() {
        if (this.isInOcean) {
            return;
        }

        this.isInOcean = true;

        if (this.rb) {
            this.originalGravityScale = (this.rb as any).gravityScale || 1;
            (this.rb as any).gravityScale = this.oceanGravityScale;
            this.rb.linearVelocity = cc.v2(
                this.rb.linearVelocity.x * 0.6,
                this.rb.linearVelocity.y * 0.4
            );
        }
    }

    public exitOceanArea() {
        if (!this.isInOcean) {
            return;
        }

        this.isInOcean = false;

        if (this.rb) {
            (this.rb as any).gravityScale = this.originalGravityScale;
            this.rb.linearVelocity = cc.v2(
                this.rb.linearVelocity.x * 0.95,
                this.rb.linearVelocity.y * 0.95
            );
        }
    }

    private updateOceanMovement(dt: number) {
        if (!this.rb) {
            return;
        }

        const horizontalInput = this.moveDir.x;
        const verticalInput = this.getOceanVerticalInput();

        const targetVelocityX = horizontalInput * this.oceanMoveSpeed;
        let targetVelocityY = -this.oceanSinkSpeed;

        if (verticalInput > 0) {
            targetVelocityY = verticalInput * this.oceanVerticalSpeed;
        } else if (verticalInput < 0) {
            targetVelocityY = verticalInput * this.oceanVerticalSpeed;
        }

        const controlRatio = Math.min(1, dt * this.oceanControl);

        let velocityX = this.rb.linearVelocity.x + (targetVelocityX - this.rb.linearVelocity.x) * controlRatio;
        let velocityY = this.rb.linearVelocity.y + (targetVelocityY - this.rb.linearVelocity.y) * controlRatio;

        const dragRatio = Math.pow(this.oceanDrag, dt * 60);
        velocityX *= dragRatio;
        velocityY *= dragRatio;

        this.rb.linearVelocity = cc.v2(velocityX, velocityY);

        if (horizontalInput !== 0 && this.bodyNode) {
            this.bodyNode.scaleX = horizontalInput > 0 ? 1 : -1;
        }

        if (Math.abs(horizontalInput) > 0 || Math.abs(verticalInput) > 0) {
            this.playAnimation("PlayerRun");
        } else {
            this.playAnimation("PlayerIdle");
        }
    }

    private boostInOcean() {
        if (!this.rb || !this.isInOcean || this.oceanBoostTimer > 0) {
            return;
        }

        let directionX = this.moveDir.x;
        let directionY = this.getOceanVerticalInput();

        if (directionX === 0 && directionY === 0) {
            directionY = 1;
        }

        const length = Math.sqrt(directionX * directionX + directionY * directionY);
        if (length <= 0) {
            return;
        }

        directionX /= length;
        directionY /= length;

        this.rb.linearVelocity = cc.v2(
            this.rb.linearVelocity.x + directionX * this.oceanBoostSpeed,
            this.rb.linearVelocity.y + directionY * this.oceanBoostSpeed
        );

        this.oceanBoostTimer = this.oceanBoostCooldown;
    }

    private getOceanVerticalInput(): number {
        let input = 0;

        if (this.keyStates[cc.macro.KEY.w] || this.keyStates[cc.macro.KEY.up]) {
            input += 1;
        }

        if (this.keyStates[cc.macro.KEY.s] || this.keyStates[cc.macro.KEY.down]) {
            input -= 1;
        }

        if (input > 1) {
            input = 1;
        }

        if (input < -1) {
            input = -1;
        }

        return input;
    }

    private applyRuntimeMovementTuning() {
        this.oceanMoveSpeed = 180;
        this.oceanVerticalSpeed = 260;
        this.oceanSinkSpeed = 35;
        this.oceanGravityScale = 0.18;
        this.oceanControl = 12;
        this.oceanDrag = 0.99;
        this.oceanBoostSpeed = 620;
        this.oceanBoostCooldown = 0.28;
        this.fastFallSpeed = 520;
    }

    private isFastFallPressed(): boolean {
        return !!(
            this.keyStates[cc.macro.KEY.s] ||
            this.keyStates[cc.macro.KEY.down]
        );
    }

    private isGrounded(): boolean {
        if (!this.rb) {
            return false;
        }

        // 1. 靜止平地判定 (保留以節省效能)
        if (Math.abs(this.rb.linearVelocity.y) <= 0.05) {
            return true;
        }

        // 2. 終極三叉戟射線判定 (無視 Anchor，完美貼合斜坡)
        const physicsManager = cc.director.getPhysicsManager();
        
        // 取得角色在世界座標中的實際外框大小，不管 Anchor 設在哪裡都絕對精準
        const bbox = this.node.getBoundingBoxToWorld();

        // 射線起點：角色腳底板往上 5 像素 (避免剛好貼地穿透)
        const startY = bbox.yMin + 5;
        // 射線終點：往下探測 20 像素 (足以應付各種斜坡落差)
        const endY = bbox.yMin - 20;

        // 從左腳、胯下、右腳打出三條探測線，只要有一條踩到地就算數
        const rayXs = [bbox.xMin + 5, bbox.xMin + (bbox.width / 2), bbox.xMax - 5];

        for (let x of rayXs) {
            const startPos = cc.v2(x, startY);
            const endPos = cc.v2(x, endY);
            const results = physicsManager.rayCast(startPos, endPos, cc.RayCastType.All);

            for (let i = 0; i < results.length; i++) {
                const hitCollider = results[i].collider;
                const hitNode = hitCollider.node;

                // 排除自己、武器以及感應區 (Sensor)
                if (hitNode !== this.node && !hitNode.isChildOf(this.node) && !hitCollider.sensor) {
                    // 放寬向上速度限制！
                    // 走上斜坡時 Y 速度可能破百，只要不是被炸飛或大跳中 (速度 > 300)，就當作乖乖踩在地上
                    if (this.rb.linearVelocity.y < 300) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private tryFastFall() {
        if (!this.rb) {
            return;
        }

        if (this.isInOcean) {
            return;
        }

        if (this.isGrounded()) {
            return;
        }

        this.rb.linearVelocity = cc.v2(this.rb.linearVelocity.x, -this.fastFallSpeed);
    }

    private playAnimation(animName: string) {
        if (!this.anim) return;
        if (this.currentAnimName === animName) return;

        this.anim.play(animName);
        this.currentAnimName = animName;
    }

    private attack() {
        if (this.isAttacking || this.isHurting || this.isDead) return;

        this.isAttacking = true;
        this.playAnimation("PlayerAttack");

        if (this.attackHitbox) {
            const facingRight = !this.bodyNode || this.bodyNode.scaleX >= 0;
            (this.attackHitbox as any).activate(facingRight, this.attackDamage, this.node, 0);
        }
    }

    private applyKnockback(attackerNode: cc.Node, hitInfo?: CombatHitInfo) {
        if (!this.rb || !attackerNode || !cc.isValid(attackerNode) || this.isDead) {
            return;
        }

        const knockbackX = hitInfo ? hitInfo.knockbackX : 0;
        const knockbackY = hitInfo ? hitInfo.knockbackY : 0;
        if (knockbackX <= 0 && knockbackY <= 0) {
            return;
        }

        const selfWorldPos = this.node.parent
            ? this.node.parent.convertToWorldSpaceAR(cc.v2(this.node.x, this.node.y))
            : cc.v2(this.node.x, this.node.y);

        const attackerWorldPos = attackerNode.parent
            ? attackerNode.parent.convertToWorldSpaceAR(cc.v2(attackerNode.x, attackerNode.y))
            : cc.v2(attackerNode.x, attackerNode.y);

        const direction = selfWorldPos.x >= attackerWorldPos.x ? 1 : -1;
        const scale = 1 - Math.max(0, Math.min(1, this.knockbackResistance));
        const velocityX = direction * knockbackX * scale;
        const velocityY = knockbackY * scale;

        this.rb.linearVelocity = cc.v2(velocityX, Math.max(this.rb.linearVelocity.y, velocityY));
        this.knockbackTimer = this.knockbackLockTime;
    }

    protected onDamaged() {
        if (this.isDead) return;

        this.isHurting = true;
        this.isAttacking = false;

        if (this.attackHitbox) {
            this.attackHitbox.deactivate();
        }

        EventCenter.emit(GameEvent.PLAYER_HP_CHANGED, this.currentHp, this.maxHp);
        this.playAnimation("PlayerHurt");
    }

    protected die() {
        if (this.isDead) return;

        this.isDead = true;
        this.isHurting = false;
        this.isAttacking = false;

        if (this.attackHitbox) {
            this.attackHitbox.deactivate();
        }

        this.closeCrafting();
        this.closeMerchantFlow();
        EventCenter.emit(GameEvent.PLAYER_HP_CHANGED, 0, this.maxHp);
        this.playAnimation("PlayerDie");
    }

    private onAnimFinished(event: string, state: cc.AnimationState) {
        if (state.name === "PlayerAttack") {
            this.isAttacking = false;
            this.currentAnimName = "";

            if (this.attackHitbox) {
                this.attackHitbox.deactivate();
            }
        } else if (state.name === "PlayerHurt") {
            this.isHurting = false;
            this.currentAnimName = "";
        }
        else if (state.name === "PlayerDie") {
            if (!this.gameOverTransitionPending) {
                this.gameOverTransitionPending = true;
                this.scheduleOnce(this.loadGameOverScene, 0);
            }
        }
    }

    private loadGameOverScene = () => {
        if (!this.node || !cc.isValid(this.node)) {
            return;
        }

        EventCenter.emit(GameEvent.PLAYER_DIED);

        const gameManager = (window as any).GameManager;
        if (gameManager && typeof gameManager.handlePlayerDeath === "function") {
            gameManager.handlePlayerDeath();
            return;
        }

        cc.director.loadScene("GameOver");
    };

    onDestroy() {
        this.unscheduleAllCallbacks();
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        cc.systemEvent.off("CRAFTING_UI_OPENED", this.onCraftingUIOpened, this);
        cc.systemEvent.off("CRAFTING_UI_CLOSED", this.onCraftingUIClosed, this);
        cc.systemEvent.off("MERCHANT_SHOP_CLOSE_REQUESTED", this.closeMerchantFlow, this);

        const gameCanvas = (cc.game as any).canvas;

        if (this.useBrowserMouseInput && this.browserMouseDownHandler) {
            if (gameCanvas && gameCanvas.removeEventListener) {
                gameCanvas.removeEventListener("mousedown", this.browserMouseDownHandler, false);
            }
        }

        if (this.browserMouseWheelHandler) {
            if (gameCanvas && gameCanvas.removeEventListener) {
                gameCanvas.removeEventListener("wheel", this.browserMouseWheelHandler, false);
            }
        }

        if (this.canvasNode && cc.isValid(this.canvasNode)) {
            this.canvasNode.off(cc.Node.EventType.MOUSE_DOWN, this.onNodeMouseDown, this);
            this.canvasNode.off(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        }

        if (this.anim && cc.isValid(this.anim)) {
            this.anim.off("finished", this.onAnimFinished, this);
        }

        this.dialogueUI = null!;
        this.merchantShopUI = null!;
        this.currentMerchant = null!;
        this.promptMerchant = null!;
        this.promptVehicle = null!;
        this.currentDialogueOptions = [];
    }

    private updateMerchantPrompt() {
        if (!this.dialogueUI || this.isDead || this.isExternalControlLocked() || this.isMerchantUIOpen() || this.isCraftingUIOpen()) {
            return;
        }

        if (this.inventoryUI && this.inventoryUI.active) {
            return;
        }

        if (this.dialogueUI.isOptionsVisible()) {
            return;
        }

        const merchant = this.findNearestMerchant();
        if (merchant && merchant.canInteract(this.node)) {
            this.promptMerchant = merchant;
            this.promptVehicle = null!;
            this.dialogueUI.showPrompt("Press F to Talk", merchant.node);
            return;
        }

        this.promptMerchant = null!;
        const vehicle = this.findNearestVehicle();
        if (vehicle && vehicle.canInteract(this.node)) {
            this.promptVehicle = vehicle;
            this.dialogueUI.showPrompt(vehicle.promptText || "Press F to Ride", vehicle.node);
            return;
        }

        this.promptVehicle = null!;
        this.dialogueUI.hidePrompt();
    }

    private showMerchantOptions() {
        if (this.dialogueUI && this.currentMerchant && cc.isValid(this.currentMerchant.node)) {
            this.showDialogueContent(this.currentMerchant.getDialogueContent(), this.currentMerchant.node);
        }
    }

    private confirmDialogueOption() {
        if (!this.currentMerchant || !cc.isValid(this.currentMerchant.node)) {
            this.closeMerchantFlow();
            return;
        }

        const selectedIndex = this.dialogueUI ? this.dialogueUI.getSelectedIndex() : -1;
        const selectedOption = this.currentDialogueOptions[selectedIndex];

        if (!selectedOption) {
            this.closeMerchantFlow();
            return;
        }

        this.currentMerchant.handleDialogueOption(selectedOption.id, this.node);

        if (selectedOption.id === DialogueOptionId.Trade) {
            this.currentMerchant.openTrade();

            if (this.dialogueUI) {
                this.dialogueUI.hide();
            }

            if (this.merchantShopUI) {
                this.merchantShopUI.open(this.currentMerchant);
            }

            return;
        }

        if (selectedOption.id === DialogueOptionId.Chat) {
            this.showDialogueContent(this.currentMerchant.getChatDialogueContent(), this.currentMerchant.node);
            return;
        }

        this.closeMerchantFlow();
    }

    private closeMerchantFlow() {
        if (this.merchantShopUI && this.merchantShopUI.isOpen()) {
            this.merchantShopUI.close();
        }

        if (this.dialogueUI) {
            this.dialogueUI.hide();
        }

        if (this.currentMerchant && cc.isValid(this.currentMerchant.node)) {
            this.currentMerchant.closeTrade();
        }

        this.currentMerchant = null!;
        this.promptMerchant = null!;
        this.currentDialogueOptions = [];
    }

    private blockPlayerControlForUI(): void {
        this.clearMovementInput();

        if (this.rb) {
            if (this.isInOcean) {
                const currentY = this.rb.linearVelocity.y;
                const sinkY = -Math.abs(this.oceanSinkSpeed);
                this.rb.linearVelocity = cc.v2(0, Math.min(currentY, sinkY));
            } else {
                this.rb.linearVelocity = cc.v2(0, Math.min(0, this.rb.linearVelocity.y));
            }
        }

        if (!this.isDead && !this.isHurting && !this.isAttacking) {
            if (this.isInOcean || this.isGrounded()) {
                this.playAnimation("PlayerIdle");
            }
        }
    }

    private clearMovementInput(): void {
        this.moveDir = cc.v2(0, 0);

        this.keyStates[cc.macro.KEY.a] = false;
        this.keyStates[cc.macro.KEY.d] = false;
        this.keyStates[cc.macro.KEY.w] = false;
        this.keyStates[cc.macro.KEY.up] = false;
        this.keyStates[cc.macro.KEY.s] = false;
        this.keyStates[cc.macro.KEY.down] = false;
        this.keyStates[cc.macro.KEY.space] = false;
    }

    private isMerchantUIOpen(): boolean {
        return !!(
            (this.dialogueUI && this.dialogueUI.isOptionsVisible()) ||
            (this.merchantShopUI && this.merchantShopUI.isOpen())
        );
    }

    private handleMerchantShopKey(keyCode: number): boolean {
        if (!this.merchantShopUI || !this.merchantShopUI.isOpen()) {
            return false;
        }

        switch (keyCode) {
            case cc.macro.KEY.w:
            case cc.macro.KEY.up:
                this.merchantShopUI.selectPrevItem();
                return true;

            case cc.macro.KEY.s:
            case cc.macro.KEY.down:
                this.merchantShopUI.selectNextItem();
                return true;

            case cc.macro.KEY.a:
            case cc.macro.KEY.left:
                this.merchantShopUI.decreaseAmount();
                return true;

            case cc.macro.KEY.d:
            case cc.macro.KEY.right:
                this.merchantShopUI.increaseAmount();
                return true;

            case cc.macro.KEY.f:
            case cc.macro.KEY.enter:
                this.merchantShopUI.buySelected();
                return true;

            case cc.macro.KEY.escape:
                this.closeMerchantFlow();
                return true;

            default:
                return false;
        }
    }

    private showDialogueContent(content: DialogueContent, anchorNode: cc.Node) {
        if (!this.dialogueUI || !content) {
            return;
        }

        this.currentDialogueOptions = content.options ? content.options.slice() : [];

        this.dialogueUI.showOptions(
            content.line,
            this.currentDialogueOptions.map(option => option.label),
            anchorNode
        );
    }

    public onNearRope(rope: any) {
        this.nearbyRope = rope;
        cc.log('[PlayerController] 靠近藤蔓');
    }

    // 把 nearbyRope 改成靠距離判斷，在 updateMerchantPrompt 旁邊加：
    private updateNearbyRope() {
        if (this.isClimbing) return;

        const canvas = cc.find('Canvas');
        if (!canvas) return;

        // 找場景裡所有 Rope
        let closest: any = null;
        let closestDist = 80; // 判定距離（px）

        this.findRopes(canvas, (rope: any) => {
            const ropeWorldPos = rope.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
            const playerWorldPos = this.node.parent
                ? this.node.parent.convertToWorldSpaceAR(cc.v2(this.node.x, this.node.y))
                : cc.v2(this.node.x, this.node.y);
            const dist = ropeWorldPos.sub(playerWorldPos).mag();
            if (dist < closestDist) {
                closest = rope;
                closestDist = dist;
            }
        });

        this.nearbyRope = closest;
    }

    private findRopes(node: cc.Node, callback: (rope: any) => void) {
        const rope = node.getComponent('Rope');
        if (rope) callback(rope);
        for (const child of node.children) {
            this.findRopes(child, callback);
        }
    }
    
    public onLeaveRope(rope: any) {
    if (this.nearbyRope === rope) this.nearbyRope = null;
        
        // ★ 正在爬這條藤蔓時，離開範圍事件不取消爬行
        // （切換 Kinematic 會觸發 onEndContact，這是誤判）
        if (this.currentRope === rope && !this.isClimbing) {
            this.exitClimb(false);
        }
        
        cc.log('[PlayerController] 離開藤蔓範圍');
    }
    
    // 進入爬行
    private enterClimb(rope: any) {
        if (this.isDead || this.isHurting) return;

        this.isClimbing  = true;
        this.currentRope = rope;

        if (this.rb) {
            this.rb.linearVelocity = cc.v2(0, 0);
            (this.rb as any).gravityScale = 0;
            this.rb.type = cc.RigidBodyType.Kinematic;
        }

        // ★ 加 null 檢查
        const ropeWorldX = rope.getCenterWorldX();
        if (this.node && this.node.parent) {
            const localX = this.node.parent.convertToNodeSpaceAR(cc.v2(ropeWorldX, 0)).x;
            this.node.setPosition(localX, this.node.y);
        }

        this.playAnimation('PlayerClimb');
        cc.log('[PlayerController] 開始爬藤蔓');
    }
    
    // 離開爬行
    private exitClimb(jumpOff: boolean) {
        if (!this.isClimbing) return;

        this.isClimbing  = false;
        this.currentRope = null;

        if (this.rb) {
            // ★ 先切回 Dynamic，再設速度
            this.rb.type = cc.RigidBodyType.Dynamic;
            (this.rb as any).gravityScale = this.originalGravityScale;

            if (jumpOff) {
                this.rb.linearVelocity = cc.v2(
                    this.moveDir.x * this.moveSpeed * 0.6,
                    this.jumpForce * 0.7
                );
                cc.log('[PlayerController] 跳離藤蔓');
            } else {
                // ★ 不要設成 0,0，讓重力自然接管
                this.rb.linearVelocity = cc.v2(0, this.rb.linearVelocity.y);
            }
        }

        this.currentAnimName = '';
        cc.log('[PlayerController] 離開爬行狀態');
    }
    
    private updateClimb(dt: number) {
        if (!this.currentRope || !this.rb) return;
    
        const climbSpeed   = this.currentRope.getClimbSpeed();
        const driftSpeed   = this.currentRope.getDriftSpeed();
        const topY         = this.currentRope.getTopWorldY();
        const bottomY      = this.currentRope.getBottomWorldY();
    
        // 取得玩家目前世界 Y
        const playerWorldPos = this.node.parent
            ? this.node.parent.convertToWorldSpaceAR(cc.v2(this.node.x, this.node.y))
            : cc.v2(this.node.x, this.node.y);
    
        // 上下移動
        let velY = 0;
        if (this.keyStates[cc.macro.KEY.w] || this.keyStates[cc.macro.KEY.up]) {
            velY = climbSpeed;
        } else if (this.keyStates[cc.macro.KEY.s] || this.keyStates[cc.macro.KEY.down]) {
            velY = -climbSpeed;
        }
    
        // 左右微移
        let velX = this.moveDir.x * driftSpeed;
        if (this.bodyNode && this.moveDir.x !== 0) {
            this.bodyNode.scaleX = this.moveDir.x > 0 ? 1 : -1;
        }

        this.rb.linearVelocity = cc.v2(velX, velY);

        // ★ 檢查水平偏移是否超過閾值
        const ropeWorldX = this.currentRope.getCenterWorldX();
        const playerWorldX = this.node.parent
            ? this.node.parent.convertToWorldSpaceAR(cc.v2(this.node.x, this.node.y)).x
            : this.node.x;
        const offsetX = Math.abs(playerWorldX - ropeWorldX);

        if (offsetX > this.climbFallOffDistance) {
            cc.log(`[PlayerController] 水平偏移 ${offsetX.toFixed(0)}px，從藤蔓掉落`);
            this.exitClimb(false);
            return;
        }
    
        // 頂端邊界：到頂自動離開
        if (playerWorldPos.y >= topY && velY > 0) {
            // 先看 nearbyRope 有沒有更高的藤蔓可以接
            if (this.nearbyRope && this.nearbyRope !== this.currentRope) {
                cc.log('[PlayerController] 切換到下一段藤蔓');
                this.isClimbing = false;
                this.currentRope = null;
                this.enterClimb(this.nearbyRope);
                return;
            }
            cc.log('[PlayerController] 到達藤蔓頂端，自動離開');
            this.exitClimb(false);
            return;
        }
    
        // 底端邊界：到底停住（不自動離開，讓玩家自己走開）
        if (playerWorldPos.y <= bottomY && velY < 0) {
            velY = 0;
            cc.log('[PlayerController] 到達藤蔓底端');
        }
    
        this.rb.linearVelocity = cc.v2(velX, velY);
    
        // 爬行動畫：有移動才播，靜止就 Idle
        if (velY !== 0 || velX !== 0) {
            this.playAnimation('PlayerClimb');
        } else {
            this.playAnimation('PlayerIdle');
        }
    }

    public heal(amount: number): number {
        if (this.isDead) {
            return 0;
        }

        if (amount <= 0) {
            return 0;
        }

        if (this.currentHp >= this.maxHp) {
            cc.log(`[PlayerController] HP is already full (${this.currentHp}/${this.maxHp}), heal skipped.`);
            return 0;
        }

        const beforeHp = this.currentHp;

        this.currentHp += amount;
        if (this.currentHp > this.maxHp) {
            this.currentHp = this.maxHp;
        }

        const healedAmount = this.currentHp - beforeHp;

        if (healedAmount <= 0) {
            return 0;
        }

        cc.log(`[PlayerController] Heal +${healedAmount}, HP: ${this.currentHp}/${this.maxHp}`);
        EventCenter.emit(GameEvent.PLAYER_HP_CHANGED, this.currentHp, this.maxHp);

        AudioManager.play(SfxType.HEAL);

        return healedAmount;
    }

    public addAttackBuff(amount: number, duration: number = 60) {
        if (this.isDead) return;
        this.attackDamage += amount;
        this.activeBuffs.push({ type: 'attack', amount: amount, timer: duration });
        cc.log(`[PlayerController] 獲得 Buff: 攻擊力 +${amount}，持續 ${duration} 秒`);
    }

    public addDefenseBuff(amount: number, duration: number = 60) {
        if (this.isDead) return;
        this.defense += amount;
        this.activeBuffs.push({ type: 'defense', amount: amount, timer: duration });
        cc.log(`[PlayerController] 獲得 Buff: 防禦力 +${amount}，持續 ${duration} 秒`);
    }

    public takeDamage(damage: number) {
        if (this.isDead) return;
        cc.log(`🛡️ [玩家受傷] 經過護甲抵擋後，實際扣除血量: ${damage}`);
        super.takeDamage(damage);
    }
}

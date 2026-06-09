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
import UIManager from "../UI/UIManager";
import AudioManager, { SfxType } from "../Core/AudioManager";
import EffectsManager, { EffectType } from "../Core/EffectsManager";
import InputManager from "../Input/InputManager";
import { InputAction, InputPayload } from "../Input/InputAction";
import { InputContext } from "../Input/InputContext";

const { ccclass, property } = cc._decorator;

// Crafting and inventory visibility are coordinated through their actual node state.
@ccclass
export default class PlayerController extends BaseEntity {

    @property(cc.Float)
    moveSpeed: number = 200;

    @property(cc.Float)
    jumpForce: number = 500;

    @property(cc.Float)
    oceanMoveSpeed: number = 90;

    @property(cc.Float)
    oceanVerticalSpeed: number = 120;

    @property(cc.Float)
    oceanGravityScale: number = 0.15;

    @property(cc.Node)
    inventoryUI: cc.Node = null!;

    @property(cc.Float)
    attackDamage: number = 20;

    @property(CombatHitbox)
    attackHitbox: CombatHitbox = null!;

    @property(DialogueUIController)
    dialogueUI: DialogueUIController = null!;

    @property(MerchantShopUIController)
    merchantShopUI: MerchantShopUIController = null!;

    @property(CraftingUIController)
    craftingUI: CraftingUIController = null;

    @property(UIManager)
    uiManager: UIManager = null;

    @property({ type: cc.Float, range: [0, 1, 0.05], slide: true })
    knockbackResistance: number = 0;

    @property(cc.Float)
    knockbackLockTime: number = 0.12;

    private moveDir: cc.Vec2 = cc.v2(0, 0);
    private keyStates: { [action: string]: boolean } = {};

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
    private currentDialogueOptions: DialogueOption[] = [];
    private knockbackTimer: number = 0;
    private gameOverTransitionPending: boolean = false;
    private inputLockedByGamePause: boolean = false;

    private isInOcean: boolean = false;
    private originalGravityScale: number = 1;
    private inputManager: InputManager = null;

    onLoad() {
        super.onLoad();
        this.type = EntityType.PLAYER;

        const physicsManager = cc.director.getPhysicsManager();
        physicsManager.enabled = true;
        physicsManager.debugDrawFlags = 1;

        cc.systemEvent.on("CRAFTING_UI_OPENED", this.onCraftingUIOpened, this);
        cc.systemEvent.on("CRAFTING_UI_CLOSED", this.onCraftingUIClosed, this);
        cc.systemEvent.on("DIALOGUE_OPTION_CONFIRMED", this.onDialogueOptionConfirmed, this);
        EventCenter.on(GameEvent.GAME_PAUSED, this.onGamePaused, this);
        EventCenter.on(GameEvent.GAME_RESUMED, this.onGameResumed, this);
        this.inputManager = InputManager.getOrCreate(this.node);
        if (this.inputManager) {
            this.inputManager.pushContext(InputContext.Gameplay, this.handleGameplayInput, this);
        }

        this.canvasNode = cc.find("Canvas") || null!;

        this.bodyNode = this.node.getChildByName("Sprite_Body") || null!;
        if (this.bodyNode) {
            this.anim = this.bodyNode.getComponent(cc.Animation) || null!;
            if (this.anim) {
                this.anim.on("finished", this.onAnimFinished, this);
            }
        }

        this.currentHp = this.maxHp;
        this.rb = this.getComponent(cc.RigidBody) || null!;

        if (this.rb) {
            this.originalGravityScale = (this.rb as any).gravityScale || 1;
        }

        if (!this.uiManager) {
            const uiRoot = cc.find("Canvas/UI Root");
            this.uiManager = uiRoot ? uiRoot.getComponent(UIManager) : null;
        }

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

    private handleGameplayInput(payload: InputPayload): boolean {
        if (this.inputLockedByGamePause) {
            return this.isPlayerAction(payload.action);
        }

        switch (payload.action) {
            case InputAction.MoveLeft:
            case InputAction.MoveRight:
            case InputAction.MoveUp:
            case InputAction.MoveDown:
            case InputAction.NavigateUp:
            case InputAction.NavigateDown:
            case InputAction.Jump:
                this.setMoveInput(payload.action, payload.isDown);
                return true;
            case InputAction.Attack:
                if (payload.isDown) this.attack();
                return true;
            case InputAction.Interact:
                if (payload.isDown) this.interact();
                return true;
            case InputAction.Inventory:
                if (payload.isDown) this.toggleInventory();
                return true;
            case InputAction.Crafting:
                if (payload.isDown) this.toggleCrafting();
                return true;
            case InputAction.DebugAddCoconut:
                if (payload.isDown) this.debugAddCoconut();
                return true;
            case InputAction.DebugAddCraftItems:
                if (payload.isDown) this.debugAddCraftItems();
                return true;
            default:
                return false;
        }
    }

    private handleInventoryInput(payload: InputPayload): boolean {
        if (!payload.isDown) {
            return this.isPlayerAction(payload.action);
        }

        if (payload.action === InputAction.Inventory || payload.action === InputAction.Cancel) {
            this.setInventoryOpen(false);
            return true;
        }

        return this.isPlayerAction(payload.action) || payload.action === InputAction.Attack;
    }

    private handleDialogueInput(payload: InputPayload): boolean {
        if (!payload.isDown) {
            return true;
        }

        switch (payload.action) {
            case InputAction.Cancel:
                this.closeMerchantFlow();
                return true;
            case InputAction.MoveUp:
            case InputAction.NavigateUp:
                this.dialogueUI.selectPrev();
                return true;
            case InputAction.MoveDown:
            case InputAction.NavigateDown:
                this.dialogueUI.selectNext();
                return true;
            case InputAction.Confirm:
            case InputAction.Interact:
                this.confirmDialogueOption();
                return true;
            default:
                return true;
        }
    }

    private handleMerchantShopInput(payload: InputPayload): boolean {
        if (!payload.isDown) {
            return true;
        }

        if (payload.action === InputAction.Cancel) {
            this.closeMerchantFlow();
            return true;
        }

        if (this.merchantShopUI && this.merchantShopUI.handleInput(payload.action)) {
            return true;
        }

        return true;
    }

    public setMoveInput(action: InputAction, isDown: boolean): void {
        const moveAction = this.toMoveAction(action);
        if (!moveAction) {
            return;
        }

        const wasDown = !!this.keyStates[moveAction];
        if (wasDown === isDown) {
            return;
        }

        this.keyStates[moveAction] = isDown;
        if (moveAction === InputAction.Jump && isDown) {
            this.jump();
        }
        this.refreshMoveDirection();
    }

    private toMoveAction(action: InputAction): InputAction {
        switch (action) {
            case InputAction.MoveLeft:
            case InputAction.MoveRight:
            case InputAction.MoveUp:
            case InputAction.MoveDown:
            case InputAction.Jump:
                return action;
            case InputAction.NavigateUp:
                return InputAction.MoveUp;
            case InputAction.NavigateDown:
                return InputAction.MoveDown;
            default:
                return null;
        }
    }

    private isPlayerAction(action: InputAction): boolean {
        return !!this.toMoveAction(action)
            || action === InputAction.Attack
            || action === InputAction.Interact
            || action === InputAction.Inventory
            || action === InputAction.Crafting
            || action === InputAction.DebugAddCoconut
            || action === InputAction.DebugAddCraftItems;
    }

    public interact(): void {
        this.tryInteractWithMerchant();
    }

    public debugAddCoconut(): void {
        InventoryManager.instance.addItem("coconut", 10);
    }

    public debugAddCraftItems(): void {
        InventoryManager.instance.transact([], [
            { itemId: "coconut", count: 10 },
            { itemId: "ore", count: 10 },
            { itemId: "apple", count: 10 }
        ]);
        cc.log("[CraftingDebug] Added coconut, ore and apple x10.");
    }

    private tryInteractWithMerchant() {
        if (this.isDead) {
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
        if (!merchant || !merchant.canInteract(this.node)) {
            cc.log("[PlayerController] No merchant in interaction range.");
            return;
        }

        this.currentMerchant = merchant;
        merchant.beginInteraction(this.node);
        this.showMerchantOptions();
    }

    public toggleInventory() {
        if (!this.inventoryUI) return;

        if (this.isCraftingUIOpen()) {
            if (!this.craftingUI.close()) {
                return;
            }
            this.setInventoryOpen(true);
            if (this.rb) {
                this.rb.linearVelocity = cc.v2(0, this.rb.linearVelocity.y);
            }
            return;
        }

        const shouldOpen = !this.inventoryUI.active;
        if (shouldOpen) {
            if (this.isMerchantUIOpen()) {
                return;
            }
        }

        this.setInventoryOpen(shouldOpen);
        if (this.inventoryUI.active && this.dialogueUI && !this.isMerchantUIOpen()) {
            this.dialogueUI.hide();
            this.promptMerchant = null!;
        }

        if (this.inventoryUI.active && this.rb) {
            this.rb.linearVelocity = cc.v2(0, this.rb.linearVelocity.y);
        }
    }

    private setInventoryOpen(open: boolean): void {
        if (!this.inventoryUI) {
            return;
        }

        this.inventoryUI.active = open;
        this.clearMovementInput();
        if (this.inputManager) {
            if (open) {
                this.inputManager.pushContext(InputContext.Inventory, this.handleInventoryInput, this);
            } else {
                this.inputManager.popContext(InputContext.Inventory, this);
            }
        }
    }

    public jump() {
        if (this.isDead || this.isHurting || this.isAttacking || this.isCraftingUIOpen() || !this.rb) return;

        if (this.isInOcean) {
            this.rb.linearVelocity = cc.v2(this.rb.linearVelocity.x, this.oceanVerticalSpeed);
            return;
        }

        if (Math.abs(this.rb.linearVelocity.y) <= 0.1) {
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
            ? this.node.parent.convertToWorldSpaceAR(this.node.position)
            : this.node.position;

        for (const merchant of merchants) {
            if (!merchant || !cc.isValid(merchant.node)) {
                continue;
            }

            const merchantWorldPos = merchant.node.parent
                ? merchant.node.parent.convertToWorldSpaceAR(merchant.node.position)
                : merchant.node.position;

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

    update(dt: number) {
        if (this.inputLockedByGamePause) return;

        if (this.currentMerchant && !cc.isValid(this.currentMerchant.node)) {
            this.closeMerchantFlow();
        }

        this.updateMerchantPrompt();
        this.knockbackTimer = Math.max(0, this.knockbackTimer - dt);

        if (this.inventoryUI && this.inventoryUI.active) return;
        if (this.isCraftingUIOpen()) return;
        if (this.isMerchantUIOpen()) return;

        if (this.isDead || this.isHurting || this.isAttacking || !this.rb) return;
        if (this.knockbackTimer > 0) return;

        if (this.isInOcean) {
            this.updateOceanMovement();
            return;
        }

        const isMovingX = this.moveDir.x !== 0;

        const targetSpeedX = this.moveDir.x * this.moveSpeed * 0.8;
        this.rb.linearVelocity = cc.v2(targetSpeedX, this.rb.linearVelocity.y);

        if (isMovingX) {
            if (this.bodyNode) {
                this.bodyNode.scaleX = this.moveDir.x > 0 ? 1 : -1;
            }

            if (Math.abs(this.rb.linearVelocity.y) <= 0.1) {
                this.playAnimation("PlayerRun");
            }
        } else {
            if (Math.abs(this.rb.linearVelocity.y) <= 0.1) {
                this.playAnimation("PlayerIdle");
            }
        }
    }

    public enterOceanArea() {
        if (this.isInOcean) {
            return;
        }

        this.isInOcean = true;
        EffectsManager.play(EffectType.WATER, this.getWorldPosition());

        if (this.rb) {
            this.originalGravityScale = (this.rb as any).gravityScale || 1;
            (this.rb as any).gravityScale = this.oceanGravityScale;
            this.rb.linearVelocity = cc.v2(this.rb.linearVelocity.x * 0.5, this.rb.linearVelocity.y * 0.3);
        }
    }

    public exitOceanArea() {
        if (!this.isInOcean) {
            return;
        }

        this.isInOcean = false;

        if (this.rb) {
            (this.rb as any).gravityScale = this.originalGravityScale;
        }
    }

    private updateOceanMovement() {
        if (!this.rb) {
            return;
        }

        const horizontalInput = this.moveDir.x;
        const verticalInput = this.getOceanVerticalInput();

        const velocityX = horizontalInput * this.oceanMoveSpeed;
        const velocityY = verticalInput * this.oceanVerticalSpeed;

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

    private getOceanVerticalInput(): number {
        let input = 0;

        if (
            this.keyStates[InputAction.MoveUp]
            || this.keyStates[InputAction.Jump]
        ) {
            input += 1;
        }

        if (this.keyStates[InputAction.MoveDown]) {
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

    private playAnimation(animName: string) {
        if (!this.anim) return;
        if (this.currentAnimName === animName) return;

        this.anim.play(animName);
        this.currentAnimName = animName;
    }

    public attack() {
        if (
            this.inputLockedByGamePause
            || this.isAttacking
            || this.isHurting
            || this.isMerchantUIOpen()
            || this.isCraftingUIOpen()
            || (this.inventoryUI && this.inventoryUI.active)
        ) return;

        this.isAttacking = true;
        AudioManager.play(SfxType.ATTACK);
        this.playAnimation("PlayerAttack");

        if (this.attackHitbox) {
            const facingRight = !this.bodyNode || this.bodyNode.scaleX >= 0;
            this.attackHitbox.activate(facingRight, this.attackDamage, this.node);
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
            ? this.node.parent.convertToWorldSpaceAR(this.node.position)
            : this.node.position;

        const attackerWorldPos = attackerNode.parent
            ? attackerNode.parent.convertToWorldSpaceAR(attackerNode.position)
            : attackerNode.position;

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
        AudioManager.play(SfxType.HIT);
        EffectsManager.play(EffectType.HIT, this.getWorldPosition());
        EventCenter.emit(GameEvent.PLAYER_HP_CHANGED, this.currentHp, this.maxHp);
        this.playAnimation("PlayerHurt");
    }

    protected die() {
        if (this.isDead) return;

        this.isDead = true;
        this.isHurting = false;
        this.isAttacking = false;
        this.closeMerchantFlow();
        this.closeCrafting();
        EventCenter.emit(GameEvent.PLAYER_HP_CHANGED, 0, this.maxHp);
        this.playAnimation("PlayerDie");
    }

    private onAnimFinished(event: string, state: cc.AnimationState) {
        if (state.name === "PlayerAttack") {
            this.isAttacking = false;
            this.currentAnimName = "";
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
        cc.director.loadScene("GameOver");
    };

    private getWorldPosition(): cc.Vec2 {
        return this.node.parent
            ? this.node.parent.convertToWorldSpaceAR(this.node.position)
            : this.node.position;
    }

    onDestroy() {
        this.closeCrafting();

        this.unscheduleAllCallbacks();
        cc.systemEvent.off("CRAFTING_UI_OPENED", this.onCraftingUIOpened, this);
        cc.systemEvent.off("CRAFTING_UI_CLOSED", this.onCraftingUIClosed, this);
        cc.systemEvent.off("DIALOGUE_OPTION_CONFIRMED", this.onDialogueOptionConfirmed, this);
        EventCenter.off(GameEvent.GAME_PAUSED, this.onGamePaused, this);
        EventCenter.off(GameEvent.GAME_RESUMED, this.onGameResumed, this);
        if (this.inputManager) {
            this.inputManager.clearOwner(this);
        }

        if (this.anim && cc.isValid(this.anim)) {
            this.anim.off("finished", this.onAnimFinished, this);
        }

        this.dialogueUI = null!;
        this.merchantShopUI = null!;
        this.currentMerchant = null!;
        this.promptMerchant = null!;
        this.currentDialogueOptions = [];
        this.craftingUI = null;
        this.uiManager = null;
        this.inputManager = null;
    }

    private updateMerchantPrompt() {
        if (
            !this.dialogueUI
            || this.isDead
            || this.isMerchantUIOpen()
            || this.isCraftingUIOpen()
            || (this.inventoryUI && this.inventoryUI.active)
        ) {
            if (this.dialogueUI) {
                this.dialogueUI.hidePrompt();
            }
            this.promptMerchant = null;
            return;
        }

        if (this.dialogueUI.isOptionsVisible()) {
            return;
        }

        const merchant = this.findNearestMerchant();
        if (merchant && merchant.canInteract(this.node)) {
            this.promptMerchant = merchant;
            this.dialogueUI.showPrompt("Press F to Talk", merchant.node);
            return;
        }

        this.promptMerchant = null!;
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
            if (this.inputManager) {
                this.inputManager.popContext(InputContext.Dialogue, this);
            }

            if (this.merchantShopUI) {
                this.merchantShopUI.open(this.currentMerchant);
                this.clearMovementInput();
                if (this.inputManager) {
                    this.inputManager.pushContext(
                        InputContext.MerchantShop,
                        this.handleMerchantShopInput,
                        this
                    );
                }
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
        if (this.inputManager) {
            this.inputManager.popContext(InputContext.MerchantShop, this);
            this.inputManager.popContext(InputContext.Dialogue, this);
        }

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
        this.clearMovementInput();
    }

    private isMerchantUIOpen(): boolean {
        return !!(
            (this.dialogueUI && this.dialogueUI.isOptionsVisible()) ||
            (this.merchantShopUI && this.merchantShopUI.isOpen())
        );
    }

    public toggleCrafting(): void {
        if (!this.craftingUI) {
            const host = cc.find("Canvas/UI Root/CraftingUIHost");
            this.craftingUI = host ? host.getComponent(CraftingUIController) : null;
        }
        if (!this.craftingUI) {
            cc.warn("[PlayerController] CraftingUIController was not found.");
            return;
        }

        if (this.craftingUI.isOpen()) {
            this.closeCrafting();
            return;
        }

        if (this.isDead || this.isMerchantUIOpen()) {
            return;
        }
        if (!this.craftingUI.open()) {
            return;
        }

        this.clearMovementInput();
    }

    private closeCrafting(): void {
        if (this.craftingUI && this.craftingUI.isOpen()) {
            if (!this.craftingUI.close()) {
                return;
            }
        }
        this.clearMovementInput();
    }

    private isCraftingUIOpen(): boolean {
        return !!this.craftingUI && this.craftingUI.isOpen();
    }

    private refreshMoveDirection(): void {
        const left = this.keyStates[InputAction.MoveLeft] ? 1 : 0;
        const right = this.keyStates[InputAction.MoveRight] ? 1 : 0;
        this.moveDir.x = this.isCraftingUIOpen() ? 0 : right - left;
    }

    private onCraftingUIClosed(): void {
        this.clearMovementInput();
    }

    private onCraftingUIOpened(): void {
        this.clearMovementInput();
    }

    private onGamePaused(): void {
        this.inputLockedByGamePause = true;
        this.clearMovementInput();
    }

    private onGameResumed(): void {
        this.inputLockedByGamePause = false;
        this.clearMovementInput();
    }

    private clearMovementInput(): void {
        this.keyStates = {};
        this.moveDir.x = 0;
        if (this.rb) {
            this.rb.linearVelocity = cc.v2(0, this.rb.linearVelocity.y);
        }
    }

    private onDialogueOptionConfirmed(index: number): void {
        if (!this.dialogueUI || !this.dialogueUI.isOptionsVisible()) {
            return;
        }
        this.dialogueUI.selectOption(index);
        this.confirmDialogueOption();
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
        this.clearMovementInput();
        if (this.inputManager) {
            this.inputManager.pushContext(InputContext.Dialogue, this.handleDialogueInput, this);
        }
    }
}

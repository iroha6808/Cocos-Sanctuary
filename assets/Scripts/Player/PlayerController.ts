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
    private keyStates: { [key: number]: boolean } = {};

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

    private isInOcean: boolean = false;
    private originalGravityScale: number = 1;

    onLoad() {
        super.onLoad();
        this.type = EntityType.PLAYER;

        const physicsManager = cc.director.getPhysicsManager();
        physicsManager.enabled = true;
        physicsManager.debugDrawFlags = 1;

        cc.systemEvent.on("CRAFTING_UI_OPENED", this.onCraftingUIOpened, this);
        cc.systemEvent.on("CRAFTING_UI_CLOSED", this.onCraftingUIClosed, this);
        cc.systemEvent.on("DIALOGUE_OPTION_CONFIRMED", this.onDialogueOptionConfirmed, this);

        this.canvasNode = cc.find("Canvas") || null!;
        if (this.canvasNode) {
            this.canvasNode.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
            this.canvasNode.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        }

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

    private onMouseDown(event: cc.Event.EventMouse) {
        if (this.isDead || this.isMerchantUIOpen() || this.isCraftingUIOpen()) return;
        if (this.inventoryUI && this.inventoryUI.active) return;

        if (event.getButton() === cc.Event.EventMouse.BUTTON_LEFT) {
            this.attack();
        }
    }

    public handleGameKeyDown(keyCode: number): boolean {
        return this.applyMoveKey(keyCode, true);
    }

    public handleGameKeyUp(keyCode: number): boolean {
        return this.applyMoveKey(keyCode, false);
    }

    private applyMoveKey(keyCode: number, isDown: boolean): boolean {
        if (keyCode === cc.macro.KEY.escape) {
            if (!isDown) {
                return false;
            }

            if (this.isCraftingUIOpen()) {
                this.moveDir.x = 0;
                return true;
            }

            return this.handleMerchantUIKey(keyCode);
        }

        if (isDown && this.handleMerchantUIKey(keyCode)) {
            return true;
        }

        if (!this.isPlayerControlKey(keyCode)) {
            return false;
        }

        const wasDown = !!this.keyStates[keyCode];
        if (wasDown === isDown) return false;

        this.keyStates[keyCode] = isDown;

        if (this.isCraftingUIOpen()) {
            this.moveDir.x = 0;
            return true;
        }

        switch (keyCode) {
            case cc.macro.KEY.a:
            case cc.macro.KEY.d:
                this.refreshMoveDirection();
                return true;
            case cc.macro.KEY.space:
                if (isDown) this.jump();
                return true;

            case cc.macro.KEY.b:
                if (isDown) this.toggleInventory();
                return true;

            case cc.macro.KEY.f:
                if (isDown) this.tryInteractWithMerchant();
                return true;

            case cc.macro.KEY.t:
                if (isDown) {
                    InventoryManager.instance.addItem("coconut", 10);
                }
                return true;
            case cc.macro.KEY.y:
                if (isDown) {
                    InventoryManager.instance.transact([], [
                        { itemId: "coconut", count: 10 },
                        { itemId: "ore", count: 10 },
                        { itemId: "apple", count: 10 }
                    ]);
                    cc.log("[CraftingDebug] Added coconut, ore and apple x10.");
                }
                return true;
            default:
                return false;
        }
    }

    private isPlayerControlKey(keyCode: number): boolean {
        switch (keyCode) {
            case cc.macro.KEY.a:
            case cc.macro.KEY.d:
            case cc.macro.KEY.w:
            case cc.macro.KEY.s:
            case cc.macro.KEY.up:
            case cc.macro.KEY.down:
            case cc.macro.KEY.space:
            case cc.macro.KEY.b:
            case cc.macro.KEY.f:
            case cc.macro.KEY.t:
            case cc.macro.KEY.y:
                return true;
            default:
                return false;
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

    private toggleInventory() {
        if (!this.inventoryUI) return;

        if (this.isCraftingUIOpen()) {
            if (!this.craftingUI.close()) {
                return;
            }
            this.inventoryUI.active = true;
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

        this.inventoryUI.active = shouldOpen;
        if (this.inventoryUI.active && this.dialogueUI && !this.isMerchantUIOpen()) {
            this.dialogueUI.hide();
            this.promptMerchant = null!;
        }

        if (this.inventoryUI.active && this.rb) {
            this.rb.linearVelocity = cc.v2(0, this.rb.linearVelocity.y);
        }
    }

    private jump() {
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

        if (this.keyStates[cc.macro.KEY.w] || this.keyStates[cc.macro.KEY.up] || this.keyStates[cc.macro.KEY.space]) {
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

    private playAnimation(animName: string) {
        if (!this.anim) return;
        if (this.currentAnimName === animName) return;

        this.anim.play(animName);
        this.currentAnimName = animName;
    }

    private attack() {
        if (this.isAttacking || this.isHurting || this.isCraftingUIOpen()) return;

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

        if (this.canvasNode && cc.isValid(this.canvasNode)) {
            this.canvasNode.off(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
            this.canvasNode.off(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
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

    private isMerchantUIOpen(): boolean {
        return !!(
            (this.dialogueUI && this.dialogueUI.isOptionsVisible()) ||
            (this.merchantShopUI && this.merchantShopUI.isOpen())
        );
    }

    private toggleCrafting(): void {
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

        this.moveDir.x = 0;
        if (this.rb) {
            this.rb.linearVelocity = cc.v2(0, this.rb.linearVelocity.y);
        }
    }

    private closeCrafting(): void {
        if (this.craftingUI && this.craftingUI.isOpen()) {
            if (!this.craftingUI.close()) {
                return;
            }
        }
        this.refreshMoveDirection();
    }

    private isCraftingUIOpen(): boolean {
        return !!this.craftingUI && this.craftingUI.isOpen();
    }

    private refreshMoveDirection(): void {
        const left = this.keyStates[cc.macro.KEY.a] ? 1 : 0;
        const right = this.keyStates[cc.macro.KEY.d] ? 1 : 0;
        this.moveDir.x = this.isCraftingUIOpen() ? 0 : right - left;
    }

    private onCraftingUIClosed(): void {
        this.refreshMoveDirection();
    }

    private onCraftingUIOpened(): void {
        this.moveDir.x = 0;
        if (this.rb) {
            this.rb.linearVelocity = cc.v2(0, this.rb.linearVelocity.y);
        }
    }

    private handleMerchantUIKey(keyCode: number): boolean {
        const dialogueOpen = !!this.dialogueUI && this.dialogueUI.isOptionsVisible();
        const shopOpen = !!this.merchantShopUI && this.merchantShopUI.isOpen();
        if (!dialogueOpen && !shopOpen) {
            return false;
        }

        if (keyCode === cc.macro.KEY.escape) {
            this.closeMerchantFlow();
            return true;
        }

        if (dialogueOpen) {
            switch (keyCode) {
                case cc.macro.KEY.w:
                case cc.macro.KEY.up:
                    this.dialogueUI.selectPrev();
                    return true;
                case cc.macro.KEY.s:
                case cc.macro.KEY.down:
                    this.dialogueUI.selectNext();
                    return true;
                case cc.macro.KEY.enter:
                case cc.macro.KEY.f:
                    this.confirmDialogueOption();
                    return true;
                default:
                    return false;
            }
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

            case cc.macro.KEY.left:
                this.merchantShopUI.decreaseAmount();
                return true;

            case cc.macro.KEY.right:
                this.merchantShopUI.increaseAmount();
                return true;

            case cc.macro.KEY.enter:
            case cc.macro.KEY.f:
                this.merchantShopUI.buySelected();
                return true;

            default:
                return false;
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
    }
}

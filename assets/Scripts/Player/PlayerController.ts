import BaseEntity from "../Core/BaseEntity";
import EventCenter from "../Core/EventCenter"; 
import { GameEvent, EntityType } from "../Core/Constants";
import CombatHitbox, { CombatFaction, CombatHitInfo } from "../Attack/CombatHitbox";
import { InventoryManager } from "./InventoryManager";
import MerchantNPC from "../NPC/MerchantNPC";
import { DialogueContent, DialogueOption, DialogueOptionId } from "../NPC/NPCDialogue";
import DialogueUIController from "../UI/DialogueUIController";
import MerchantShopUIController from "../UI/MerchantShopUIController";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerController extends BaseEntity {

    @property(cc.Float)
    moveSpeed: number = 200;

    @property(cc.Float)
    jumpForce: number = 500;

    @property(cc.Node)
    inventoryUI: cc.Node = null; 

    @property(cc.Float)
    attackDamage: number = 20;

    @property(CombatHitbox)
    attackHitbox: CombatHitbox = null;

    @property(DialogueUIController)
    dialogueUI: DialogueUIController = null;

    @property(MerchantShopUIController)
    merchantShopUI: MerchantShopUIController = null;

    @property({ type: cc.Float, range: [0, 1, 0.05], slide: true })
    knockbackResistance: number = 0;

    @property(cc.Float)
    knockbackLockTime: number = 0.12;

    private moveDir: cc.Vec2 = cc.v2(0, 0);
    private keyStates: { [key: number]: boolean } = {};
    
    private anim: cc.Animation = null;
    private currentAnimName: string = "";
    private bodyNode: cc.Node = null;
    private rb: cc.RigidBody = null;

    private isAttacking: boolean = false;
    private isHurting: boolean = false;
    private isDead: boolean = false;
    private canvasNode: cc.Node = null;
    private currentMerchant: MerchantNPC = null;
    private promptMerchant: MerchantNPC = null;
    private currentDialogueOptions: DialogueOption[] = [];
    private knockbackTimer: number = 0;
    private gameOverTransitionPending: boolean = false;

    onLoad() {
        super.onLoad(); 
        this.type = EntityType.PLAYER;

        let physicsManager = cc.director.getPhysicsManager();
        physicsManager.enabled = true;
        physicsManager.debugDrawFlags = 1; 

        // for drawing debug box
        // physicsManager.debugDrawFlags = 1; 

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        this.canvasNode = cc.find("Canvas");
        if (this.canvasNode) {
            this.canvasNode.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
            this.canvasNode.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        }

        this.bodyNode = this.node.getChildByName("Sprite_Body");
        if (this.bodyNode) {
            this.anim = this.bodyNode.getComponent(cc.Animation);
            if (this.anim) {
                this.anim.on('finished', this.onAnimFinished, this);
            }
        }
        
        this.currentHp = this.maxHp; 
        this.rb = this.getComponent(cc.RigidBody); 

        if (!this.attackHitbox) {
            const hitboxNode = this.node.getChildByName("AttackHitbox");
            this.attackHitbox = hitboxNode ? hitboxNode.getComponent(CombatHitbox) : null;
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
        if (this.isDead || this.isMerchantUIOpen()) return;
        if (this.inventoryUI && this.inventoryUI.active) return; 

        if (event.getButton() === cc.Event.EventMouse.BUTTON_LEFT) {
            this.attack();
        } 
        /*else if (event.getButton() === cc.Event.EventMouse.BUTTON_RIGHT) {
            this.takeDamage(20); 
        }*/
    }

    onKeyDown(event: cc.Event.EventKeyboard) {
        this.applyMoveKey(event.keyCode, true);
    }

    onKeyUp(event: cc.Event.EventKeyboard) {
        this.applyMoveKey(event.keyCode, false);
    }

    private applyMoveKey(keyCode: number, isDown: boolean) {
        const wasDown = !!this.keyStates[keyCode];
        if (wasDown === isDown) return;

        this.keyStates[keyCode] = isDown;
        if (isDown && this.handleMerchantShopKey(keyCode)) {
            return;
        }

        const amount = isDown ? 1 : -1;

        switch (keyCode) {
            case cc.macro.KEY.a: this.moveDir.x -= amount; break;
            case cc.macro.KEY.d: this.moveDir.x += amount; break;
            case cc.macro.KEY.space: 
                if (isDown) this.jump();
                break;
            case cc.macro.KEY.b:
                if (isDown) this.toggleInventory();
                break;
            case cc.macro.KEY.f:
                if (isDown) this.tryInteractWithMerchant();
                break;
            case cc.macro.KEY.t:
                if (isDown) {
                    InventoryManager.instance.addItem("coconut", 10);
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
        this.inventoryUI.active = !this.inventoryUI.active;
        if (this.inventoryUI.active && this.dialogueUI && !this.isMerchantUIOpen()) {
            this.dialogueUI.hide();
            this.promptMerchant = null;
        }
        if (this.inventoryUI.active && this.rb) {
            this.rb.linearVelocity = cc.v2(0, this.rb.linearVelocity.y);
        }
    }

    private jump() {
        if (this.isDead || this.isHurting || this.isAttacking || !this.rb) return;
        
        if (Math.abs(this.rb.linearVelocity.y) <= 0.1) {
            this.rb.linearVelocity = cc.v2(this.rb.linearVelocity.x, this.jumpForce);
        }
    }

    public receiveAttack(amount: number, attackerNode: cc.Node = null, hitInfo?: CombatHitInfo) {
        if (this.isDead) {
            return;
        }

        this.applyKnockback(attackerNode, hitInfo);
        this.takeDamage(amount);
    }

    private findNearestMerchant(): MerchantNPC {
        const root = this.canvasNode || cc.find("Canvas");
        const merchants: MerchantNPC[] = [];
        this.collectMerchants(root, merchants);

        let nearest: MerchantNPC = null;
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
        if (this.isMerchantUIOpen()) return;

        if (this.isDead || this.isHurting || this.isAttacking || !this.rb) return;
        if (this.knockbackTimer > 0) return;

        let isMovingX = this.moveDir.x !== 0;

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

    private playAnimation(animName: string) {
        if (!this.anim) return;
        if (this.currentAnimName === animName) return;

        this.anim.play(animName);
        this.currentAnimName = animName;
    }

    private attack() {
        if (this.isAttacking || this.isHurting) return;

        this.isAttacking = true;
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
        EventCenter.emit(GameEvent.PLAYER_HP_CHANGED, this.currentHp, this.maxHp);
        this.playAnimation("PlayerHurt");
    }

    protected die() {
        if (this.isDead) return;

        this.isDead = true;
        this.isHurting = false;
        this.isAttacking = false;
        this.closeMerchantFlow();
        EventCenter.emit(GameEvent.PLAYER_HP_CHANGED, 0, this.maxHp);
        this.playAnimation("PlayerDie");
    }

    private onAnimFinished(event: string, state: cc.AnimationState) {
        if (state.name === "PlayerAttack") {
            this.isAttacking = false;
            this.currentAnimName = ""; 
        } 
        else if (state.name === "PlayerHurt") {
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

    onDestroy() {
        this.unscheduleAllCallbacks();
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        if (this.canvasNode && cc.isValid(this.canvasNode)) {
            this.canvasNode.off(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
            this.canvasNode.off(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        }

        if (this.anim && cc.isValid(this.anim)) {
            this.anim.off("finished", this.onAnimFinished, this);
        }

        this.dialogueUI = null;
        this.merchantShopUI = null;
        this.currentMerchant = null;
        this.promptMerchant = null;
        this.currentDialogueOptions = [];
    }

    private updateMerchantPrompt() {
        if (!this.dialogueUI || this.isDead || this.isMerchantUIOpen()) {
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

        this.promptMerchant = null;
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

        this.currentMerchant = null;
        this.promptMerchant = null;
        this.currentDialogueOptions = [];
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
            case cc.macro.KEY.up:
                this.merchantShopUI.selectPrevItem();
                return true;
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
                this.merchantShopUI.buySelected();
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
}

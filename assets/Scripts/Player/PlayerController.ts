import BaseEntity from "../Core/BaseEntity";
import EventCenter from "../Core/EventCenter"; 
import { GameEvent, EntityType } from "../Core/Constants";
import CombatHitbox, { CombatFaction } from "../Attack/CombatHitbox";
import { InventoryManager } from "./InventoryManager";

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
        if (this.isDead) return;

        if (event.getButton() === cc.Event.EventMouse.BUTTON_LEFT) {
            this.attack();
        } 
        else if (event.getButton() === cc.Event.EventMouse.BUTTON_RIGHT) {
            this.takeDamage(20); 
        }
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
            case cc.macro.KEY.t:
                if (isDown) {
                    import("./InventoryManager").then(({ InventoryManager }) => {
                        InventoryManager.instance.addItem("potion", "紅水", 1, "恢復20點生命值");
                    });
                }
                break;
        }
    }

    private toggleInventory() {
        if (!this.inventoryUI) return;
        this.inventoryUI.active = !this.inventoryUI.active;
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

    update(dt: number) {
        if (this.inventoryUI && this.inventoryUI.active) return;

        if (this.isDead || this.isHurting || this.isAttacking || !this.rb) return;

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
            this.scheduleOnce(() => {
                EventCenter.emit(GameEvent.PLAYER_DIED);
                cc.director.loadScene("GameOver"); 
            }, 0);
        }
    }

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        if (this.canvasNode && cc.isValid(this.canvasNode)) {
            this.canvasNode.off(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        }

        if (this.anim && cc.isValid(this.anim)) {
            this.anim.off("finished", this.onAnimFinished, this);
        }
    }
}

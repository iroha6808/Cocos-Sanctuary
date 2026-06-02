import BaseEntity from "../Core/BaseEntity";
import EventCenter from "../Core/EventCenter"; 
import { GameEvent, EntityType } from "../Core/Constants";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerController extends BaseEntity {

    @property(cc.Float)
    moveSpeed: number = 200;

    @property(cc.Float)
    jumpForce: number = 400;

    private moveDir: cc.Vec2 = cc.v2(0, 0);
    private keyStates: { [key: number]: boolean } = {};
    
    private anim: cc.Animation = null;
    private currentAnimName: string = "";
    private bodyNode: cc.Node = null;
    private rb: cc.RigidBody = null;

    private isAttacking: boolean = false;
    private isHurting: boolean = false;
    private isDead: boolean = false;

    onLoad() {
        super.onLoad(); 
        this.type = EntityType.PLAYER;
        let physicsManager = cc.director.getPhysicsManager();
        physicsManager.enabled = true;

        // for drawing debug box
        // physicsManager.debugDrawFlags = 1; 

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        super.onLoad(); 
        this.type = EntityType.PLAYER;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        let canvas = cc.find("Canvas");
        if (canvas) {
            canvas.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
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
        }
    }

    private jump() {
        if (this.isDead || this.isHurting || this.isAttacking || !this.rb) return;
        
        if (Math.abs(this.rb.linearVelocity.y) <= 0.1) {
            this.rb.linearVelocity = cc.v2(this.rb.linearVelocity.x, this.jumpForce);
        }
    }

    update(dt: number) {
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
    }
}
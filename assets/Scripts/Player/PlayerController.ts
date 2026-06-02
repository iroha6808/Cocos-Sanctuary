import BaseEntity from "../Core/BaseEntity";
import EventCenter from "../Core/EventCenter"; 
import { GameEvent, EntityType } from "../Core/Constants";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerController extends BaseEntity {

    @property(cc.Float)
    moveSpeed: number = 200;

    private moveDir: cc.Vec2 = cc.v2(0, 0);
    private keyStates: { [key: number]: boolean } = {};
    
    private anim: cc.Animation = null;
    private currentAnimName: string = "";
    private bodyNode: cc.Node = null;
    private rb: cc.RigidBody = null;

    onLoad() {
        super.onLoad(); 
        this.type = EntityType.PLAYER;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        this.bodyNode = this.node.getChildByName("Sprite_Body");
        if (this.bodyNode) {
            this.anim = this.bodyNode.getComponent(cc.Animation);
        }
        this.rb = this.getComponent(cc.RigidBody);
        if (!this.rb) {
            cc.warn("PlayerController: 找不到 RigidBody！請確認 Player node 上有掛 RigidBody 元件");
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
        if (wasDown === isDown) {
            return;
        }

        this.keyStates[keyCode] = isDown;
        const amount = isDown ? 1 : -1;

        switch (keyCode) {
            case cc.macro.KEY.w:
                this.moveDir.y += amount;
                break;
            case cc.macro.KEY.s:
                this.moveDir.y -= amount;
                break;
            case cc.macro.KEY.a:
                this.moveDir.x -= amount;
                break;
            case cc.macro.KEY.d:
                this.moveDir.x += amount;
                break;
        }
    }

    update(dt: number) {
        let isMoving = this.moveDir.x !== 0 || this.moveDir.y !== 0;
        if (!this.rb) return;  
        if (isMoving) {
            // let velocity = this.moveDir.clone().normalize().mul(this.moveSpeed * dt);
            // this.node.x += velocity.x;
            // this.node.y += velocity.y;

            // if (this.moveDir.x !== 0 && this.bodyNode) {
            //     this.bodyNode.scaleX = this.moveDir.x > 0 ? 1 : -1;
            // }
            const speed = this.moveDir.clone().normalize().mul(this.moveSpeed * 0.8);
            this.rb.linearVelocity = speed;

            if (this.moveDir.x !== 0 && this.bodyNode) {
                this.bodyNode.scaleX = this.moveDir.x > 0 ? 1 : -1;
            }

            this.playAnimation("PlayerRun"); 
        } else {
            this.rb.linearVelocity = cc.v2(0, 0);
            this.playAnimation("PlayerIdle");
        }
    }

    private playAnimation(animName: string) {
        if (!this.anim) return;
        
        if (this.currentAnimName === animName) return;

        this.anim.play(animName);
        this.currentAnimName = animName;
    }

    // TODO: other functions like mining or attacking

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }
}

import BaseEntity from "../Core/BaseEntity";
import EventCenter from "../Core/EventCenter"; // 注意這裡改為 Default Import
import { GameEvent, EntityType } from "../Core/Constants";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerController extends BaseEntity {

    @property(cc.Float)
    moveSpeed: number = 200;

    private moveDir: cc.Vec2 = cc.v2(0, 0);
    private exp: number = 0;
    private level: number = 1;

    onLoad() {
        super.onLoad(); 
        this.type = EntityType.PLAYER;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown(event: cc.Event.EventKeyboard) {
        switch (event.keyCode) {
            case cc.macro.KEY.w: this.moveDir.y = 1; break;
            case cc.macro.KEY.s: this.moveDir.y = -1; break;
            case cc.macro.KEY.a: this.moveDir.x = -1; break;
            case cc.macro.KEY.d: this.moveDir.x = 1; break;
        }
    }

    onKeyUp(event: cc.Event.EventKeyboard) {
        switch (event.keyCode) {
            case cc.macro.KEY.w:
            case cc.macro.KEY.s: this.moveDir.y = 0; break;
            case cc.macro.KEY.a:
            case cc.macro.KEY.d: this.moveDir.x = 0; break;
        }
    }

    update(dt: number) {
        if (this.moveDir.x !== 0 || this.moveDir.y !== 0) {
            let velocity = this.moveDir.normalize().mul(this.moveSpeed * dt);
            this.node.x += velocity.x;
            this.node.y += velocity.y;
        }
    }

    public gainExp(amount: number) {
        this.exp += amount;
        EventCenter.emit(GameEvent.PLAYER_EXP_CHANGED, this.exp);
        
        if (this.exp > 1000 && this.level === 1) {
            this.evolveToUltimate();
        }
    }

    private evolveToUltimate() {
        this.level = 2;
        this.moveSpeed += 100;
        console.log("進化！最終型態：朱宏國！ - PlayerController.ts:63");
    }

    protected onDamaged() {
        EventCenter.emit(GameEvent.PLAYER_HP_CHANGED, this.currentHp, this.maxHp);
    }

    protected die() {
        EventCenter.emit(GameEvent.PLAYER_DIED);
        this.node.active = false; 
    }
}
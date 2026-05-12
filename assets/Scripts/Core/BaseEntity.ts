import { EntityType } from "./Constants";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BaseEntity extends cc.Component {
    
    @property({ type: cc.Enum(EntityType) })
    public type: EntityType = EntityType.NPC_PEACE;

    @property(cc.Float)
    public maxHp: number = 100;
    
    public currentHp: number = 100;

    onLoad() {
        this.currentHp = this.maxHp;
    }

    public takeDamage(amount: number) {
        this.currentHp -= amount;
        this.onDamaged();

        if (this.currentHp <= 0) {
            this.die();
        }
    }

    protected onDamaged() {
        // 給子類 Override 用
    }

    protected die() {
        // 給子類 Override 用
        this.node.destroy();
    }
}
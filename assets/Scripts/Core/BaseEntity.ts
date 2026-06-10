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
        if (amount <= 0 || this.currentHp <= 0) {
            return;
        }

        this.currentHp = Math.max(0, this.currentHp - amount);
        this.onDamaged();

        if (this.currentHp <= 0) {
            this.die();
        }
    }

    public heal(amount: number): number {
        if (amount <= 0 || this.currentHp <= 0) {
            return 0;
        }

        const before = this.currentHp;
        this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
        return this.currentHp - before;
    }

    protected onDamaged() {
        // 給子類 Override 用
    }

    protected die() {
        // 給子類 Override 用
        this.node.destroy();
    }
}

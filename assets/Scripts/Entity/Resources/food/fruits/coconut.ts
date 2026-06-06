const { ccclass, property } = cc._decorator;
import FoodBase from '../FoodBase';
// import DropState from '../../DropItem';
import { getItemDefinition } from "../../../../Data/ItemData";

// export enum ItemState {
//     Flying = 0,
//     Resting = 1,
//     Attracting = 2,
//     Held = 3,
// }

// export enum ItemMode{
//     Object = 0, // 物件模式：純物理，不可吸附，不可撿起
//     Drop = 1, // 掉落物模式：可被吸附、收進背包
// }

@ccclass
export default class Coconut extends FoodBase {
    // @property({ tooltip: '為世界唯一交易貨幣' }) cashValue: number = 1;

    itemName: string = "coconut"; 
    onLoad() {
        super.onLoad();
        cc.log(`[Coconut] onLoad → ${this.foodName || this.itemName}, rottenTime=${this.rottenTime}`);
        const def = getItemDefinition("coconut");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
            if (def.rottenTime !== undefined) this.rottenTime = def.rottenTime;
        }
    }
}
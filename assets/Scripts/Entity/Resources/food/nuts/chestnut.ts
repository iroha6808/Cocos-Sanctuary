const { ccclass, property } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class Chestnut extends FoodBase {
    itemName: string = "chestnut"; 
    onLoad() {
        super.onLoad();
        cc.log(`[chestnut] onLoad → ${this.foodName || this.itemName}, rottenTime=${this.rottenTime}`);
        const def = getItemDefinition("chestnut");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
            if (def.rottenTime !== undefined) this.rottenTime = def.rottenTime;
        }
    }
}
const { ccclass, property } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class kiwi extends FoodBase {
    itemName: string = "kiwi"; 
    onLoad() {
        super.onLoad();
        cc.log(`[kiwi] onLoad → ${this.foodName || this.itemName}, rottenTime=${this.rottenTime}`);
        const def = getItemDefinition("kiwi");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
            if (def.rottenTime !== undefined) this.rottenTime = def.rottenTime;
        }
    }
}
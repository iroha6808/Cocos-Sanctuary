const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class midas_oil extends FoodBase {
    itemName: string = "midas_oil"; 
    onLoad() {
        super.onLoad();
        cc.log(`[midas_oil] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("midas_oil");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

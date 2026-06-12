const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class regrowth_fertilizer extends FoodBase {
    itemName: string = "regrowth_fertilizer"; 
    onLoad() {
        super.onLoad();
        cc.log(`[regrowth_fertilizer] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("regrowth_fertilizer");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

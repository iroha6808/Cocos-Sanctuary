const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class roasted_chestnut extends FoodBase {
    itemName: string = "roasted_chestnut"; 
    onLoad() {
        super.onLoad();
        cc.log(`[roasted_chestnut] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("roasted_chestnut");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

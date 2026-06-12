const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class tropical_smoothie extends FoodBase {
    itemName: string = "tropical_smoothie"; 
    onLoad() {
        super.onLoad();
        cc.log(`[tropical_smoothie] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("tropical_smoothie");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

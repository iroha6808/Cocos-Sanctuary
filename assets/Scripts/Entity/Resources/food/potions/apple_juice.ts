const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class apple_juice extends FoodBase {
    itemName: string = "apple_juice"; 
    onLoad() {
        super.onLoad();
        cc.log(`[apple_juice] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("apple_juice");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

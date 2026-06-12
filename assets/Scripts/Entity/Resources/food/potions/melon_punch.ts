const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class melon_punch extends FoodBase {
    itemName: string = "melon_punch"; 
    onLoad() {
        super.onLoad();
        cc.log(`[melon_punch] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("melon_punch");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

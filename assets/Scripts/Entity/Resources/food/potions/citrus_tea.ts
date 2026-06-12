const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class citrus_tea extends FoodBase {
    itemName: string = "citrus_tea"; 
    onLoad() {
        super.onLoad();
        cc.log(`[citrus_tea] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("citrus_tea");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

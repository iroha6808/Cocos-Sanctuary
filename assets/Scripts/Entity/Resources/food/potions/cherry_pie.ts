const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class cherry_pie extends FoodBase {
    itemName: string = "cherry_pie"; 
    onLoad() {
        super.onLoad();
        cc.log(`[cherry_pie] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("cherry_pie");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

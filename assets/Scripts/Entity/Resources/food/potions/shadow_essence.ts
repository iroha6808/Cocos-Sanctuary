const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class shadow_essence extends FoodBase {
    itemName: string = "shadow_essence"; 
    onLoad() {
        super.onLoad();
        cc.log(`[shadow_essence] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("shadow_essence");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

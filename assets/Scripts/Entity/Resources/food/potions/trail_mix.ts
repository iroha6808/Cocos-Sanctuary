const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class trail_mix extends FoodBase {
    itemName: string = "trail_mix"; 
    onLoad() {
        super.onLoad();
        cc.log(`[trail_mix] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("trail_mix");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

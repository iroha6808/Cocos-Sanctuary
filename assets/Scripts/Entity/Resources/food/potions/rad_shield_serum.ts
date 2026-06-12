const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class rad_shield_serum extends FoodBase {
    itemName: string = "rad_shield_serum"; 
    onLoad() {
        super.onLoad();
        cc.log(`[rad_shield_serum] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("rad_shield_serum");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

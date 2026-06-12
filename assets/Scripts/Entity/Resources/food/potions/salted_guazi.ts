const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class salted_guazi extends FoodBase {
    itemName: string = "salted_guazi"; 
    onLoad() {
        super.onLoad();
        cc.log(`[salted_guazi] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("salted_guazi");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

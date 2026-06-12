const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class mana_soup extends FoodBase {
    itemName: string = "mana_soup"; 
    onLoad() {
        super.onLoad();
        cc.log(`[mana_soup] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("mana_soup");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

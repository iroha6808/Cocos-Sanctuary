const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class durian_stew extends FoodBase {
    itemName: string = "durian_stew"; 
    onLoad() {
        super.onLoad();
        cc.log(`[durian_stew] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("durian_stew");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

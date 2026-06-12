const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class baked_orange extends FoodBase {
    itemName: string = "baked_orange"; 
    onLoad() {
        super.onLoad();
        cc.log(`[baked_orange] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("baked_orange");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

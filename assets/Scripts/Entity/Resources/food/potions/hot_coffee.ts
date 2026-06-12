const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class hot_coffee extends FoodBase {
    itemName: string = "hot_coffee"; 
    onLoad() {
        super.onLoad();
        cc.log(`[hot_coffee] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("hot_coffee");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

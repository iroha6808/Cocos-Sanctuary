const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class avocado_toast extends FoodBase {
    itemName: string = "avocado_toast"; 
    onLoad() {
        super.onLoad();
        cc.log(`[avocado_toast] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("avocado_toast");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

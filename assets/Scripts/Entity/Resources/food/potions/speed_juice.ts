const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class speed_juice extends FoodBase {
    itemName: string = "speed_juice"; 
    onLoad() {
        super.onLoad();
        cc.log(`[speed_juice] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("speed_juice");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

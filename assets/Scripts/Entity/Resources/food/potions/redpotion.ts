const { ccclass, property } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class RedPotion extends FoodBase {
    itemName: string = "redpotion"; 
    onLoad() {
        super.onLoad();
        cc.log(`[redpotion] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("redpotion");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}
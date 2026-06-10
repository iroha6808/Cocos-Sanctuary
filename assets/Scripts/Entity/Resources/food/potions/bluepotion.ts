const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class BluePotion extends FoodBase {
    itemName: string = "bluepotion"; 
    onLoad() {
        super.onLoad();
        cc.log(`[bluepotion] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("bluepotion");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}
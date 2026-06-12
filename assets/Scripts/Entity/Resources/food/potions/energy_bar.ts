const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class energy_bar extends FoodBase {
    itemName: string = "energy_bar"; 
    onLoad() {
        super.onLoad();
        cc.log(`[energy_bar] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("energy_bar");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class antidote_potion extends FoodBase {
    itemName: string = "antidote_potion"; 
    onLoad() {
        super.onLoad();
        cc.log(`[antidote_potion] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("antidote_potion");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

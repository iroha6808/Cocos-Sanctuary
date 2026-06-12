const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class berserk_brew extends FoodBase {
    itemName: string = "berserk_brew"; 
    onLoad() {
        super.onLoad();
        cc.log(`[berserk_brew] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("berserk_brew");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

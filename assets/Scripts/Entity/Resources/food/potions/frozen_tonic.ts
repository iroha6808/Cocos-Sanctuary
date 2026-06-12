const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class frozen_tonic extends FoodBase {
    itemName: string = "frozen_tonic"; 
    onLoad() {
        super.onLoad();
        cc.log(`[frozen_tonic] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("frozen_tonic");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

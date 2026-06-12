const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class grape_wine extends FoodBase {
    itemName: string = "grape_wine"; 
    onLoad() {
        super.onLoad();
        cc.log(`[grape_wine] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("grape_wine");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

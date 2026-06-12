const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class strawberry_sundae extends FoodBase {
    itemName: string = "strawberry_sundae"; 
    onLoad() {
        super.onLoad();
        cc.log(`[strawberry_sundae] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("strawberry_sundae");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

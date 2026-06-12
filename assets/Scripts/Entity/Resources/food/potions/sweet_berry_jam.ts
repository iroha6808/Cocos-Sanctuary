const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class sweet_berry_jam extends FoodBase {
    itemName: string = "sweet_berry_jam"; 
    onLoad() {
        super.onLoad();
        cc.log(`[sweet_berry_jam] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("sweet_berry_jam");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

const { ccclass } = cc._decorator;
import FoodBase from '../FoodBase';
import { getItemDefinition } from "../../../../Data/ItemData";

@ccclass
export default class starlight_elixir extends FoodBase {
    itemName: string = "starlight_elixir"; 
    onLoad() {
        super.onLoad();
        cc.log(`[starlight_elixir] onLoad → ${this.foodName || this.itemName}`);
        const def = getItemDefinition("starlight_elixir");
        if (def) {
            this.foodName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.hpRestore !== undefined) this.hpRestore = def.hpRestore;
            if (def.staminaRestore !== undefined) this.staminaRestore = def.staminaRestore;
        }
    }
}

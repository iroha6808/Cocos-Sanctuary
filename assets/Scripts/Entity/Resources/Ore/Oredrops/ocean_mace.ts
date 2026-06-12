const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class ocean_mace extends Orebase {
    itemName: string = 'ocean_mace';
    onLoad() {
        super.onLoad();
        cc.log(`[ocean_mace] onLoad → ${this.itemName}`);
        const def = getItemDefinition("ocean_mace");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

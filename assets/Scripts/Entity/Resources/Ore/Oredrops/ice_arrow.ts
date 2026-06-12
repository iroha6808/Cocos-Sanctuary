const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class ice_arrow extends Orebase {
    itemName: string = 'ice_arrow';
    onLoad() {
        super.onLoad();
        cc.log(`[ice_arrow] onLoad → ${this.itemName}`);
        const def = getItemDefinition("ice_arrow");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

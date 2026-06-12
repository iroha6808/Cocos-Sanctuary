const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class ice_ring extends Orebase {
    itemName: string = 'ice_ring';
    onLoad() {
        super.onLoad();
        cc.log(`[ice_ring] onLoad → ${this.itemName}`);
        const def = getItemDefinition("ice_ring");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

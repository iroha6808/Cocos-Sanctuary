const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class radiation_ring extends Orebase {
    itemName: string = 'radiation_ring';
    onLoad() {
        super.onLoad();
        cc.log(`[radiation_ring] onLoad → ${this.itemName}`);
        const def = getItemDefinition("radiation_ring");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

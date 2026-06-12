const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class gilded_breastplate extends Orebase {
    itemName: string = 'gilded_breastplate';
    onLoad() {
        super.onLoad();
        cc.log(`[gilded_breastplate] onLoad → ${this.itemName}`);
        const def = getItemDefinition("gilded_breastplate");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

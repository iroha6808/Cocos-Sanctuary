const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class display_stand extends Orebase {
    itemName: string = 'display_stand';
    onLoad() {
        super.onLoad();
        cc.log(`[display_stand] onLoad → ${this.itemName}`);
        const def = getItemDefinition("display_stand");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

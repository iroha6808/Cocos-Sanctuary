const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class haste_talisman extends Orebase {
    itemName: string = 'haste_talisman';
    onLoad() {
        super.onLoad();
        cc.log(`[haste_talisman] onLoad → ${this.itemName}`);
        const def = getItemDefinition("haste_talisman");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

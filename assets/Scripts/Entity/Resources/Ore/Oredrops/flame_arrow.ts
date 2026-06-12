const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class flame_arrow extends Orebase {
    itemName: string = 'flame_arrow';
    onLoad() {
        super.onLoad();
        cc.log(`[flame_arrow] onLoad → ${this.itemName}`);
        const def = getItemDefinition("flame_arrow");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

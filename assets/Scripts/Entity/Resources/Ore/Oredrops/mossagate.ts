const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class MossAgate extends Orebase {
    itemName: string = 'mossagate';
    onLoad() {
        super.onLoad();
        const def = getItemDefinition("mossagate");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
        cc.log(`[Moss Agate] onLoad → ${this.oreName || this.itemName}`);
    }
}
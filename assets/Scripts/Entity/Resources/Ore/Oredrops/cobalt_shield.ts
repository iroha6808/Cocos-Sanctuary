const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class cobalt_shield extends Orebase {
    itemName: string = 'cobalt_shield';
    onLoad() {
        super.onLoad();
        cc.log(`[cobalt_shield] onLoad → ${this.itemName}`);
        const def = getItemDefinition("cobalt_shield");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

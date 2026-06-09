const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class CobaltOre extends Orebase {
    itemName: string = 'cobaltore';
    onLoad() {
        super.onLoad();
        cc.log(`[Cobalt ore] onLoad → ${this.oreName || this.itemName}`);
        const def = getItemDefinition("cobaltore");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}
const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class cobalt_axe extends Orebase {
    itemName: string = 'cobalt_axe';
    onLoad() {
        super.onLoad();
        cc.log(`[cobalt_axe] onLoad → ${this.itemName}`);
        const def = getItemDefinition("cobalt_axe");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

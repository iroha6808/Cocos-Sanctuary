const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class copper_helmet extends Orebase {
    itemName: string = 'copper_helmet';
    onLoad() {
        super.onLoad();
        cc.log(`[copper_helmet] onLoad → ${this.itemName}`);
        const def = getItemDefinition("copper_helmet");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

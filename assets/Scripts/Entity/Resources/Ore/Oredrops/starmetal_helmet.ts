const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class starmetal_helmet extends Orebase {
    itemName: string = 'starmetal_helmet';
    onLoad() {
        super.onLoad();
        cc.log(`[starmetal_helmet] onLoad → ${this.itemName}`);
        const def = getItemDefinition("starmetal_helmet");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

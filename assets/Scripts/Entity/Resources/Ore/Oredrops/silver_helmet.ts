const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class silver_helmet extends Orebase {
    itemName: string = 'silver_helmet';
    onLoad() {
        super.onLoad();
        cc.log(`[silver_helmet] onLoad → ${this.itemName}`);
        const def = getItemDefinition("silver_helmet");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

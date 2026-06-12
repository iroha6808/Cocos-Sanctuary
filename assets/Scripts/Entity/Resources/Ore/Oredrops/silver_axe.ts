const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class silver_axe extends Orebase {
    itemName: string = 'silver_axe';
    onLoad() {
        super.onLoad();
        cc.log(`[silver_axe] onLoad → ${this.itemName}`);
        const def = getItemDefinition("silver_axe");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

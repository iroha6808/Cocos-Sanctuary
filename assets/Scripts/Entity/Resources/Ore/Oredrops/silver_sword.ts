const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class silver_sword extends Orebase {
    itemName: string = 'silver_sword';
    onLoad() {
        super.onLoad();
        cc.log(`[silver_sword] onLoad → ${this.itemName}`);
        const def = getItemDefinition("silver_sword");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

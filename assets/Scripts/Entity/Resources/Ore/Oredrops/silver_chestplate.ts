const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class silver_chestplate extends Orebase {
    itemName: string = 'silver_chestplate';
    onLoad() {
        super.onLoad();
        cc.log(`[silver_chestplate] onLoad → ${this.itemName}`);
        const def = getItemDefinition("silver_chestplate");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

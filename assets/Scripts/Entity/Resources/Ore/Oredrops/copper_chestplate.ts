const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class copper_chestplate extends Orebase {
    itemName: string = 'copper_chestplate';
    onLoad() {
        super.onLoad();
        cc.log(`[copper_chestplate] onLoad → ${this.itemName}`);
        const def = getItemDefinition("copper_chestplate");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

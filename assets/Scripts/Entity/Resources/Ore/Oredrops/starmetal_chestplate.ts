const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class starmetal_chestplate extends Orebase {
    itemName: string = 'starmetal_chestplate';
    onLoad() {
        super.onLoad();
        cc.log(`[starmetal_chestplate] onLoad → ${this.itemName}`);
        const def = getItemDefinition("starmetal_chestplate");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

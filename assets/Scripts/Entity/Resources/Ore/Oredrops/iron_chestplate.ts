const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class iron_chestplate extends Orebase {
    itemName: string = 'iron_chestplate';
    onLoad() {
        super.onLoad();
        cc.log(`[iron_chestplate] onLoad → ${this.itemName}`);
        const def = getItemDefinition("iron_chestplate");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

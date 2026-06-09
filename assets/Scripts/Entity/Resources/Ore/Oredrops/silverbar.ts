const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class SilverBar extends Orebase {
    itemName: string = 'silverbar';
    onLoad() {
        super.onLoad();
        const def = getItemDefinition("silverbar");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
        cc.log(`[Silver Bar] onLoad → ${this.oreName || this.itemName}`);
    }
}
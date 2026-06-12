const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class gold_axe extends Orebase {
    itemName: string = 'gold_axe';
    onLoad() {
        super.onLoad();
        cc.log(`[gold_axe] onLoad → ${this.itemName}`);
        const def = getItemDefinition("gold_axe");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

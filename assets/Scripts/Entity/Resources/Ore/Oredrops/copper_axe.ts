const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class copper_axe extends Orebase {
    itemName: string = 'copper_axe';
    onLoad() {
        super.onLoad();
        cc.log(`[copper_axe] onLoad → ${this.itemName}`);
        const def = getItemDefinition("copper_axe");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

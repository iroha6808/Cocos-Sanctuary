const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class starmetal_axe extends Orebase {
    itemName: string = 'starmetal_axe';
    onLoad() {
        super.onLoad();
        cc.log(`[starmetal_axe] onLoad → ${this.itemName}`);
        const def = getItemDefinition("starmetal_axe");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

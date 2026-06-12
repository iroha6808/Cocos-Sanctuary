const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class starmetal_sword extends Orebase {
    itemName: string = 'starmetal_sword';
    onLoad() {
        super.onLoad();
        cc.log(`[starmetal_sword] onLoad → ${this.itemName}`);
        const def = getItemDefinition("starmetal_sword");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

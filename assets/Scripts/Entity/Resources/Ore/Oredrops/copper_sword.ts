const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class copper_sword extends Orebase {
    itemName: string = 'copper_sword';
    onLoad() {
        super.onLoad();
        cc.log(`[copper_sword] onLoad → ${this.itemName}`);
        const def = getItemDefinition("copper_sword");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

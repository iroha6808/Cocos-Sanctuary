const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class wayfinder_compass extends Orebase {
    itemName: string = 'wayfinder_compass';
    onLoad() {
        super.onLoad();
        cc.log(`[wayfinder_compass] onLoad → ${this.itemName}`);
        const def = getItemDefinition("wayfinder_compass");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

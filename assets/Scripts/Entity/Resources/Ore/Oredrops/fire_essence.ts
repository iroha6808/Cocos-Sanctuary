const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class fire_essence extends Orebase {
    itemName: string = 'fire_essence';
    onLoad() {
        super.onLoad();
        cc.log(`[fire_essence] onLoad → ${this.itemName}`);
        const def = getItemDefinition("fire_essence");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

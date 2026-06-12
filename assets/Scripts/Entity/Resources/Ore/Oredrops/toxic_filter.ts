const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class toxic_filter extends Orebase {
    itemName: string = 'toxic_filter';
    onLoad() {
        super.onLoad();
        cc.log(`[toxic_filter] onLoad → ${this.itemName}`);
        const def = getItemDefinition("toxic_filter");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

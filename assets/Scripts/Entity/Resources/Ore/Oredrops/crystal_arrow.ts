const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class crystal_arrow extends Orebase {
    itemName: string = 'crystal_arrow';
    onLoad() {
        super.onLoad();
        cc.log(`[crystal_arrow] onLoad → ${this.itemName}`);
        const def = getItemDefinition("crystal_arrow");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

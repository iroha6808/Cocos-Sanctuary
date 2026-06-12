const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class void_hoe extends Orebase {
    itemName: string = 'void_hoe';
    onLoad() {
        super.onLoad();
        cc.log(`[void_hoe] onLoad → ${this.itemName}`);
        const def = getItemDefinition("void_hoe");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

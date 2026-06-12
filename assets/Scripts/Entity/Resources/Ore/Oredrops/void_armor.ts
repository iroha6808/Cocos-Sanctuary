const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class void_armor extends Orebase {
    itemName: string = 'void_armor';
    onLoad() {
        super.onLoad();
        cc.log(`[void_armor] onLoad → ${this.itemName}`);
        const def = getItemDefinition("void_armor");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class nature_staff extends Orebase {
    itemName: string = 'nature_staff';
    onLoad() {
        super.onLoad();
        cc.log(`[nature_staff] onLoad → ${this.itemName}`);
        const def = getItemDefinition("nature_staff");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class frost_spear extends Orebase {
    itemName: string = 'frost_spear';
    onLoad() {
        super.onLoad();
        cc.log(`[frost_spear] onLoad → ${this.itemName}`);
        const def = getItemDefinition("frost_spear");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

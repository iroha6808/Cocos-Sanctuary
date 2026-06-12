const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class alchemy_lab extends Orebase {
    itemName: string = 'alchemy_lab';
    onLoad() {
        super.onLoad();
        cc.log(`[alchemy_lab] onLoad → ${this.itemName}`);
        const def = getItemDefinition("alchemy_lab");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

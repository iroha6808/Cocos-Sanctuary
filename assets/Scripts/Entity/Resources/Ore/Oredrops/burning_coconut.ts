const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class burning_coconut extends Orebase {
    itemName: string = 'burning_coconut';
    onLoad() {
        super.onLoad();
        cc.log(`[burning_coconut] onLoad → ${this.oreName || this.itemName}`);
        const def = getItemDefinition("burning_coconut");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}
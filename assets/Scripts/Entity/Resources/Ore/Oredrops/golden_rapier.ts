const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class golden_rapier extends Orebase {
    itemName: string = 'golden_rapier';
    onLoad() {
        super.onLoad();
        cc.log(`[golden_rapier] onLoad → ${this.itemName}`);
        const def = getItemDefinition("golden_rapier");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

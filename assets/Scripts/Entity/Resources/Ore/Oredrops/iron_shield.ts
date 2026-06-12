const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class iron_shield extends Orebase {
    itemName: string = 'iron_shield';
    onLoad() {
        super.onLoad();
        cc.log(`[iron_shield] onLoad → ${this.itemName}`);
        const def = getItemDefinition("iron_shield");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class iron_sword extends Orebase {
    itemName: string = 'iron_sword';
    onLoad() {
        super.onLoad();
        cc.log(`[iron_sword] onLoad → ${this.itemName}`);
        const def = getItemDefinition("iron_sword");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

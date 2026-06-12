const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class iron_axe extends Orebase {
    itemName: string = 'iron_axe';
    onLoad() {
        super.onLoad();
        cc.log(`[iron_axe] onLoad → ${this.itemName}`);
        const def = getItemDefinition("iron_axe");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

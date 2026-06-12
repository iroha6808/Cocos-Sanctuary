const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class iron_helmet extends Orebase {
    itemName: string = 'iron_helmet';
    onLoad() {
        super.onLoad();
        cc.log(`[iron_helmet] onLoad → ${this.itemName}`);
        const def = getItemDefinition("iron_helmet");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

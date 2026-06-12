const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class cobalt_pickaxe extends Orebase {
    itemName: string = 'cobalt_pickaxe';
    onLoad() {
        super.onLoad();
        cc.log(`[cobalt_pickaxe] onLoad → ${this.itemName}`);
        const def = getItemDefinition("cobalt_pickaxe");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

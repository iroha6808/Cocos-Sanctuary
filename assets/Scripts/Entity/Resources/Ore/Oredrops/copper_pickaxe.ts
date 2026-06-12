const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class copper_pickaxe extends Orebase {
    itemName: string = 'copper_pickaxe';
    onLoad() {
        super.onLoad();
        cc.log(`[copper_pickaxe] onLoad → ${this.itemName}`);
        const def = getItemDefinition("copper_pickaxe");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

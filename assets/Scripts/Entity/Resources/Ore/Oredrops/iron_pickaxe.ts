const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class iron_pickaxe extends Orebase {
    itemName: string = 'iron_pickaxe';
    onLoad() {
        super.onLoad();
        cc.log(`[iron_pickaxe] onLoad → ${this.itemName}`);
        const def = getItemDefinition("iron_pickaxe");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

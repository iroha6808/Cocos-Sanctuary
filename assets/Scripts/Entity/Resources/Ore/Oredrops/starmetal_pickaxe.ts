const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class starmetal_pickaxe extends Orebase {
    itemName: string = 'starmetal_pickaxe';
    onLoad() {
        super.onLoad();
        cc.log(`[starmetal_pickaxe] onLoad → ${this.itemName}`);
        const def = getItemDefinition("starmetal_pickaxe");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

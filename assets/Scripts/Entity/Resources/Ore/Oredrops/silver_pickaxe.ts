const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class silver_pickaxe extends Orebase {
    itemName: string = 'silver_pickaxe';
    onLoad() {
        super.onLoad();
        cc.log(`[silver_pickaxe] onLoad → ${this.itemName}`);
        const def = getItemDefinition("silver_pickaxe");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class IronOre extends Orebase {
    itemName: string = 'ironore';
    onLoad() {
        super.onLoad();
        const def = getItemDefinition("ironore");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
        cc.log(`[Iron Ore] onLoad → ${this.oreName || this.itemName}`);
    }
}
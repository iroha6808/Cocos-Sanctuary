const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class alchemists_hammer extends Orebase {
    itemName: string = 'alchemists_hammer';
    onLoad() {
        super.onLoad();
        cc.log(`[alchemists_hammer] onLoad → ${this.itemName}`);
        const def = getItemDefinition("alchemists_hammer");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

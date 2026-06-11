const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class CitrineGeode extends Orebase {
    itemName: string = 'citrinegeode';
    onLoad() {
        super.onLoad();
        cc.log(`[Citrine Geode] onLoad → ${this.oreName || this.itemName}`);
        const def = getItemDefinition("citrinegeode");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}
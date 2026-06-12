const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class lucky_fishing_rod extends Orebase {
    itemName: string = 'lucky_fishing_rod';
    onLoad() {
        super.onLoad();
        cc.log(`[lucky_fishing_rod] onLoad → ${this.itemName}`);
        const def = getItemDefinition("lucky_fishing_rod");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

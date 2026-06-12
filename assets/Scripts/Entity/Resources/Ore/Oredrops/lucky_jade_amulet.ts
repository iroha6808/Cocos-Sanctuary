const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class lucky_jade_amulet extends Orebase {
    itemName: string = 'lucky_jade_amulet';
    onLoad() {
        super.onLoad();
        cc.log(`[lucky_jade_amulet] onLoad → ${this.itemName}`);
        const def = getItemDefinition("lucky_jade_amulet");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

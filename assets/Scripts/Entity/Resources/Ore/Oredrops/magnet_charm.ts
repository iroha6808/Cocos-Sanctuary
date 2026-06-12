const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class magnet_charm extends Orebase {
    itemName: string = 'magnet_charm';
    onLoad() {
        super.onLoad();
        cc.log(`[magnet_charm] onLoad → ${this.itemName}`);
        const def = getItemDefinition("magnet_charm");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

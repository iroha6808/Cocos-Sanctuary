const { ccclass } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class RawGold extends Orebase {
    itemName: string = 'rawgold';
    onLoad() {
        super.onLoad();
        const def = getItemDefinition("rawgold");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
        cc.log(`[rawgold] onLoad → ${this.oreName || this.itemName}`);
    }
}
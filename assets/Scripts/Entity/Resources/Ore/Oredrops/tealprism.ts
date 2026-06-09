const { ccclass } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class TealPrism extends Orebase {
    itemName: string = 'tealprism';
    onLoad() {
        super.onLoad();
        const def = getItemDefinition("tealprism");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
        cc.log(`[Teal Prism] onLoad → ${this.oreName || this.itemName}`);
    }
}
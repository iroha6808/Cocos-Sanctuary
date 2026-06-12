const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class explorer_goggles extends Orebase {
    itemName: string = 'explorer_goggles';
    onLoad() {
        super.onLoad();
        cc.log(`[explorer_goggles] onLoad → ${this.itemName}`);
        const def = getItemDefinition("explorer_goggles");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

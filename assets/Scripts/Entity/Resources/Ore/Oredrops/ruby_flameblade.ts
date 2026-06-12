const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class ruby_flameblade extends Orebase {
    itemName: string = 'ruby_flameblade';
    onLoad() {
        super.onLoad();
        cc.log(`[ruby_flameblade] onLoad → ${this.itemName}`);
        const def = getItemDefinition("ruby_flameblade");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

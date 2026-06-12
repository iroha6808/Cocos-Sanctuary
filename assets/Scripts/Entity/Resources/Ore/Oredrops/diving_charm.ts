const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class diving_charm extends Orebase {
    itemName: string = 'diving_charm';
    onLoad() {
        super.onLoad();
        cc.log(`[diving_charm] onLoad → ${this.itemName}`);
        const def = getItemDefinition("diving_charm");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class wood extends Orebase {
    itemName: string = 'wood';
    onLoad() {
        super.onLoad();
        cc.log(`[wood] onLoad → ${this.itemName}`);
        const def = getItemDefinition("wood");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

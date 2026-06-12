const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class wood_plank extends Orebase {
    itemName: string = 'wood_plank';
    onLoad() {
        super.onLoad();
        cc.log(`[wood_plank] onLoad → ${this.itemName}`);
        const def = getItemDefinition("wood_plank");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

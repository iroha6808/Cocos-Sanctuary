const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class meteor_bullet extends Orebase {
    itemName: string = 'meteor_bullet';
    onLoad() {
        super.onLoad();
        cc.log(`[meteor_bullet] onLoad → ${this.itemName}`);
        const def = getItemDefinition("meteor_bullet");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

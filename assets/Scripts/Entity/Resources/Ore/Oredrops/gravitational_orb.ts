const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class gravitational_orb extends Orebase {
    itemName: string = 'gravitational_orb';
    onLoad() {
        super.onLoad();
        cc.log(`[gravitational_orb] onLoad → ${this.itemName}`);
        const def = getItemDefinition("gravitational_orb");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

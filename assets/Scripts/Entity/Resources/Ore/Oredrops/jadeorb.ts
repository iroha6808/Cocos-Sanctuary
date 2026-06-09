const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class JadeOrb extends Orebase {
    itemName: string = 'jadeorb';
    onLoad() {
        super.onLoad();
        const def = getItemDefinition("jadeorb");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
        cc.log(`[Jade Orb] onLoad → ${this.oreName || this.itemName}`);
    }
}
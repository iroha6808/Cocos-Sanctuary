const { ccclass } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class VoidNugget extends Orebase {
    itemName: string = 'voidnugget';
    onLoad() {
        super.onLoad();
        const def = getItemDefinition("voidnugget");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
        cc.log(`[Void Nugget] onLoad → ${this.oreName || this.itemName}`);
    }
}
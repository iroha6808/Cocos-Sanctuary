const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class Firestone extends Orebase {
    itemName: string = 'firestone';
    onLoad() {
        super.onLoad();
        cc.log(`[Firestone] onLoad → ${this.oreName || this.itemName}`);
        const def = getItemDefinition("firestone");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}
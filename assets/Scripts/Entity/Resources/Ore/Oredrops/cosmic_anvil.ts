const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class cosmic_anvil extends Orebase {
    itemName: string = 'cosmic_anvil';
    onLoad() {
        super.onLoad();
        cc.log(`[cosmic_anvil] onLoad → ${this.itemName}`);
        const def = getItemDefinition("cosmic_anvil");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

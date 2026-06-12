const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class amethyst_lamp extends Orebase {
    itemName: string = 'amethyst_lamp';
    onLoad() {
        super.onLoad();
        cc.log(`[amethyst_lamp] onLoad → ${this.itemName}`);
        const def = getItemDefinition("amethyst_lamp");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

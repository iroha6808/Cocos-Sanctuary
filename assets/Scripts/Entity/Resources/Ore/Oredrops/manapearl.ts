const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class ManaPearl extends Orebase {
    itemName: string = 'manapearl';
    onLoad() {
        super.onLoad();
        const def = getItemDefinition("manapearl");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
        cc.log(`[Mana Pearl] onLoad → ${this.oreName || this.itemName}`);
    }
}
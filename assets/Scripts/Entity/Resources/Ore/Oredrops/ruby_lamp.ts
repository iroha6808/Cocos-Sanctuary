const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class ruby_lamp extends Orebase {
    itemName: string = 'ruby_lamp';
    onLoad() {
        super.onLoad();
        cc.log(`[ruby_lamp] onLoad → ${this.itemName}`);
        const def = getItemDefinition("ruby_lamp");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

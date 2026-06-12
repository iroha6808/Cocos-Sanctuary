const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class teleporter_core extends Orebase {
    itemName: string = 'teleporter_core';
    onLoad() {
        super.onLoad();
        cc.log(`[teleporter_core] onLoad → ${this.itemName}`);
        const def = getItemDefinition("teleporter_core");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

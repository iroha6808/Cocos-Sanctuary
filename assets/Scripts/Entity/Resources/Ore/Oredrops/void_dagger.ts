const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class void_dagger extends Orebase {
    itemName: string = 'void_dagger';
    onLoad() {
        super.onLoad();
        cc.log(`[void_dagger] onLoad → ${this.itemName}`);
        const def = getItemDefinition("void_dagger");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

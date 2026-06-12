const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class recall_hearthstone extends Orebase {
    itemName: string = 'recall_hearthstone';
    onLoad() {
        super.onLoad();
        cc.log(`[recall_hearthstone] onLoad → ${this.itemName}`);
        const def = getItemDefinition("recall_hearthstone");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

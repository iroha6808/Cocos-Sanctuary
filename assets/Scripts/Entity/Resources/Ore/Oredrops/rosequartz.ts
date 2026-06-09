const { ccclass } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class RoseQuartz extends Orebase {
    itemName: string = 'rosequartz';
    onLoad() {
        super.onLoad();
        const def = getItemDefinition("rosequartz");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
        cc.log(`[Rose Quartz] onLoad → ${this.oreName || this.itemName}`);
    }
}
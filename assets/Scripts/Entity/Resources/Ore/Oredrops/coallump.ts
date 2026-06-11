const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class CoalLump extends Orebase {
    itemName: string = 'coallump';
    onLoad() {
        super.onLoad();
        cc.log(`[Coal Lump] onLoad → ${this.oreName || this.itemName}`);
        const def = getItemDefinition("coallump");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}
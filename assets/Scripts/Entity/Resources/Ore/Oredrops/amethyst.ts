const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class Amethyst extends Orebase {
    itemName: string = 'amethyst';
    onLoad() {
        super.onLoad();
        cc.log(`[Amethyst] onLoad → ${this.oreName || this.itemName}`);
        const def = getItemDefinition("amethyst");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}
const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class RadSlimeChunk extends Orebase {
    itemName: string = 'radslimechunk';
    onLoad() {
        super.onLoad();
        const def = getItemDefinition("radslimechunk");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
        cc.log(`[Rad-Slime Chunk] onLoad → ${this.oreName || this.itemName}`);
    }
}
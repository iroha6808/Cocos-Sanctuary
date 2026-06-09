const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class MeteoriteChunk extends Orebase {
    itemName: string = 'meteoritechunk';
    onLoad() {
        super.onLoad();
        const def = getItemDefinition("meteoritechunk");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
        cc.log(`[Meteorite Chunk] onLoad → ${this.oreName || this.itemName}`);
    }
}
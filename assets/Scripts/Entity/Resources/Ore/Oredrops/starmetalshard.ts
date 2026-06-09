const { ccclass } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class StarMetalShard extends Orebase {
    itemName: string = 'starmetalshard';
    onLoad() {
        super.onLoad();
        const def = getItemDefinition("starmetalshard");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
        cc.log(`[Star Metal Shard] onLoad → ${this.oreName || this.itemName}`);
    }
}
const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class CopperCluster extends Orebase {
    itemName: string = 'coppercluster';
    onLoad() {
        super.onLoad();
        cc.log(`[Copper Cluster] onLoad → ${this.oreName || this.itemName}`);
        const def = getItemDefinition("coppercluster");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}
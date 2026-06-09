const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class CalciteCluster extends Orebase {
    itemName: string = 'calcitecluster';
    onLoad() {
        super.onLoad();
        cc.log(`[Calcite Cluster] onLoad → ${this.oreName || this.itemName}`);
        const def = getItemDefinition("calcitecluster");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}
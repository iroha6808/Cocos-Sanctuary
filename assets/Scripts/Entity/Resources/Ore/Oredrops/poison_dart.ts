const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class poison_dart extends Orebase {
    itemName: string = 'poison_dart';
    onLoad() {
        super.onLoad();
        cc.log(`[poison_dart] onLoad → ${this.itemName}`);
        const def = getItemDefinition("poison_dart");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}

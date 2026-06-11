const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class IceCrystal extends Orebase {
    itemName: string = 'icecrystal';
    onLoad() {
        super.onLoad();
        const def = getItemDefinition("icecrystal");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
        cc.log(`[Ice Crystal] onLoad → ${this.oreName || this.itemName}`);
    }
}
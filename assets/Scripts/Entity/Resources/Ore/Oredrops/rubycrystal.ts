const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class RubyCrystal extends Orebase {
    itemName: string = 'rubycrystal';
    onLoad() {
        super.onLoad();
        const def = getItemDefinition("rubycrystal");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
        cc.log(`[Ruby Crystal] onLoad → ${this.oreName || this.itemName}`);
    }
}
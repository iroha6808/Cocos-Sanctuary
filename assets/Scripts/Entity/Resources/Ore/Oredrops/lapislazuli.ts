const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class LapisLazuli extends Orebase {
    itemName: string = 'lapislazuli';
    onLoad() {
        super.onLoad();
        const def = getItemDefinition("lapislazuli");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
        cc.log(`[Lapis Lazuli] onLoad → ${this.oreName || this.itemName}`);
    }
}
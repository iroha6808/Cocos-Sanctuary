const { ccclass, property } = cc._decorator;
import Orebase from '../orebase';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class AmberSphere extends Orebase {
    itemName: string = 'ambersphere';
    onLoad() {
        super.onLoad();
        cc.log(`[Amber Sphere] onLoad → ${this.itemName}`);
        const def = getItemDefinition("ambersphere");
        if (def) {
            this.oreName = def.name;
            if (def.description !== undefined) this.description = def.description;
        }
    }
}
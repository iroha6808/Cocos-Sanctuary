const { ccclass, property } = cc._decorator;
import DropItem from '../../DropItem';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class starmetal_sword extends DropItem {
    itemName: string = 'starmetal_sword';
    equipName: string = '';
    description: string = '';
    defBoost: number = 0;
    onLoad() {
        super.onLoad();
        cc.log(`[starmetal_sword] onLoad → ${this.itemName}`);
        const def = getItemDefinition("starmetal_sword");
        if (def) {
            this.equipName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.defBoost !== undefined) this.defBoost = def.defBoost;
        }
    }
}

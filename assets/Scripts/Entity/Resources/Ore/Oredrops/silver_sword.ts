const { ccclass, property } = cc._decorator;
import DropItem from '../../DropItem';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class silver_sword extends DropItem {
    itemName: string = 'silver_sword';
    equipName: string = '';
    description: string = '';
    defBoost: number = 0;
    onLoad() {
        super.onLoad();
        cc.log(`[silver_sword] onLoad → ${this.itemName}`);
        const def = getItemDefinition("silver_sword");
        if (def) {
            this.equipName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.defBoost !== undefined) this.defBoost = def.defBoost;
        }
    }
}

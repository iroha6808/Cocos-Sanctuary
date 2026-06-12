const { ccclass, property } = cc._decorator;
import DropItem from '../../DropItem';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class toxic_filter extends DropItem {
    itemName: string = 'toxic_filter';
    equipName: string = '';
    description: string = '';
    defBoost: number = 0;
    onLoad() {
        super.onLoad();
        cc.log(`[toxic_filter] onLoad → ${this.itemName}`);
        const def = getItemDefinition("toxic_filter");
        if (def) {
            this.equipName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.defBoost !== undefined) this.defBoost = def.defBoost;
        }
    }
}

const { ccclass, property } = cc._decorator;
import DropItem from '../../DropItem';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class starmetal_axe extends DropItem {
    itemName: string = 'starmetal_axe';
    equipName: string = '';
    description: string = '';
    defBoost: number = 0;
    onLoad() {
        super.onLoad();
        cc.log(`[starmetal_axe] onLoad → ${this.itemName}`);
        const def = getItemDefinition("starmetal_axe");
        if (def) {
            this.equipName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.defBoost !== undefined) this.defBoost = def.defBoost;
        }
    }
}

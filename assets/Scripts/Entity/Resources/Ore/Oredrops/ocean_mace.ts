const { ccclass, property } = cc._decorator;
import DropItem from '../../DropItem';
import { getItemDefinition } from "../../../../Data/ItemData";
@ccclass
export default class ocean_mace extends DropItem {
    itemName: string = 'ocean_mace';
    equipName: string = '';
    description: string = '';
    defBoost: number = 0;
    onLoad() {
        super.onLoad();
        cc.log(`[ocean_mace] onLoad → ${this.itemName}`);
        const def = getItemDefinition("ocean_mace");
        if (def) {
            this.equipName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.defBoost !== undefined) this.defBoost = def.defBoost;
        }
    }
}

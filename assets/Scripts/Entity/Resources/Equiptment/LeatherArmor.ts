const { ccclass, property } = cc._decorator;
import DropItem from '../DropItem';
import { getItemDefinition } from "../../../Data/ItemData";

@ccclass
export default class leather_armor extends DropItem {
    
    itemName: string = 'leather_armor';
    
    equipName: string = '';
    description: string = '';
    defBoost: number = 0;

    onLoad() {
        super.onLoad();
        cc.log(`[leather_armor] onLoad → ${this.itemName}`);
        
        const def = getItemDefinition(this.itemName);
        if (def) {
            this.equipName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.defBoost !== undefined) this.defBoost = def.defBoost;
        }
    }
}
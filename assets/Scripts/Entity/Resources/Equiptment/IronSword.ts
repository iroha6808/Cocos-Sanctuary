const { ccclass, property } = cc._decorator;
import DropItem from '../DropItem'; 
import { getItemDefinition } from "../../../Data/ItemData"; 

@ccclass
export default class iron_sword extends DropItem {
    
    itemName: string = 'iron_sword';
    equipName: string = '';
    description: string = '';
    attackBoost: number = 0;

    onLoad() {
        super.onLoad();
        cc.log(`[iron_sword] onLoad → ${this.itemName}`);
        
        const def = getItemDefinition(this.itemName);
        if (def) {
            this.equipName = def.name;
            if (def.description !== undefined) this.description = def.description;
            if (def.attackBoost !== undefined) this.attackBoost = def.attackBoost;
        }
    }
}
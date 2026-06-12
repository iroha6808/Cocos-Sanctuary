import { EquipmentSlot } from "../Data/ItemData";
import EventCenter from "../Core/EventCenter";
import { GameEvent } from "../Core/Constants";

export default class EquipmentManager {
    private static instance: EquipmentManager;
    private equipment: { [slot: number]: any } = {
        [EquipmentSlot.WEAPON]: null,
        [EquipmentSlot.ARMOR]: null,
        [EquipmentSlot.ACCESSORY]: null
    };

    public static get Instance(): EquipmentManager {
        if (!this.instance) {
            this.instance = new EquipmentManager();
        }
        return this.instance;
    }

    public getEquipment(slot: EquipmentSlot) {
        return this.equipment[slot];
    }

    public equip(slot: EquipmentSlot, item: any) {
        this.equipment[slot] = item;
        
        cc.log(`[EquipmentManager] 裝備成功: ${item.name} 到槽位 ${slot}`);
        
        EventCenter.emit(GameEvent.EQUIPMENT_UPDATED, { slot, item });
    }

    public unequip(slot: EquipmentSlot) {
        const item = this.equipment[slot];
        if (item) {
            this.equipment[slot] = null;
            EventCenter.emit(GameEvent.EQUIPMENT_UPDATED, { slot, item: null });
        }
    }
}
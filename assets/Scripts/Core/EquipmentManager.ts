import { EquipmentSlot } from "../Data/ItemData";
import EventCenter from "../Core/EventCenter";
import { GameEvent } from "../Core/Constants";

export default class EquipmentManager {
    private static instance: EquipmentManager;
    
    // 儲存目前穿戴的裝備資料
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

    public getTotalAttackBonus(): number {
        let totalAtk = 0;
        for (const key in this.equipment) {
            const item = this.equipment[key];
            if (item&& item.attackBoost !== undefined) {
                totalAtk += item.attackBoost;
            }
        }
        return totalAtk;
    }

    public getTotalDefenseBonus(): number {
        let totalDef = 0;
        for (const key in this.equipment) {
            const item = this.equipment[key];
            if (item && item.defBoost !== undefined) {
                cc.log(`[Debug 裝備防禦] 槽位: ${key}, 物品名稱: ${item.name}`);
                cc.log(`[Debug 裝備防禦] 完整 item 物件內容:`, item);
                cc.log(`[Debug 裝備防禦] item.defBoost 的型態: ${typeof item.defBoost}, 數值: ${item.defBoost}`);
                totalDef += item.defBoost;
            }
        }
        return totalDef;
    }

    public getSaveSnapshot(): any {
        return this.equipment;
    }

    public setEquipmentFromSave(savedEquipment: any) {
        if (savedEquipment) {
            this.equipment = savedEquipment;
        } else {
            this.equipment = {
                [EquipmentSlot.WEAPON]: null,
                [EquipmentSlot.ARMOR]: null,
                [EquipmentSlot.ACCESSORY]: null
            };
        }
        EventCenter.emit(GameEvent.EQUIPMENT_UPDATED);
    }
}
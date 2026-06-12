const { ccclass, property } = cc._decorator;
import { EquipmentSlot } from "../Data/ItemData"; 
import EventCenter from "../Core/EventCenter";
import { GameEvent } from "../Core/Constants";
import EquipmentManager from "../Core/EquipmentManager";

@ccclass
export default class EquipmentUIController extends cc.Component {
    
    @property([cc.Node])
    slots: cc.Node[] = []; 

    onLoad() {
        EventCenter.on(GameEvent.EQUIPMENT_UPDATED, this.refreshUI, this);
    }

    start() {
        this.refreshUI();
    }

    private refreshUI() {
        this.slots.forEach((slotNode, index) => {
            const item = EquipmentManager.Instance.getEquipment(index as EquipmentSlot);
            const iconNode = slotNode.getChildByName("Icon");
            
            if (iconNode) {
                const iconSprite = iconNode.getComponent(cc.Sprite);
                
                if (item && item.iconPath) {
                    iconNode.active = true;
                    const path = item.iconPath.replace(/\.(png|jpg|jpeg)$/i, '');
                    cc.resources.load(path, cc.SpriteFrame, (err, sf) => {
                        if (err) {
                            cc.warn(`[EquipmentUI] 找不到裝備圖片，路徑: ${path}`);
                            return;
                        }
                        iconSprite.spriteFrame = sf as cc.SpriteFrame;
                    });
                } else {
                    iconNode.active = false;
                    iconSprite.spriteFrame = null;
                }
            }
        });
    }

    onDestroy() {
        EventCenter.off(GameEvent.EQUIPMENT_UPDATED, this.refreshUI, this);
    }
}
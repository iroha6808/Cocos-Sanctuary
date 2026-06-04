const { ccclass, property } = cc._decorator;
import { InventoryManager } from "../Player/InventoryManager";

@ccclass
export default class InventoryUIController extends cc.Component {

    @property(cc.Node)
    gridContainer: cc.Node = null!;

    @property(cc.SpriteFrame) coconutIcon: cc.SpriteFrame = null!;
    @property(cc.SpriteFrame) potionIcon: cc.SpriteFrame = null!;
    @property(cc.SpriteFrame) appleIcon: cc.SpriteFrame = null!;
    @property(cc.SpriteFrame) oreIcon: cc.SpriteFrame = null!;
    @property(cc.SpriteFrame) woodIcon: cc.SpriteFrame = null!;

    start() {
        if (this.gridContainer) {
            let slots = this.gridContainer.children;
            for (let i = 0; i < slots.length; i++) {
                slots[i].on(cc.Node.EventType.TOUCH_END, () => {
                    this.onSlotClicked(i);
                });
            }
        }
        this.refreshUI();
    }

    onEnable() {
        this.refreshUI();
    }

    onSlotClicked(index: number) {
        let items = InventoryManager.instance.getItems();
        if (index < items.length) {
            let clickedItem = items[index];
            InventoryManager.instance.removeItem(clickedItem.id, 1);
        }
    }

    refreshUI() {
        if (!this.gridContainer) {
            cc.error("❌ 錯誤：gridContainer 為空，請檢查 UI 節點是否忘記綁定！");
            return;
        }

        let items = InventoryManager.instance.getItems();
        let slots = this.gridContainer.children;
        cc.log(`📊 大腦道具種類: ${items.length} 筆，畫面格子節點數: ${slots.length} 個`);

        for (let i = 0; i < slots.length; i++) {
            let currentSlot = slots[i];
            let iconNode = currentSlot.getChildByName("Icon");
            let labelNode = currentSlot.getChildByName("Label");

            let label: any = null;
            if (labelNode) {
                label = labelNode.getComponent(cc.Label) || labelNode.getComponent("cc.Label");
            }
            let iconSprite = iconNode ? iconNode.getComponent(cc.Sprite) : null;

            if (i < 2) {
                cc.log(`格子[${i}] 節點名: ${currentSlot.name} | Label節點存在: ${!!labelNode} | Label組件存在: ${!!label}`);
            }

            if (i < items.length) {
                let item = items[i];

                if (label) {
                    label.string = item.count.toString();
                }

                if (iconSprite) {
                    iconSprite.node.active = true;
                    switch (item.id) {
                        case "coconut": iconSprite.spriteFrame = this.coconutIcon; break;
                        case "potion": iconSprite.spriteFrame = this.potionIcon; break;
                        case "apple": iconSprite.spriteFrame = this.appleIcon; break;
                        case "ore": iconSprite.spriteFrame = this.oreIcon; break;
                        case "wood": iconSprite.spriteFrame = this.woodIcon; break;
                        default: iconSprite.node.active = false; break;
                    }
                }
            } else {
                if (label) {
                    label.string = "";
                }
                if (iconSprite) {
                    iconSprite.node.active = false;
                }
            }
        }
    }
}
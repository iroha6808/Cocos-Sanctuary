const { ccclass, property } = cc._decorator;
import { InventoryManager } from "../Player/InventoryManager";

@ccclass
export default class InventoryUIController extends cc.Component {

    @property(cc.Node) gridContainer: cc.Node = null!;
    @property(cc.Node) actionMenu: cc.Node = null!;
    @property(cc.SpriteFrame) coconutIcon: cc.SpriteFrame = null!;
    @property(cc.SpriteFrame) potionIcon: cc.SpriteFrame = null!;
    @property(cc.SpriteFrame) appleIcon: cc.SpriteFrame = null!;
    @property(cc.SpriteFrame) oreIcon: cc.SpriteFrame = null!;
    @property(cc.SpriteFrame) woodIcon: cc.SpriteFrame = null!;
    @property(cc.Node) selectionFrame: cc.Node = null!;

    private selectedIndex: number = -1; 

    start() {
        if (this.gridContainer) {
            let slots = this.gridContainer.children;
            for (let i = 0; i < slots.length; i++) {
                slots[i].on(cc.Node.EventType.MOUSE_UP, (event: cc.Event.EventMouse) => {
                    this.onSlotMouseUp(i, event);
                });
            }
        }
        
        this.node.on(cc.Node.EventType.MOUSE_UP, (event: cc.Event.EventMouse) => {
            if (event.getButton() === cc.Event.EventMouse.BUTTON_RIGHT) return;
            cc.log(`[右鍵排查] 點擊背包空白處，觸發自動隱藏`);
            this.hideActionMenu();
        });

        if (this.actionMenu) this.actionMenu.active = false;
        this.refreshUI();
    }

    onEnable() {
        this.refreshUI();
        this.hideActionMenu();
    }

    onSlotMouseUp(index: number, event: cc.Event.EventMouse) {
        let items = InventoryManager.instance.getItems();
        if (index >= items.length) {
            this.hideActionMenu();
            return; 
        }
        event.stopPropagation(); 
        if (event.getButton() === cc.Event.EventMouse.BUTTON_RIGHT) {
            this.showActionMenu(index);
        } else if (event.getButton() === cc.Event.EventMouse.BUTTON_LEFT) {
            this.hideActionMenu();
        }
    }

    showActionMenu(index: number) {
        if (!this.actionMenu) return;
        this.selectedIndex = index;
        let item = InventoryManager.instance.getItems()[index];
        let slotNode = this.gridContainer.children[index];
        if (!slotNode) return;
        let slotWorldPos = slotNode.convertToWorldSpaceAR(cc.Vec2.ZERO);
        let localPos = this.node.convertToNodeSpaceAR(slotWorldPos);
        if (this.selectionFrame) {
            this.selectionFrame.setPosition(localPos);
            this.selectionFrame.active = true;
        }
        let targetX = localPos.x + (slotNode.width / 2);
        let targetY = localPos.y - (slotNode.height / 2);
        this.actionMenu.setPosition(targetX + 2, targetY - 2);
        this.actionMenu.active = true;
    }

    hideActionMenu() {
        if (this.actionMenu) this.actionMenu.active = false;
        if (this.selectionFrame) this.selectionFrame.active = false;
        this.selectedIndex = -1;
    }

    onUseBtnClicked() {
        if (this.selectedIndex === -1) return;
        let item = InventoryManager.instance.getItems()[this.selectedIndex];
        
        cc.log(`[UI] 點擊使用：${item.name}`);
        
        // 這裡可以串接你的吃食物邏輯
        // 例如：FoodBase.eat(player) 或是 InventoryManager.instance.removeItem(item.id, 1);
        InventoryManager.instance.removeItem(item.id, 1); 

        this.hideActionMenu();
    }

    onDeleteBtnClicked() {
        if (this.selectedIndex === -1) return;
        let item = InventoryManager.instance.getItems()[this.selectedIndex];
        
        cc.log(`[UI] 點擊刪除：${item.name}`);
        InventoryManager.instance.removeItem(item.id, 1); // 扣除大腦資料庫 1 個

        this.hideActionMenu();
    }

    refreshUI() {
        if (!this.gridContainer) return;
        let items = InventoryManager.instance.getItems();
        let slots = this.gridContainer.children;

        for (let i = 0; i < slots.length; i++) {
            let currentSlot = slots[i];
            let iconNode = currentSlot.getChildByName("Icon");
            let labelNode = currentSlot.getChildByName("Label");

            let label = labelNode ? labelNode.getComponent(cc.Label) : null;
            let iconSprite = iconNode ? iconNode.getComponent(cc.Sprite) : null;

            if (i < items.length) {
                let item = items[i];
                if (label) label.string = item.count.toString();
                if (iconSprite) {
                    iconSprite.node.active = true;
                    switch (item.id) {
                        case "coconut": 
                            iconSprite.spriteFrame = this.coconutIcon; 
                            break;
                        case "apple": 
                            iconSprite.spriteFrame = this.appleIcon; 
                            break;
                        case "ore":
                            iconSprite.spriteFrame = this.oreIcon; 
                            break;
                        default: 
                            iconSprite.node.active = false; 
                            break;
                    }
                }
            } else {
                if (label) label.string = "";
                if (iconSprite) iconSprite.node.active = false;
            }
        }
    }
}
const { ccclass, property } = cc._decorator;
import { InventoryManager } from "../Player/InventoryManager";
import { getItemDefinition } from "../Data/ItemData";
import ItemIconLoader from "./ItemIconLoader";

@ccclass
export default class InventoryUIController extends cc.Component {

    @property(cc.Node) gridContainer: cc.Node = null!;
    @property(cc.Node) actionMenu: cc.Node = null!;
    @property(cc.Node) selectionFrame: cc.Node = null!;
    @property(cc.Node) descriptionTooltip: cc.Node = null!;
    @property(cc.Label) descriptionLabel: cc.Label = null!;
    
    private spriteCache: { [id: string]: cc.SpriteFrame } = {};
    private selectedIndex: number = -1; 

    start() {
        if (this.gridContainer) {
            let slots = this.gridContainer.children;
            for (let i = 0; i < slots.length; i++) {
                // 1. 點擊滑鼠事件
                slots[i].on(cc.Node.EventType.MOUSE_UP, (event: cc.Event.EventMouse) => {
                    this.onSlotMouseUp(i, event);
                });

                // 2. 🟢 滑鼠移入格子，顯示說明文字
                slots[i].on(cc.Node.EventType.MOUSE_ENTER, () => {
                    this.showTooltip(i);
                });

                // 3. 🟢 滑鼠移出格子，隱藏說明文字
                slots[i].on(cc.Node.EventType.MOUSE_LEAVE, () => {
                    this.hideTooltip();
                });
            }
        }
        
        this.node.on(cc.Node.EventType.MOUSE_UP, (event: cc.Event.EventMouse) => {
            if (event.getButton() === cc.Event.EventMouse.BUTTON_RIGHT) return;
            cc.log(`[右鍵排查] 點擊背包空白處，觸發自動隱藏`);
            this.hideActionMenu();
        });

        if (this.actionMenu) this.actionMenu.active = false;
        if (this.descriptionTooltip) this.descriptionTooltip.active = false; // 預設隱藏
        
        this.refreshUI();
    }

    onLoad() {
        cc.systemEvent.on("INVENTORY_CHANGED", this.refreshUI, this);
    }

    onDestroy() {
        cc.systemEvent.off("INVENTORY_CHANGED", this.refreshUI, this);
    }

    onEnable() {
        this.sanitizeRenderComponents(this.node);
        this.refreshUI();
        this.hideActionMenu();
        this.hideTooltip(); 
    }

    onSlotMouseUp(index: number, event: cc.Event.EventMouse) {
        let items = InventoryManager.instance.getItemsSnapshot();
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
        let item = InventoryManager.instance.getItemsSnapshot()[index];
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

    // 🟢 動態顯示 Tooltip 函式
    showTooltip(index: number) {
        let items = InventoryManager.instance.getItems();
        if (index >= items.length) return; 

        let item = items[index];
        const def = getItemDefinition(item.id); 

        if (this.descriptionLabel) {
            this.descriptionLabel.string = (def && def.description) ? def.description : "這件物品沒有留下任何描述。";
        }

        let slotNode = this.gridContainer.children[index];
        if (slotNode && this.descriptionTooltip) {
            let slotWorldPos = slotNode.convertToWorldSpaceAR(cc.Vec2.ZERO);
            let localPos = this.node.convertToNodeSpaceAR(slotWorldPos);
            this.descriptionTooltip.setPosition(localPos.x, localPos.y + (slotNode.height / 2) + 30);
            this.descriptionTooltip.active = true;
        }
    }

    // 🟢 隱藏 Tooltip 函式
    hideTooltip() {
        if (this.descriptionTooltip) this.descriptionTooltip.active = false;
    }

    onUseBtnClicked() {
        if (this.selectedIndex === -1) return;
        let item = InventoryManager.instance.getItemsSnapshot()[this.selectedIndex];
        
        cc.log(`[UI] 點擊使用：${item.name}`);
        InventoryManager.instance.removeItem(item.id, 1); 

        this.hideActionMenu();
        this.hideTooltip(); 
    }

    onDeleteBtnClicked() {
        if (this.selectedIndex === -1) return;
        let item = InventoryManager.instance.getItemsSnapshot()[this.selectedIndex];
        
        cc.log(`[UI] 點擊刪除：${item.name}`);
        InventoryManager.instance.removeItem(item.id, 1); 

        this.hideActionMenu();
        this.hideTooltip(); 
    }

    refreshUI() {
        if (!this.gridContainer) return;
        let items = InventoryManager.instance.getItemsSnapshot();
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
                    this.loadIconForSlot(item.id, iconSprite);
                }
            } else {
                if (label) label.string = "";
                if (iconSprite) iconSprite.node.active = false;
            }
        }
    }

    private loadIconForSlot(itemId: string, iconSprite: cc.Sprite) {
        ItemIconLoader.apply(itemId, iconSprite);
        
        if (this.spriteCache[itemId]) {
            iconSprite.spriteFrame = this.spriteCache[itemId];
            iconSprite.node.active = true;
            return;
        }

        const def = getItemDefinition(itemId);
        if (!def || !def.iconPath) {
            iconSprite.node.active = false;
            return;
        }

        const path = def.iconPath.replace(/\.(png|jpg|jpeg)$/i, '');
        cc.resources.load(path, cc.SpriteFrame, (err, sf) => {
            if (err) {
                cc.warn(`[InventoryUI] 找不到 ${itemId} 的圖片，路徑: ${path}`);
                iconSprite.node.active = false;
                return;
            }
            const frame = sf as cc.SpriteFrame;
            this.spriteCache[itemId] = frame; 
            iconSprite.spriteFrame = frame;
            iconSprite.node.active = true;
            cc.log(`[InventoryUI] ${itemId} 圖片載入成功`);
        });
    }

    private sanitizeRenderComponents(root: cc.Node) {
        if (!root || !cc.isValid(root)) return;

        for (const sprite of root.getComponentsInChildren(cc.Sprite)) {
            const frame = sprite.spriteFrame;
            if (frame && (!cc.isValid(frame) || !frame.getTexture())) {
                sprite.spriteFrame = null;
                sprite.enabled = false;
            }
        }

        for (const button of root.getComponentsInChildren(cc.Button)) {
            if (button.transition !== cc.Button.Transition.SPRITE) continue;

            const frames = [
                button.normalSprite,
                button.pressedSprite,
                button.hoverSprite,
                button.disabledSprite
            ];
            if (frames.some(frame => !!frame && (!cc.isValid(frame) || !frame.getTexture()))) {
                button.transition = cc.Button.Transition.NONE;
            }
        }
    }
}

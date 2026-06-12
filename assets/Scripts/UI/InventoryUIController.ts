const { ccclass, property } = cc._decorator;

import { InventoryManager } from "../Player/InventoryManager";
import { getItemDefinition } from "../Data/ItemData";
import ItemIconLoader from "./ItemIconLoader";

@ccclass
export default class InventoryUIController extends cc.Component {

    @property(cc.Node)
    gridContainer: cc.Node = null!;

    @property(cc.Node)
    actionMenu: cc.Node = null!;

    @property(cc.Node)
    selectionFrame: cc.Node = null!;

    @property(cc.Node)
    descriptionTooltip: cc.Node = null!;

    @property(cc.Label)
    descriptionLabel: cc.Label = null!;

    @property(cc.Node)
    canvasNode: cc.Node = null!;

    @property(cc.Node)
    mainCameraNode: cc.Node = null!;

    @property(cc.Boolean)
    followMainCamera: boolean = true;

    @property(cc.Boolean)
    clampToCameraView: boolean = true;

    @property(cc.Float)
    screenPadding: number = 24;

    @property(cc.Integer)
    uiZIndex: number = 10000;

    @property(cc.Float)
    inventoryPanelOffsetY: number = 0;

    private spriteCache: { [id: string]: cc.SpriteFrame } = {};
    private selectedIndex: number = -1;
    private mainCamera: cc.Camera = null!;

    onLoad() {
        this.setupReferences();
        cc.systemEvent.on("INVENTORY_CHANGED", this.refreshUI, this);
    }

    start() {
        if (this.gridContainer) {
            const slots = this.gridContainer.children;
            for (let i = 0; i < slots.length; i++) {
                slots[i].on(cc.Node.EventType.MOUSE_UP, (event: cc.Event.EventMouse) => {
                    this.onSlotMouseUp(i, event);
                });

                slots[i].on(cc.Node.EventType.MOUSE_ENTER, () => {
                    this.showTooltip(i);
                });

                slots[i].on(cc.Node.EventType.MOUSE_LEAVE, () => {
                    this.hideTooltip();
                });
            }
        }

        this.node.on(cc.Node.EventType.MOUSE_UP, (event: cc.Event.EventMouse) => {
            if (event.getButton() === cc.Event.EventMouse.BUTTON_RIGHT) return;
            this.hideActionMenu();
        });

        if (this.actionMenu) this.actionMenu.active = false;
        if (this.descriptionTooltip) this.descriptionTooltip.active = false;

        this.refreshUI();
        this.updatePanelPosition();
    }

    onEnable() {
        this.setupReferences();
        this.sanitizeRenderComponents(this.node);
        this.updatePanelPosition();
        this.refreshUI();
        this.hideActionMenu();
        this.hideTooltip();
    }

    update() {
        if (!this.followMainCamera || !this.node.activeInHierarchy) {
            return;
        }

        this.updatePanelPosition();
    }

    onDestroy() {
        cc.systemEvent.off("INVENTORY_CHANGED", this.refreshUI, this);
    }

    onSlotMouseUp(index: number, event: cc.Event.EventMouse) {
        const items = InventoryManager.instance.getItemsSnapshot();
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
        if (!this.actionMenu || !this.gridContainer) return;

        this.selectedIndex = index;

        const slotNode = this.gridContainer.children[index];
        if (!slotNode) return;

        const slotWorldPos = slotNode.convertToWorldSpaceAR(cc.v2(0, 0));
        const localPos = this.node.convertToNodeSpaceAR(slotWorldPos);

        if (this.selectionFrame) {
            this.selectionFrame.setPosition(localPos);
            this.selectionFrame.active = true;
        }

        const targetX = localPos.x + (slotNode.width / 2);
        const targetY = localPos.y - (slotNode.height / 2);

        this.actionMenu.setPosition(targetX + 2, targetY - 2);
        this.actionMenu.active = true;
    }

    hideActionMenu() {
        if (this.actionMenu) this.actionMenu.active = false;
        if (this.selectionFrame) this.selectionFrame.active = false;
        this.selectedIndex = -1;
    }

    showTooltip(index: number) {
        const items = InventoryManager.instance.getItemsSnapshot();
        if (index >= items.length) return;

        const item = items[index];
        const def = getItemDefinition(item.id);

        if (this.descriptionLabel) {
            this.descriptionLabel.string = (def && def.description)
                ? def.description
                : "這件物品沒有留下任何描述。";
        }

        const slotNode = this.gridContainer ? this.gridContainer.children[index] : null;
        if (slotNode && this.descriptionTooltip) {
            const slotWorldPos = slotNode.convertToWorldSpaceAR(cc.v2(0, 0));
            const localPos = this.node.convertToNodeSpaceAR(slotWorldPos);
            this.descriptionTooltip.setPosition(localPos.x, localPos.y + (slotNode.height / 2) + 30);
            this.descriptionTooltip.active = true;
        }
    }

    hideTooltip() {
        if (this.descriptionTooltip) this.descriptionTooltip.active = false;
    }

    onUseBtnClicked() {
        if (this.selectedIndex === -1) return;

        const item = InventoryManager.instance.getItemsSnapshot()[this.selectedIndex];
        if (!item) return;

        // 1. 取得這項物品的完整屬性資料
        const def = getItemDefinition(item.id);
        
        // 2. 判斷它是不是「食物」而且「能補血」
        // 直接從 ItemDefinition 中讀取 hpRestore
        const healAmount = def ? (def.hpRestore || 0) : 0;
        const isFood = healAmount > 0;

        if (isFood) {
            cc.log(`[InventoryUI] 成功使用！吃掉了 ${def.name}，準備回復 ${healAmount} 點 HP。`);

            const playerNode = cc.find("Canvas/Player");
            if (playerNode) {
                const playerStats = playerNode.getComponent("PlayerController") as any; 
                
                if (playerStats && playerStats.heal) {
                    playerStats.heal(healAmount); 
                    cc.log(`[InventoryUI] 已成功呼叫玩家的 heal() 函式。`);
                } else {
                    cc.warn(`[InventoryUI] 找不到玩家的補血函式！請確認 Player 身上有沒有對應的腳本和 heal() 方法。`);
                }
            } else {
                cc.warn(`[InventoryUI] 找不到 Canvas/Player 節點，無法補血！`);
            }

            InventoryManager.instance.removeItem(item.id, 1);

        } else {
            cc.log(`[InventoryUI] 這個物品 (${def ? def.name : item.id}) 不能吃或沒有補血效果！`);
            
            // 既然不能吃，我們就不應該扣除它的數量，直接 return 結束動作
            this.hideActionMenu();
            return;
        }

        this.hideActionMenu();
        this.hideTooltip();
        this.refreshUI();
    }

    onDeleteBtnClicked() {
        if (this.selectedIndex === -1) return;

        const item = InventoryManager.instance.getItemsSnapshot()[this.selectedIndex];
        if (!item) return;

        InventoryManager.instance.removeItem(item.id, 1);

        this.hideActionMenu();
        this.hideTooltip();
        this.refreshUI();
    }

    refreshUI() {
        if (!this.gridContainer) return;

        const items = InventoryManager.instance.getItemsSnapshot();
        const slots = this.gridContainer.children;

        for (let i = 0; i < slots.length; i++) {
            const currentSlot = slots[i];
            const iconNode = currentSlot.getChildByName("Icon");
            const labelNode = currentSlot.getChildByName("Label");

            const label = labelNode ? labelNode.getComponent(cc.Label) : null;
            const iconSprite = iconNode ? iconNode.getComponent(cc.Sprite) : null;

            if (i < items.length) {
                const item = items[i];
                if (label) {
                    label.string = item.count.toString();
                }
                if (iconSprite) {
                    this.loadIconForSlot(item.id, iconSprite);
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

    private setupReferences(): void {
        if (!this.canvasNode) {
            this.canvasNode = cc.find("Canvas") || null!;
        }

        if (!this.mainCameraNode) {
            this.mainCameraNode = cc.find("Canvas/Main Camera") || cc.find("Main Camera") || null!;
        }

        if (this.mainCameraNode) {
            this.mainCamera = this.mainCameraNode.getComponent(cc.Camera) || null!;
        }

        this.node.zIndex = this.uiZIndex;
    }

    private updatePanelPosition(): void {
        if (!this.followMainCamera || !this.node || !cc.isValid(this.node) || !this.node.parent) {
            return;
        }

        const cameraWorldPos = this.getCameraWorldPosition();
        if (!cameraWorldPos) {
            return;
        }

        const targetCenterWorldPos = cc.v2(
            cameraWorldPos.x,
            cameraWorldPos.y + this.inventoryPanelOffsetY
        );

        this.node.setPosition(this.node.parent.convertToNodeSpaceAR(targetCenterWorldPos));
        this.node.zIndex = this.uiZIndex;
    }

    private getCameraWorldPosition(): cc.Vec2 | null {
        if (!this.mainCameraNode || !cc.isValid(this.mainCameraNode)) {
            this.mainCameraNode = cc.find("Canvas/Main Camera") || cc.find("Main Camera") || null!;
        }

        if (!this.mainCameraNode || !cc.isValid(this.mainCameraNode)) {
            return null;
        }

        if (!this.mainCamera) {
            this.mainCamera = this.mainCameraNode.getComponent(cc.Camera) || null!;
        }

        if (this.mainCameraNode.parent) {
            return this.mainCameraNode.parent.convertToWorldSpaceAR(cc.v2(this.mainCameraNode.x, this.mainCameraNode.y));
        }

        return cc.v2(this.mainCameraNode.x, this.mainCameraNode.y);
    }

    private getCameraVisibleWorldBounds(): {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    } | null {
        const cameraWorldPos = this.getCameraWorldPosition();
        if (!cameraWorldPos) {
            return null;
        }

        const viewWidth = this.canvasNode && this.canvasNode.width > 0 ? this.canvasNode.width : cc.winSize.width;
        const viewHeight = this.canvasNode && this.canvasNode.height > 0 ? this.canvasNode.height : cc.winSize.height;
        const zoomRatio = this.mainCamera && (this.mainCamera as any).zoomRatio ? (this.mainCamera as any).zoomRatio : 1;

        const halfWidth = viewWidth * 0.5 / zoomRatio;
        const halfHeight = viewHeight * 0.5 / zoomRatio;

        return {
            minX: cameraWorldPos.x - halfWidth,
            maxX: cameraWorldPos.x + halfWidth,
            minY: cameraWorldPos.y - halfHeight,
            maxY: cameraWorldPos.y + halfHeight
        };
    }

    private clampCurrentPanelToCameraView(): void {
        const cameraBounds = this.getCameraVisibleWorldBounds();
        const contentBounds = this.getVisibleContentWorldBounds(this.node);

        if (!cameraBounds || !contentBounds || !this.node.parent) {
            return;
        }

        const minX = cameraBounds.minX + this.screenPadding;
        const maxX = cameraBounds.maxX - this.screenPadding;
        const minY = cameraBounds.minY + this.screenPadding;
        const maxY = cameraBounds.maxY - this.screenPadding;

        let offsetX = 0;
        let offsetY = 0;

        const contentWidth = contentBounds.xMax - contentBounds.xMin;
        const contentHeight = contentBounds.yMax - contentBounds.yMin;
        const viewWidth = maxX - minX;
        const viewHeight = maxY - minY;

        if (contentWidth > viewWidth) {
            offsetX = ((minX + maxX) * 0.5) - ((contentBounds.xMin + contentBounds.xMax) * 0.5);
        } else {
            if (contentBounds.xMin < minX) {
                offsetX = minX - contentBounds.xMin;
            }
            if (contentBounds.xMax > maxX) {
                offsetX = maxX - contentBounds.xMax;
            }
        }

        if (contentHeight > viewHeight) {
            offsetY = ((minY + maxY) * 0.5) - ((contentBounds.yMin + contentBounds.yMax) * 0.5);
        } else {
            if (contentBounds.yMin < minY) {
                offsetY = minY - contentBounds.yMin;
            }
            if (contentBounds.yMax > maxY) {
                offsetY = maxY - contentBounds.yMax;
            }
        }

        if (offsetX === 0 && offsetY === 0) {
            return;
        }

        const panelWorldPos = this.node.parent.convertToWorldSpaceAR(cc.v2(this.node.x, this.node.y));
        const correctedWorldPos = cc.v2(panelWorldPos.x + offsetX, panelWorldPos.y + offsetY);
        this.node.setPosition(this.node.parent.convertToNodeSpaceAR(correctedWorldPos));
    }

    private getVisibleContentWorldBounds(rootNode: cc.Node): {
        xMin: number;
        xMax: number;
        yMin: number;
        yMax: number;
    } | null {
        const result = {
            hasValue: false,
            xMin: 0,
            xMax: 0,
            yMin: 0,
            yMax: 0
        };

        this.collectVisibleBounds(rootNode, result);

        if (!result.hasValue) {
            return null;
        }

        return {
            xMin: result.xMin,
            xMax: result.xMax,
            yMin: result.yMin,
            yMax: result.yMax
        };
    }

    private collectVisibleBounds(node: cc.Node, result: any): void {
        if (!node || !cc.isValid(node) || !node.activeInHierarchy) {
            return;
        }

        if (node === this.descriptionTooltip || node === this.actionMenu || node === this.selectionFrame) {
            return;
        }

        const hasVisualComponent = node.getComponent(cc.RenderComponent);
        if (hasVisualComponent) {
            const rect = node.getBoundingBoxToWorld();

            if (rect && rect.width > 1 && rect.height > 1) {
                const xMin = rect.x;
                const xMax = rect.x + rect.width;
                const yMin = rect.y;
                const yMax = rect.y + rect.height;

                if (!result.hasValue) {
                    result.hasValue = true;
                    result.xMin = xMin;
                    result.xMax = xMax;
                    result.yMin = yMin;
                    result.yMax = yMax;
                } else {
                    result.xMin = Math.min(result.xMin, xMin);
                    result.xMax = Math.max(result.xMax, xMax);
                    result.yMin = Math.min(result.yMin, yMin);
                    result.yMax = Math.max(result.yMax, yMax);
                }
            }
        }

        for (let i = 0; i < node.children.length; i++) {
            this.collectVisibleBounds(node.children[i], result);
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

        const path = def.iconPath.replace(/\.(png|jpg|jpeg)$/i, "");
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
        });
    }

    private sanitizeRenderComponents(root: cc.Node) {
        if (!root || !cc.isValid(root)) return;

        for (const sprite of root.getComponentsInChildren(cc.Sprite)) {
            const frame = sprite.spriteFrame;
            if (frame && (!cc.isValid(frame) || !frame.getTexture())) {
                sprite.spriteFrame = null!;
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
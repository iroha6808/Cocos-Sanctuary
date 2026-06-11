import { getItemDefinition } from "../Data/ItemData";
import { MerchantStockItem } from "../Data/MerchantPool";
import MerchantNPC from "../NPC/MerchantNPC";
import { InventoryManager } from "../Player/InventoryManager";
import { InputAction } from "../Input/InputAction";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MerchantShopUIController extends cc.Component {

    @property(cc.Node)
    public root: cc.Node = null!;

    @property(cc.Node)
    public canvasNode: cc.Node = null!;

    @property(cc.Node)
    public mainCameraNode: cc.Node = null!;

    @property(cc.Boolean)
    public followMainCamera: boolean = true;

    @property(cc.Boolean)
    public clampToCameraView: boolean = true;

    @property(cc.Float)
    public screenPadding: number = 24;

    @property(cc.Integer)
    public uiZIndex: number = 10000;

    @property(cc.Float)
    public tradePanelOffsetY: number = 190;

    @property(cc.Label)
    public currencyLabel: cc.Label = null!;

    @property(cc.Node)
    public itemListRoot: cc.Node = null!;

    @property(cc.Label)
    public itemNameLabel: cc.Label = null!;

    @property(cc.Label)
    public descriptionLabel: cc.Label = null!;

    @property(cc.Label)
    public priceLabel: cc.Label = null!;

    @property(cc.Label)
    public stockLabel: cc.Label = null!;

    @property(cc.Label)
    public playerOwnedLabel: cc.Label = null!;

    @property(cc.Label)
    public buyAmountLabel: cc.Label = null!;

    @property(cc.Button)
    public buyButton: cc.Button = null!;

    @property(cc.Color)
    public canBuyColor: cc.Color = cc.Color.GREEN;

    @property(cc.Color)
    public cannotBuyColor: cc.Color = cc.Color.GRAY;

    private merchant: MerchantNPC = null!;
    private selectedIndex: number = 0;
    private buyAmount: number = 1;
    private mainCamera: cc.Camera = null!;
    private panelScreenOffset: cc.Vec2 = cc.v2(0, 0);

    onLoad() {
        this.setupReferences();
        this.bindItemListInput();
        this.capturePanelScreenOffset();
        this.close();
    }

    update() {
        if (!this.followMainCamera || !this.isOpen()) {
            return;
        }

        this.updatePanelPosition();
    }

    onDestroy() {
        cc.systemEvent.off("INVENTORY_CHANGED", this.refresh, this);
    }

    public open(merchant: MerchantNPC): void {
        this.merchant = merchant;
        this.selectedIndex = 0;
        this.buyAmount = 1;

        const panel = this.getDisplayRoot();
        if (panel) {
            panel.active = true;
            panel.zIndex = this.uiZIndex;
        }

        this.updatePanelPosition();

        cc.systemEvent.off("INVENTORY_CHANGED", this.refresh, this);
        cc.systemEvent.on("INVENTORY_CHANGED", this.refresh, this);

        this.bindItemListInput();
        this.refresh();
    }

    public close(): void {
        this.merchant = null!;
        this.selectedIndex = 0;
        this.buyAmount = 1;

        cc.systemEvent.off("INVENTORY_CHANGED", this.refresh, this);

        const panel = this.getDisplayRoot();
        if (panel) {
            panel.active = false;
        }
    }

    public refresh(): void {
        const items = this.getItems();
        this.clampSelection(items);
        this.refreshItemList(items);

        const selectedItem = items[this.selectedIndex];
        const itemDefinition = selectedItem ? getItemDefinition(selectedItem.itemId) : null;
        const ownedCount = selectedItem ? InventoryManager.instance.getItemCount(selectedItem.itemId) : 0;
        const coconutCount = InventoryManager.instance.getItemCount("coconut");
        const cost = selectedItem ? selectedItem.price * this.buyAmount : 0;
        const canBuy = !!selectedItem && selectedItem.stock >= this.buyAmount && coconutCount >= cost;

        if (this.currencyLabel) {
            this.currencyLabel.string = `Coconut: ${coconutCount}`;
        }

        if (this.itemNameLabel) {
            this.itemNameLabel.string = itemDefinition ? itemDefinition.name : "";
        }

        if (this.descriptionLabel) {
            this.descriptionLabel.string = itemDefinition ? itemDefinition.description : "";
        }

        if (this.priceLabel) {
            this.priceLabel.string = selectedItem
                ? `Price: ${selectedItem.price} x ${this.buyAmount} = ${cost}`
                : "Price: -";
        }

        if (this.stockLabel) {
            this.stockLabel.string = selectedItem
                ? `Merchant Stock: ${selectedItem.stock}`
                : "Merchant Stock: -";
        }

        if (this.playerOwnedLabel) {
            this.playerOwnedLabel.string = selectedItem
                ? `Owned: ${ownedCount}`
                : "Owned: -";
        }

        if (this.buyAmountLabel) {
            this.buyAmountLabel.string = `${this.buyAmount}`;
        }

        if (this.buyButton) {
            this.buyButton.interactable = canBuy;
            this.buyButton.node.color = canBuy ? this.canBuyColor : this.cannotBuyColor;
        }
    }

    public selectItem(index: number): void {
        this.selectedIndex = index;
        this.buyAmount = 1;
        this.refresh();
    }

    public selectNextItem(): void {
        const items = this.getItems();
        if (items.length <= 0) {
            return;
        }

        this.selectedIndex = (this.selectedIndex + 1) % items.length;
        this.buyAmount = 1;
        this.refresh();
    }

    public selectPrevItem(): void {
        const items = this.getItems();
        if (items.length <= 0) {
            return;
        }

        this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
        this.buyAmount = 1;
        this.refresh();
    }

    public increaseAmount(): void {
        const item = this.getItems()[this.selectedIndex];
        if (!item) {
            return;
        }

        this.buyAmount = Math.min(item.stock, this.buyAmount + 1);
        this.refresh();
    }

    public decreaseAmount(): void {
        this.buyAmount = Math.max(1, this.buyAmount - 1);
        this.refresh();
    }

    public buySelected(): void {
        const item = this.getItems()[this.selectedIndex];
        if (!this.merchant || !item) {
            return;
        }

        if (this.merchant.buy(item.itemId, this.buyAmount)) {
            this.buyAmount = 1;
            this.refresh();
        }
    }

    public isOpen(): boolean {
        const rootNode = this.getDisplayRoot();
        return !!rootNode && cc.isValid(rootNode) && rootNode.active;
    }

    public handleInput(action: InputAction): boolean {
        if (!this.isOpen()) {
            return false;
        }

        switch (action) {
            case InputAction.MoveUp:
            case InputAction.NavigateUp:
                this.selectPrevItem();
                return true;

            case InputAction.MoveDown:
            case InputAction.NavigateDown:
                this.selectNextItem();
                return true;

            case InputAction.AdjustLeft:
                this.decreaseAmount();
                return true;

            case InputAction.AdjustRight:
                this.increaseAmount();
                return true;

            case InputAction.Confirm:
            case InputAction.Interact:
                this.buySelected();
                return true;

            case InputAction.Cancel:
                this.close();
                return true;

            default:
                return false;
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

        const panel = this.getDisplayRoot();
        if (panel) {
            panel.zIndex = this.uiZIndex;
        }
    }

    private getDisplayRoot(): cc.Node {
        if (this.root && cc.isValid(this.root)) {
            return this.root;
        }

        if (this.node.name === "MerchantShopPanel") {
            return this.node;
        }

        const childPanel = this.node.getChildByName("MerchantShopPanel");
        if (childPanel) {
            return childPanel;
        }

        return this.node;
    }

    private capturePanelScreenOffset(): void {
        const panel = this.getDisplayRoot();
        const cameraWorldPos = this.getCameraWorldPosition();

        if (!panel || !cc.isValid(panel) || !panel.parent || !cameraWorldPos) {
            this.panelScreenOffset = cc.v2(0, 0);
            return;
        }

        const panelWorldPos = panel.parent.convertToWorldSpaceAR(cc.v2(panel.x, panel.y));
        this.panelScreenOffset = cc.v2(
            panelWorldPos.x - cameraWorldPos.x,
            panelWorldPos.y - cameraWorldPos.y
        );
    }

    private updatePanelPosition(): void {
        const panel = this.getDisplayRoot();
        if (!panel || !cc.isValid(panel) || !panel.parent) {
            return;
        }

        const cameraWorldPos = this.getCameraWorldPosition();
        if (!cameraWorldPos) {
            return;
        }

        // 先把 panel 放到鏡頭中心附近
        const targetCenterWorldPos = cc.v2(
            cameraWorldPos.x,
            cameraWorldPos.y + this.tradePanelOffsetY
        );

        panel.setPosition(panel.parent.convertToNodeSpaceAR(targetCenterWorldPos));
        panel.zIndex = this.uiZIndex;

        // 再把「實際可見內容中心」精準對齊到 targetCenterWorldPos
        const contentBounds = this.getVisibleContentWorldBounds(panel);
        if (contentBounds) {
            const contentCenterX = (contentBounds.xMin + contentBounds.xMax) * 0.5;
            const contentCenterY = (contentBounds.yMin + contentBounds.yMax) * 0.5;

            const deltaX = targetCenterWorldPos.x - contentCenterX;
            const deltaY = targetCenterWorldPos.y - contentCenterY;

            const panelWorldPos = panel.parent.convertToWorldSpaceAR(cc.v2(panel.x, panel.y));
            const correctedWorldPos = cc.v2(
                panelWorldPos.x + deltaX,
                panelWorldPos.y + deltaY
            );

            panel.setPosition(panel.parent.convertToNodeSpaceAR(correctedWorldPos));
        }

        if (this.clampToCameraView) {
            this.clampCurrentPanelToCameraView(panel);
        }
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

    private clampCurrentPanelToCameraView(panel: cc.Node): void {
        const cameraBounds = this.getCameraVisibleWorldBounds();
        const contentBounds = this.getVisibleContentWorldBounds(panel);

        if (!cameraBounds || !contentBounds || !panel.parent) {
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

        const panelWorldPos = panel.parent.convertToWorldSpaceAR(cc.v2(panel.x, panel.y));
        const correctedWorldPos = cc.v2(panelWorldPos.x + offsetX, panelWorldPos.y + offsetY);
        panel.setPosition(panel.parent.convertToNodeSpaceAR(correctedWorldPos));
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

        for (let i = 0; i < node.children.length; i++) {
            this.collectVisibleBounds(node.children[i], result);
        }
    }

    private getItems(): MerchantStockItem[] {
        return this.merchant ? this.merchant.getShopItems() : [];
    }

    private clampSelection(items: MerchantStockItem[]): void {
        if (items.length <= 0) {
            this.selectedIndex = 0;
            this.buyAmount = 1;
            return;
        }

        this.selectedIndex = Math.max(0, Math.min(this.selectedIndex, items.length - 1));
        const selectedItem = items[this.selectedIndex];
        this.buyAmount = Math.max(1, Math.min(this.buyAmount, Math.max(1, selectedItem.stock)));
    }

    private refreshItemList(items: MerchantStockItem[]): void {
        if (!this.itemListRoot) {
            return;
        }

        for (let i = 0; i < this.itemListRoot.children.length; i++) {
            const child = this.itemListRoot.children[i];
            const label = child.getComponent(cc.Label)
                || (child.getChildByName("Label")
                    ? child.getChildByName("Label")!.getComponent(cc.Label)
                    : null);

            if (!label) {
                continue;
            }

            if (i < items.length) {
                const item = items[i];
                const definition = getItemDefinition(item.itemId);
                const name = definition ? definition.name : item.itemId;
                child.active = true;
                label.string = `${i === this.selectedIndex ? "> " : "  "}${name}  $${item.price}  x${item.stock}`;
            } else {
                label.string = "";
                child.active = false;
            }
        }
    }

    private bindItemListInput(): void {
        if (!this.itemListRoot) {
            return;
        }

        for (let index = 0; index < this.itemListRoot.children.length; index++) {
            const child = this.itemListRoot.children[index];
            if ((child as any).__merchantShopInputBound) {
                continue;
            }

            (child as any).__merchantShopInputBound = true;

            child.on(cc.Node.EventType.MOUSE_UP, (event: cc.Event.EventMouse) => {
                if (this.isOpen() && event.getButton() === cc.Event.EventMouse.BUTTON_LEFT) {
                    event.stopPropagation();
                    this.selectItem(index);
                }
            }, this);

            child.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
                if (this.isOpen()) {
                    event.stopPropagation();
                    this.selectItem(index);
                }
            }, this);
        }
    }
}
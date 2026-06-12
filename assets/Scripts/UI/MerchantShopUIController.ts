import { getItemDefinition, ItemDefinition } from "../Data/ItemData";
import { MerchantStockItem } from "../Data/MerchantPool";
import { InputAction } from "../Input/InputAction";
import MerchantNPC from "../NPC/MerchantNPC";
import { InventoryManager } from "../Player/InventoryManager";
import ItemIconLoader from "./ItemIconLoader";

const { ccclass, property } = cc._decorator;

interface ShopItemRowView {
    node: cc.Node;
    background: cc.Graphics;
    selectionMarker: cc.Label;
    icon: cc.Sprite;
    nameLabel: cc.Label;
    currencyIcon: cc.Sprite;
    priceLabel: cc.Label;
    stockLabel: cc.Label;
    itemIndex: number;
}

interface ShopSelectionViewModel {
    item: MerchantStockItem | null;
    definition: ItemDefinition | null;
    currencyOwned: number;
    playerOwned: number;
    totalPrice: number;
    maxBuyAmount: number;
    canBuy: boolean;
    disabledReason: string;
}

@ccclass
export default class MerchantShopUIController extends cc.Component {

    // Legacy scene references are kept so old Game.fire data remains loadable.
    @property(cc.Node) public root: cc.Node = null!;
    @property(cc.Node) public canvasNode: cc.Node = null!;
    @property(cc.Node) public mainCameraNode: cc.Node = null!;
    @property(cc.Boolean) public followMainCamera: boolean = true;
    @property(cc.Boolean) public clampToCameraView: boolean = true;
    @property(cc.Float) public screenPadding: number = 24;
    @property(cc.Integer) public uiZIndex: number = 10000;
    @property(cc.Float) public tradePanelOffsetY: number = 190;
    @property(cc.Label) public currencyLabel: cc.Label = null!;
    @property(cc.Node) public itemListRoot: cc.Node = null!;
    @property(cc.Label) public itemNameLabel: cc.Label = null!;
    @property(cc.Label) public descriptionLabel: cc.Label = null!;
    @property(cc.Label) public priceLabel: cc.Label = null!;
    @property(cc.Label) public stockLabel: cc.Label = null!;
    @property(cc.Label) public playerOwnedLabel: cc.Label = null!;
    @property(cc.Label) public buyAmountLabel: cc.Label = null!;
    @property(cc.Button) public buyButton: cc.Button = null!;
    @property(cc.Color) public canBuyColor: cc.Color = cc.color(55, 150, 105);
    @property(cc.Color) public cannotBuyColor: cc.Color = cc.color(95, 95, 95);

    @property(cc.Boolean)
    public buildUIAtRuntime: boolean = true;

    @property(cc.Float)
    public runtimePanelOffsetY: number = 0;

    @property(cc.Color)
    public panelColor: cc.Color = cc.color(24, 32, 41, 248);

    @property(cc.Color)
    public subPanelColor: cc.Color = cc.color(33, 45, 57, 250);

    @property(cc.Color)
    public selectedColor: cc.Color = cc.color(60, 82, 101, 255);

    private merchant: MerchantNPC = null!;
    private selectedIndex: number = 0;
    private buyAmount: number = 1;
    private mainCamera: cc.Camera = null!;
    private generatedRoot: cc.Node = null!;
    private generatedPanel: cc.Node = null!;
    private uiBuilt: boolean = false;
    private closeRequested: boolean = false;
    private displayRootBaseScale: cc.Vec2 = null!;

    private itemScrollView: cc.ScrollView = null!;
    private itemContent: cc.Node = null!;
    private itemRows: ShopItemRowView[] = [];
    private currencyIcon: cc.Sprite = null!;
    private largeItemIcon: cc.Sprite = null!;
    private totalPriceLabel: cc.Label = null!;
    private statusLabel: cc.Label = null!;
    private decreaseButton: cc.Button = null!;
    private increaseButton: cc.Button = null!;
    private closeButton: cc.Button = null!;

    private readonly normalRowColor = cc.color(37, 50, 63, 255);
    private readonly soldOutRowColor = cc.color(55, 55, 58, 255);
    private readonly textColor = cc.color(236, 239, 224, 255);
    private readonly mutedTextColor = cc.color(175, 184, 190, 255);
    private readonly accentColor = cc.color(232, 151, 77, 255);

    onLoad(): void {
        // Old scene data serialized these colors as bright green/gray.
        // Runtime UI owns its palette so it stays consistent with crafting.
        this.canBuyColor = cc.color(72, 112, 88, 255);
        this.cannotBuyColor = cc.color(91, 94, 98, 255);
        this.setupReferences();
        this.ensureUIBuilt();
        this.close();
    }

    update(): void {
        if (!this.isOpen()) {
            return;
        }

        if (!this.merchant || !cc.isValid(this.merchant.node)) {
            this.requestClose();
            return;
        }

        if (this.followMainCamera) {
            this.updatePanelPosition();
        }
        this.applyPanelZoomScale();
    }

    onDestroy(): void {
        cc.systemEvent.off("INVENTORY_CHANGED", this.refresh, this);
        this.clearItemRows();
        this.merchant = null!;
    }

    public open(merchant: MerchantNPC): void {
        if (!merchant || !cc.isValid(merchant.node)) {
            cc.warn("[MerchantShopUI] Cannot open without a valid merchant.");
            return;
        }

        this.ensureUIBuilt();
        this.merchant = merchant;
        this.selectedIndex = 0;
        this.buyAmount = 1;
        this.closeRequested = false;

        const panel = this.getDisplayRoot();
        if (panel) {
            panel.active = true;
            panel.zIndex = this.uiZIndex;
        }

        cc.systemEvent.off("INVENTORY_CHANGED", this.refresh, this);
        cc.systemEvent.on("INVENTORY_CHANGED", this.refresh, this);

        this.updatePanelPosition();
        this.applyPanelZoomScale();
        this.refresh();
    }

    public close(): void {
        this.merchant = null!;
        this.selectedIndex = 0;
        this.buyAmount = 1;
        this.closeRequested = false;

        cc.systemEvent.off("INVENTORY_CHANGED", this.refresh, this);
        const panel = this.getDisplayRoot();
        if (panel && cc.isValid(panel)) {
            panel.active = false;
        }
    }

    public refresh(): void {
        if (!this.isOpen()) {
            return;
        }

        const items = this.getItems();
        this.clampSelection(items);
        this.ensureItemRowCount(items.length);

        for (let index = 0; index < this.itemRows.length; index++) {
            const row = this.itemRows[index];
            if (index < items.length) {
                row.node.active = true;
                this.refreshItemRow(row, items[index], index === this.selectedIndex);
            } else {
                row.node.active = false;
            }
        }

        const viewModel = this.buildSelectionViewModel();
        this.refreshDetails(viewModel);
    }

    public selectItem(index: number): void {
        const items = this.getItems();
        if (index < 0 || index >= items.length) {
            return;
        }

        this.selectedIndex = index;
        this.buyAmount = 1;
        this.refresh();
        this.scrollToSelectedItem();
    }

    public selectNextItem(): void {
        const items = this.getItems();
        if (items.length <= 0) {
            return;
        }
        this.selectItem((this.selectedIndex + 1) % items.length);
    }

    public selectPrevItem(): void {
        const items = this.getItems();
        if (items.length <= 0) {
            return;
        }
        this.selectItem((this.selectedIndex - 1 + items.length) % items.length);
    }

    public increaseAmount(): void {
        const viewModel = this.buildSelectionViewModel();
        if (!viewModel.item || viewModel.maxBuyAmount <= 0) {
            this.refreshDetails(viewModel);
            return;
        }

        this.buyAmount = Math.min(viewModel.maxBuyAmount, this.buyAmount + 1);
        this.refresh();
    }

    public decreaseAmount(): void {
        this.buyAmount = Math.max(1, this.buyAmount - 1);
        this.refresh();
    }

    public buySelected(): void {
        const viewModel = this.buildSelectionViewModel();
        if (!this.merchant || !viewModel.item || !viewModel.canBuy) {
            this.setStatus(viewModel.disabledReason || "Cannot buy this item.", true);
            return;
        }

        if (this.merchant.buy(viewModel.item.itemId, this.buyAmount)) {
            this.buyAmount = 1;
            this.refresh();
            this.setStatus("Purchase complete.", false);
        } else {
            this.refresh();
            this.setStatus("Purchase failed. Check stock and inventory.", true);
        }
    }

    public isOpen(): boolean {
        const panel = this.getDisplayRoot();
        return !!panel && cc.isValid(panel) && panel.active;
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
            case InputAction.MoveLeft:
            case InputAction.AdjustLeft:
                this.decreaseAmount();
                return true;
            case InputAction.MoveRight:
            case InputAction.AdjustRight:
                this.increaseAmount();
                return true;
            case InputAction.Confirm:
            case InputAction.Interact:
                this.buySelected();
                return true;
            case InputAction.Cancel:
                this.requestClose();
                return true;
            default:
                return true;
        }
    }

    private requestClose(): void {
        if (this.closeRequested) {
            return;
        }
        this.closeRequested = true;
        cc.systemEvent.emit("MERCHANT_SHOP_CLOSE_REQUESTED");
    }

    private ensureUIBuilt(): void {
        if (this.uiBuilt && this.generatedRoot && cc.isValid(this.generatedRoot)) {
            return;
        }

        if (!this.buildUIAtRuntime) {
            this.uiBuilt = true;
            return;
        }

        const oldGenerated = this.node.getChildByName("MerchantShopUIRoot");
        if (oldGenerated) {
            oldGenerated.destroy();
        }

        if (this.root && this.root !== this.node && cc.isValid(this.root)) {
            this.root.active = false;
        }

        this.buildShopUI();
        this.uiBuilt = true;
    }

    private buildShopUI(): void {
        this.generatedRoot = new cc.Node("MerchantShopUIRoot");
        this.generatedRoot.setContentSize(940, 560);
        this.generatedRoot.zIndex = this.uiZIndex;
        this.node.addChild(this.generatedRoot);
        this.generatedRoot.addComponent(cc.BlockInputEvents);

        this.generatedPanel = this.createBox(
            "GeneratedMerchantShopPanel",
            this.generatedRoot,
            920,
            530,
            this.panelColor,
            8
        );

        const titleLabel = this.createLabel(
            "ShopTitle",
            this.generatedPanel,
            "TRAVELING MERCHANT",
            24,
            this.textColor,
            420,
            cc.Label.HorizontalAlign.LEFT
        );
        titleLabel.node.setPosition(-184, 232);

        const currencyBar = this.createBox(
            "CurrencyBar",
            this.generatedPanel,
            260,
            52,
            this.subPanelColor,
            6
        );
        currencyBar.setPosition(315, 231);
        this.currencyIcon = this.createIcon("CurrencyIcon", currencyBar, 34, cc.v2(-92, 0));
        this.currencyLabel = this.createLabel(
            "CurrencyLabel",
            currencyBar,
            "Coconut: 0",
            20,
            this.textColor,
            185,
            cc.Label.HorizontalAlign.LEFT
        );
        this.currencyLabel.node.setPosition(30, 0);
        ItemIconLoader.apply("coconut", this.currencyIcon);

        const listPanel = this.createBox(
            "ProductListPanel",
            this.generatedPanel,
            390,
            425,
            this.subPanelColor,
            6
        );
        listPanel.setPosition(-248, -22);
        this.createLabel("ListTitle", listPanel, "MERCHANT STOCK", 22, this.textColor, 350)
            .node.setPosition(0, 196);
        this.createScrollView(listPanel);

        const detailPanel = this.createBox(
            "ProductDetailPanel",
            this.generatedPanel,
            470,
            425,
            this.subPanelColor,
            6
        );
        detailPanel.setPosition(205, -22);
        this.buildDetailPanel(detailPanel);

        this.closeButton = this.createButton(
            "CloseButton",
            this.generatedPanel,
            "X",
            cc.v2(-431, 232),
            cc.v2(38, 38),
            () => this.requestClose()
        );

        this.generatedRoot.active = false;
    }

    private createScrollView(parent: cc.Node): void {
        const scrollNode = new cc.Node("ProductScrollView");
        scrollNode.setContentSize(350, 360);
        scrollNode.setPosition(0, -8);
        parent.addChild(scrollNode);

        const view = new cc.Node("view");
        view.setContentSize(350, 360);
        scrollNode.addChild(view);
        view.addComponent(cc.Mask);

        this.itemContent = new cc.Node("content");
        this.itemContent.setAnchorPoint(0.5, 1);
        this.itemContent.setContentSize(340, 360);
        this.itemContent.setPosition(0, 180);
        view.addChild(this.itemContent);

        const layout = this.itemContent.addComponent(cc.Layout);
        layout.type = cc.Layout.Type.VERTICAL;
        layout.resizeMode = cc.Layout.ResizeMode.CONTAINER;
        layout.spacingY = 8;
        layout.paddingTop = 4;
        layout.paddingBottom = 4;

        this.itemScrollView = scrollNode.addComponent(cc.ScrollView);
        this.itemScrollView.content = this.itemContent;
        this.itemScrollView.horizontal = false;
        this.itemScrollView.vertical = true;
        this.itemScrollView.inertia = true;
        this.itemScrollView.brake = 0.75;
    }

    private buildDetailPanel(parent: cc.Node): void {
        const iconFrame = this.createBox(
            "LargeIconFrame",
            parent,
            128,
            128,
            cc.color(18, 25, 33, 255),
            6
        );
        iconFrame.setPosition(-140, 135);
        this.largeItemIcon = this.createIcon("LargeItemIcon", iconFrame, 96, cc.v2(0, 0));

        this.itemNameLabel = this.createLabel(
            "ItemNameLabel",
            parent,
            "",
            25,
            this.textColor,
            260,
            cc.Label.HorizontalAlign.LEFT
        );
        this.itemNameLabel.node.setPosition(75, 176);

        this.descriptionLabel = this.createLabel(
            "DescriptionLabel",
            parent,
            "",
            15,
            this.mutedTextColor,
            270,
            cc.Label.HorizontalAlign.LEFT
        );
        this.descriptionLabel.node.setContentSize(270, 72);
        this.descriptionLabel.node.setPosition(78, 113);
        this.descriptionLabel.overflow = cc.Label.Overflow.CLAMP;
        this.descriptionLabel.enableWrapText = true;

        this.decreaseButton = this.createButton(
            "DecreaseButton",
            parent,
            "-",
            cc.v2(-105, 34),
            cc.v2(54, 48),
            () => this.decreaseAmount()
        );
        const amountBox = this.createBox(
            "AmountBox",
            parent,
            160,
            48,
            cc.color(18, 25, 33, 255),
            4
        );
        amountBox.setPosition(0, 34);
        this.buyAmountLabel = this.createLabel("AmountLabel", amountBox, "1", 21, this.textColor, 140);
        this.increaseButton = this.createButton(
            "IncreaseButton",
            parent,
            "+",
            cc.v2(105, 34),
            cc.v2(54, 48),
            () => this.increaseAmount()
        );

        this.totalPriceLabel = this.createInfoRow(
            parent,
            "TOTAL PRICE",
            -40,
            true,
            20,
            25
        );
        this.playerOwnedLabel = this.createInfoRow(
            parent,
            "OWNED",
            -197,
            false,
            13,
            16,
            220
        );

        this.buyButton = this.createButton(
            "BuyButton",
            parent,
            "BUY",
            cc.v2(0, -143),
            cc.v2(220, 58),
            () => this.buySelected()
        );
        const buyCurrencyIcon = this.createIcon(
            "CurrencyIcon",
            this.buyButton.node,
            26,
            cc.v2(-48, 0)
        );
        ItemIconLoader.apply("coconut", buyCurrencyIcon);
        const buyButtonLabelNode = this.buyButton.node.getChildByName("Label");
        if (buyButtonLabelNode) {
            buyButtonLabelNode.setPosition(18, 0);
        }

        this.statusLabel = this.createLabel(
            "StatusLabel",
            parent,
            "",
            13,
            cc.color(170, 225, 200),
            410
        );
        this.statusLabel.node.setPosition(0, -104);
    }

    private createInfoRow(
        parent: cc.Node,
        title: string,
        y: number,
        showCurrency: boolean,
        titleFontSize: number = 15,
        valueFontSize: number = 18,
        rowWidth: number = 410
    ): cc.Label {
        const row = new cc.Node(`${title.replace(" ", "")}Row`);
        row.setContentSize(rowWidth, 38);
        row.setPosition(0, y);
        parent.addChild(row);

        const compact = rowWidth <= 220;
        const titleWidth = compact ? 130 : 245;
        const titleX = compact ? -42 : -75;
        const valueWidth = compact ? 56 : 90;
        const valueX = compact ? 78 : 158;

        const titleLabel = this.createLabel(
            "TitleLabel",
            row,
            title,
            titleFontSize,
            this.mutedTextColor,
            titleWidth,
            cc.Label.HorizontalAlign.LEFT
        );
        titleLabel.node.setPosition(titleX, 0);

        if (showCurrency) {
            const icon = this.createIcon("CurrencyIcon", row, 25, cc.v2(126, 0));
            ItemIconLoader.apply("coconut", icon);
        }

        const valueLabel = this.createLabel(
            "ValueLabel",
            row,
            "-",
            valueFontSize,
            this.textColor,
            valueWidth,
            cc.Label.HorizontalAlign.RIGHT
        );
        valueLabel.node.setPosition(valueX, 0);
        return valueLabel;
    }

    private ensureItemRowCount(count: number): void {
        while (this.itemRows.length < count) {
            this.itemRows.push(this.createItemRow(this.itemRows.length));
        }
    }

    private createItemRow(index: number): ShopItemRowView {
        const node = new cc.Node(`ItemRow${index}`);
        node.setContentSize(326, 72);
        this.itemContent.addChild(node);

        const background = node.addComponent(cc.Graphics);
        const marker = this.createLabel(
            "SelectionMarker",
            node,
            "",
            22,
            this.textColor,
            22,
            cc.Label.HorizontalAlign.CENTER
        );
        marker.node.setPosition(-150, 0);

        const iconFrame = this.createBox(
            "IconFrame",
            node,
            58,
            58,
            cc.color(18, 25, 33, 255),
            4
        );
        iconFrame.setPosition(-105, 0);
        const icon = this.createIcon("Icon", iconFrame, 46, cc.v2(0, 0));

        const nameLabel = this.createLabel(
            "NameLabel",
            node,
            "",
            17,
            this.textColor,
            130,
            cc.Label.HorizontalAlign.LEFT
        );
        nameLabel.node.setPosition(0, 11);

        const currencyIcon = this.createIcon(
            "CurrencyIcon",
            node,
            20,
            cc.v2(90, 11)
        );
        ItemIconLoader.apply("coconut", currencyIcon);

        const priceLabel = this.createLabel(
            "PriceLabel",
            node,
            "",
            15,
            this.accentColor,
            56,
            cc.Label.HorizontalAlign.RIGHT
        );
        priceLabel.node.setPosition(128, 10);

        const stockLabel = this.createLabel(
            "StockLabel",
            node,
            "",
            12,
            this.mutedTextColor,
            230,
            cc.Label.HorizontalAlign.LEFT
        );
        stockLabel.node.setPosition(52, -17);

        const view: ShopItemRowView = {
            node,
            background,
            selectionMarker: marker,
            icon,
            nameLabel,
            currencyIcon,
            priceLabel,
            stockLabel,
            itemIndex: index
        };

        node.on(cc.Node.EventType.MOUSE_UP, (event: cc.Event.EventMouse) => {
            if (this.isOpen() && event.getButton() === cc.Event.EventMouse.BUTTON_LEFT) {
                event.stopPropagation();
                this.selectItem(view.itemIndex);
            }
        }, this);
        node.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
            if (this.isOpen()) {
                event.stopPropagation();
                this.selectItem(view.itemIndex);
            }
        }, this);

        return view;
    }

    private refreshItemRow(
        view: ShopItemRowView,
        item: MerchantStockItem,
        selected: boolean
    ): void {
        const definition = getItemDefinition(item.itemId);
        view.itemIndex = this.itemRows.indexOf(view);
        view.nameLabel.string = definition ? definition.name : item.itemId;
        view.priceLabel.string = `${item.price}`;
        view.stockLabel.string = item.stock > 0 ? `Stock ${item.stock}` : "SOLD OUT";
        view.selectionMarker.string = selected ? ">" : "";
        view.nameLabel.node.color = item.stock > 0 ? this.textColor : this.mutedTextColor;
        ItemIconLoader.apply(item.itemId, view.icon);

        view.background.clear();
        view.background.fillColor = item.stock <= 0
            ? this.soldOutRowColor
            : selected
                ? this.selectedColor
                : this.normalRowColor;
        view.background.roundRect(-163, -36, 326, 72, 5);
        view.background.fill();
        if (selected) {
            view.background.lineWidth = 2;
            view.background.strokeColor = this.accentColor;
            view.background.stroke();
        }
    }

    private refreshDetails(viewModel: ShopSelectionViewModel): void {
        const hasItem = !!viewModel.item && !!viewModel.definition;

        this.currencyLabel.string = `Coconut  ${viewModel.currencyOwned}`;
        this.itemNameLabel.string = hasItem ? viewModel.definition!.name : "NO ITEMS";
        this.descriptionLabel.string = hasItem
            ? viewModel.definition!.description
            : "This merchant has nothing to sell.";
        this.buyAmountLabel.string = `${this.buyAmount}`;
        this.totalPriceLabel.string = hasItem ? `${viewModel.totalPrice}` : "-";
        this.playerOwnedLabel.string = hasItem ? `${viewModel.playerOwned}` : "-";

        if (hasItem) {
            this.largeItemIcon.node.active = true;
            ItemIconLoader.apply(viewModel.item!.itemId, this.largeItemIcon);
        } else {
            this.largeItemIcon.spriteFrame = null;
            this.largeItemIcon.node.active = false;
        }

        this.setButtonState(this.decreaseButton, hasItem && this.buyAmount > 1);
        this.setButtonState(
            this.increaseButton,
            hasItem && this.buyAmount < viewModel.maxBuyAmount
        );
        this.setButtonState(this.buyButton, viewModel.canBuy);

        if (!viewModel.canBuy) {
            this.setStatus(viewModel.disabledReason, true);
        } else {
            this.setStatus("", false);
        }
    }

    private buildSelectionViewModel(): ShopSelectionViewModel {
        const items = this.getItems();
        const item = items[this.selectedIndex] || null;
        const definition = item ? getItemDefinition(item.itemId) : null;
        const currencyOwned = InventoryManager.instance.getItemCount("coconut");
        const playerOwned = definition
            ? InventoryManager.instance.getItemCount(item!.itemId)
            : 0;
        const totalPrice = item ? item.price * this.buyAmount : 0;

        let maxBuyAmount = 0;
        let disabledReason = "";

        if (!item || !definition) {
            disabledReason = items.length > 0 ? "Invalid item data." : "No items available.";
        } else if (item.stock <= 0) {
            disabledReason = "Sold out.";
        } else if (!InventoryManager.instance.canAddItem(item.itemId, 1)) {
            disabledReason = "Inventory is full.";
        } else if (item.price <= 0) {
            maxBuyAmount = item.stock;
        } else {
            maxBuyAmount = Math.min(item.stock, Math.floor(currencyOwned / item.price));
            if (maxBuyAmount <= 0) {
                disabledReason = "Not enough coconuts.";
            }
        }

        if (maxBuyAmount > 0) {
            this.buyAmount = Math.max(1, Math.min(this.buyAmount, maxBuyAmount));
        } else {
            this.buyAmount = 1;
        }

        const recalculatedTotal = item ? item.price * this.buyAmount : 0;
        const canBuy = !!item
            && !!definition
            && maxBuyAmount >= this.buyAmount
            && InventoryManager.instance.canAddItem(item.itemId, this.buyAmount);

        return {
            item,
            definition,
            currencyOwned,
            playerOwned,
            totalPrice: recalculatedTotal,
            maxBuyAmount,
            canBuy,
            disabledReason
        };
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
    }

    private scrollToSelectedItem(): void {
        if (!this.itemScrollView || this.getItems().length <= 1) {
            return;
        }
        const percent = 1 - this.selectedIndex / Math.max(1, this.getItems().length - 1);
        const scrollView = this.itemScrollView as any;
        if (scrollView.scrollToPercentVertical) {
            scrollView.scrollToPercentVertical(percent, 0.12);
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

    private getDisplayRoot(): cc.Node {
        if (this.buildUIAtRuntime && this.generatedRoot && cc.isValid(this.generatedRoot)) {
            return this.generatedRoot;
        }
        if (this.root && cc.isValid(this.root)) {
            return this.root;
        }
        return this.node;
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

        const target = cc.v2(cameraWorldPos.x, cameraWorldPos.y + this.runtimePanelOffsetY);
        panel.setPosition(panel.parent.convertToNodeSpaceAR(target));
        panel.zIndex = this.uiZIndex;
    }

    private applyPanelZoomScale(): void {
        const panel = this.getDisplayRoot();
        if (!panel || !cc.isValid(panel)) {
            return;
        }
        if (!this.displayRootBaseScale || !cc.isValid(panel)) {
            this.displayRootBaseScale = cc.v2(panel.scaleX || 1, panel.scaleY || 1);
        }

        const zoom = this.getCameraZoomRatio();
        const scaleFactor = 1 / zoom;
        panel.scaleX = this.displayRootBaseScale.x * scaleFactor;
        panel.scaleY = this.displayRootBaseScale.y * scaleFactor;
    }

    private getCameraZoomRatio(): number {
        if (!this.mainCamera || !cc.isValid(this.mainCamera.node)) {
            if (!this.mainCameraNode || !cc.isValid(this.mainCameraNode)) {
                this.mainCameraNode = cc.find("Canvas/Main Camera") || cc.find("Main Camera") || null!;
            }
            this.mainCamera = this.mainCameraNode
                ? this.mainCameraNode.getComponent(cc.Camera) || null!
                : null!;
        }
        return this.mainCamera ? Math.max(0.01, this.mainCamera.zoomRatio || 1) : 1;
    }

    private getCameraWorldPosition(): cc.Vec2 | null {
        if (!this.mainCameraNode || !cc.isValid(this.mainCameraNode)) {
            this.mainCameraNode = cc.find("Canvas/Main Camera") || cc.find("Main Camera") || null!;
        }
        if (!this.mainCameraNode || !cc.isValid(this.mainCameraNode)) {
            return null;
        }
        return this.mainCameraNode.parent
            ? this.mainCameraNode.parent.convertToWorldSpaceAR(
                cc.v2(this.mainCameraNode.x, this.mainCameraNode.y)
            )
            : cc.v2(this.mainCameraNode.x, this.mainCameraNode.y);
    }

    private createBox(
        name: string,
        parent: cc.Node,
        width: number,
        height: number,
        color: cc.Color,
        radius: number
    ): cc.Node {
        const node = new cc.Node(name);
        node.setContentSize(width, height);
        parent.addChild(node);
        const graphics = node.addComponent(cc.Graphics);
        graphics.fillColor = color;
        graphics.roundRect(-width * 0.5, -height * 0.5, width, height, radius);
        graphics.fill();
        return node;
    }

    private createLabel(
        name: string,
        parent: cc.Node,
        text: string,
        size: number,
        color: cc.Color,
        width: number,
        alignment: cc.Label.HorizontalAlign = cc.Label.HorizontalAlign.CENTER
    ): cc.Label {
        const node = new cc.Node(name);
        node.color = color;
        parent.addChild(node);
        const label = node.addComponent(cc.Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = size + 4;
        label.horizontalAlign = alignment;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        label.overflow = cc.Label.Overflow.SHRINK;
        // Adding/configuring cc.Label can restore its auto-sized dimensions in
        // Creator 2.4. Set the constrained size last so generated text is visible.
        node.setContentSize(width, size + 10);
        node.opacity = 255;
        node.zIndex = 10;
        return label;
    }

    private createIcon(
        name: string,
        parent: cc.Node,
        size: number,
        position: cc.Vec2
    ): cc.Sprite {
        const node = new cc.Node(name);
        node.setContentSize(size, size);
        node.setPosition(position);
        parent.addChild(node);
        const sprite = node.addComponent(cc.Sprite);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        return sprite;
    }

    private createButton(
        name: string,
        parent: cc.Node,
        text: string,
        position: cc.Vec2,
        size: cc.Vec2,
        callback: () => void
    ): cc.Button {
        const node = this.createBox(
            name,
            parent,
            size.x,
            size.y,
            this.canBuyColor,
            4
        );
        node.setPosition(position);
        const button = node.addComponent(cc.Button);
        button.transition = cc.Button.Transition.NONE;
        const label = this.createLabel("Label", node, text, 17, this.textColor, size.x - 8);
        label.node.setPosition(0, 0);
        label.node.setContentSize(size.x - 8, size.y);
        label.node.zIndex = 20;

        let lastActivationTime = 0;
        const activate = (event: cc.Event) => {
            event.stopPropagation();
            if (!button.interactable) {
                return;
            }

            // Creator 2.4 browser preview may dispatch TOUCH_END and MOUSE_UP
            // for one physical click. Ignore the duplicate companion event.
            const now = Date.now();
            if (now - lastActivationTime < 120) {
                return;
            }
            lastActivationTime = now;
            callback();
        };
        node.on(cc.Node.EventType.MOUSE_UP, activate, this);
        node.on(cc.Node.EventType.TOUCH_END, activate, this);
        return button;
    }

    private setButtonState(button: cc.Button, enabled: boolean): void {
        if (!button || !button.node || !cc.isValid(button.node)) {
            return;
        }
        button.interactable = enabled;
        const graphics = button.node.getComponent(cc.Graphics);
        if (graphics) {
            graphics.clear();
            graphics.fillColor = enabled ? this.canBuyColor : this.cannotBuyColor;
            graphics.roundRect(
                -button.node.width * 0.5,
                -button.node.height * 0.5,
                button.node.width,
                button.node.height,
                4
            );
            graphics.fill();
        }
    }

    private setStatus(message: string, error: boolean): void {
        if (!this.statusLabel) {
            return;
        }
        this.statusLabel.string = message || "";
        this.statusLabel.node.color = error
            ? cc.color(255, 140, 125)
            : cc.color(170, 225, 200);
    }

    private clearItemRows(): void {
        for (const row of this.itemRows) {
            if (row.node && cc.isValid(row.node)) {
                row.node.off(cc.Node.EventType.MOUSE_UP);
                row.node.off(cc.Node.EventType.TOUCH_END);
            }
        }
        this.itemRows = [];
    }
}

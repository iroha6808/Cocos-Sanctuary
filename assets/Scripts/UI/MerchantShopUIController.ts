import { getItemDefinition } from "../Data/ItemData";
import { MerchantStockItem } from "../Data/MerchantPool";
import MerchantNPC from "../NPC/MerchantNPC";
import { InventoryManager } from "../Player/InventoryManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MerchantShopUIController extends cc.Component {

    @property(cc.Node)
    public root: cc.Node | null = null;

    @property(cc.Label)
    public currencyLabel: cc.Label | null = null;

    @property(cc.Node)
    public itemListRoot: cc.Node | null = null;

    @property(cc.Label)
    public itemNameLabel: cc.Label | null = null;

    @property(cc.Label)
    public descriptionLabel: cc.Label | null = null;

    @property(cc.Label)
    public priceLabel: cc.Label | null = null;

    @property(cc.Label)
    public stockLabel: cc.Label | null = null;

    @property(cc.Label)
    public playerOwnedLabel: cc.Label | null = null;

    @property(cc.Label)
    public buyAmountLabel: cc.Label | null = null;

    @property(cc.Button)
    public buyButton: cc.Button | null = null;

    @property(cc.Color)
    public canBuyColor: cc.Color = cc.Color.GREEN;

    @property(cc.Color)
    public cannotBuyColor: cc.Color = cc.Color.GRAY;

    private merchant: MerchantNPC | null = null;
    private selectedIndex: number = 0;
    private buyAmount: number = 1;

    onLoad() {
        this.close();
    }

    onDestroy() {
        cc.systemEvent.off("INVENTORY_CHANGED", this.refresh, this);
    }

    public open(merchant: MerchantNPC): void {
        this.merchant = merchant;
        this.selectedIndex = 0;
        this.buyAmount = 1;

        if (this.root) {
            this.root.active = true;
        } else {
            this.node.active = true;
        }

        cc.systemEvent.off("INVENTORY_CHANGED", this.refresh, this);
        cc.systemEvent.on("INVENTORY_CHANGED", this.refresh, this);
        this.refresh();
    }

    public close(): void {
        this.merchant = null;
        this.selectedIndex = 0;
        this.buyAmount = 1;

        cc.systemEvent.off("INVENTORY_CHANGED", this.refresh, this);

        if (this.root) {
            this.root.active = false;
        } else {
            this.node.active = false;
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
            this.priceLabel.string = selectedItem ? `Price: ${selectedItem.price} x ${this.buyAmount} = ${cost}` : "Price: -";
        }
        if (this.stockLabel) {
            this.stockLabel.string = selectedItem ? `Merchant Stock: ${selectedItem.stock}` : "Merchant Stock: -";
        }
        if (this.playerOwnedLabel) {
            this.playerOwnedLabel.string = selectedItem ? `Owned: ${ownedCount}` : "Owned: -";
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
            InventoryManager.instance.addItem(item.itemId, this.buyAmount);
            this.refresh();
        }
    }

    public isOpen(): boolean {
        const rootNode = this.root || this.node;
        return !!rootNode && rootNode.active;
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
            const label = child.getComponent(cc.Label) || (child.getChildByName("Label") ? child.getChildByName("Label").getComponent(cc.Label) : null);

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
}

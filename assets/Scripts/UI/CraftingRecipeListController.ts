import RecipeCatalog, { RecipeCatalogEntry } from "../Crafting/RecipeCatalog";
import CraftingSession from "../Crafting/CraftingSession";
import { CraftingRecipe, RecipeType } from "../Data/RecipeData";
import { getItemDefinition } from "../Data/ItemData";
import { InventoryManager } from "../Player/InventoryManager";
import ItemIconLoader from "./ItemIconLoader";
import InventoryUIController from "./InventoryUIController";

const { ccclass } = cc._decorator;

interface CatalogEntryView {
    entry: RecipeCatalogEntry;
    node: cc.Node;
    background: cc.Graphics;
}

interface PreviewSlotView {
    node: cc.Node;
    icon: cc.Sprite;
    countLabel: cc.Label;
    ownedLabel: cc.Label;
    itemId: string | null;
}

@ccclass
export default class CraftingRecipeListController extends cc.Component {
    private craftingRoot: cc.Node = null!;
    private inventoryUI: cc.Node = null!;
    private stationType: string = "crafting_table";
    private onBack: () => void = null!;
    private onUseRecipe: (recipe: CraftingRecipe) => boolean = null!;
    private opened: boolean = false;
    private built: boolean = false;
    private useRecipeInProgress: boolean = false;

    private catalogRoot: cc.Node = null!;
    private detailRoot: cc.Node = null!;
    private scrollView: cc.ScrollView = null!;
    private content: cc.Node = null!;
    private entries: CatalogEntryView[] = [];
    private previewSlots: PreviewSlotView[] = [];
    private selectedRecipeId: string = null!;

    private recipeNameLabel: cc.Label = null!;
    private recipeDescriptionLabel: cc.Label = null!;
    private materialStatusLabel: cc.Label = null!;
    private outputSlot: PreviewSlotView = null!;
    private useRecipeButton: cc.Button = null!;
    private browserWheelHandler: any = null!;

    private inventoryWasActive: boolean = false;
    private tooltipOriginalParent: cc.Node = null!;
    private tooltipOriginalSiblingIndex: number = -1;
    private tooltipOriginalActive: boolean = false;
    private tooltipOriginalZIndex: number = 0;

    private readonly panelColor = cc.color(25, 32, 40, 248);
    private readonly entryColor = cc.color(48, 59, 70, 255);
    private readonly selectedColor = cc.color(68, 88, 104, 255);
    private readonly disabledColor = cc.color(43, 48, 54, 255);
    private readonly accentColor = cc.color(242, 151, 60, 255);

    onLoad(): void {
        cc.systemEvent.on("INVENTORY_CHANGED", this.refreshInventoryState, this);
    }

    onDestroy(): void {
        cc.systemEvent.off("INVENTORY_CHANGED", this.refreshInventoryState, this);
        this.unbindBrowserWheel();
        this.hideTooltip();
        this.restoreInventoryVisuals();
        this.destroyRuntimeRoots();
    }

    public configure(
        craftingRoot: cc.Node,
        inventoryUI: cc.Node,
        stationType: string,
        onBack: () => void,
        onUseRecipe: (recipe: CraftingRecipe) => boolean
    ): void {
        this.craftingRoot = craftingRoot;
        this.inventoryUI = inventoryUI;
        this.stationType = stationType || "crafting_table";
        this.onBack = onBack;
        this.onUseRecipe = onUseRecipe;
    }

    public open(): boolean {
        if (!this.craftingRoot || !this.inventoryUI) {
            cc.warn("[RecipeListUI] Crafting root or InventoryUI is missing.");
            return false;
        }

        this.ensureBuilt();
        if (!this.built) {
            return false;
        }

        this.hideInventoryVisuals();
        this.setCraftingPanelVisible(false);
        this.catalogRoot.active = true;
        this.detailRoot.active = true;
        this.opened = true;
        this.updatePositions();
        this.refreshCatalogSelection();
        this.refreshSelectedRecipe();
        this.bindBrowserWheel();
        if (!this.catalogRoot.activeInHierarchy || !this.detailRoot.activeInHierarchy) {
            cc.warn(
                `[RecipeListUI] Cannot show roots. craftingRoot=${this.craftingRoot.activeInHierarchy}, catalog=${this.catalogRoot.activeInHierarchy}, detail=${this.detailRoot.activeInHierarchy}`
            );
            this.close();
            return false;
        }
        cc.log(
            `[RecipeListUI] visible catalog=${this.catalogRoot.activeInHierarchy}, detail=${this.detailRoot.activeInHierarchy}, entries=${this.entries.length}`
        );
        return true;
    }

    public close(): void {
        if (!this.opened) {
            if (this.catalogRoot && cc.isValid(this.catalogRoot)) {
                this.catalogRoot.active = false;
            }
            if (this.detailRoot && cc.isValid(this.detailRoot)) {
                this.detailRoot.active = false;
            }
            return;
        }

        this.hideTooltip();
        this.unbindBrowserWheel();
        this.opened = false;
        if (this.catalogRoot && cc.isValid(this.catalogRoot)) {
            this.catalogRoot.active = false;
        }
        if (this.detailRoot && cc.isValid(this.detailRoot)) {
            this.detailRoot.active = false;
        }
        this.restoreInventoryVisuals();
        this.setCraftingPanelVisible(true);
    }

    public isOpen(): boolean {
        return this.opened;
    }

    public getSelectedRecipeId(): string | null {
        return this.selectedRecipeId || null;
    }

    public scrollCatalog(scrollY: number): void {
        if (!this.opened || !this.scrollView || !this.content || scrollY === 0) {
            return;
        }

        this.scrollView.stopAutoScroll();
        const current = this.scrollView.getScrollOffset();
        const maximum = this.scrollView.getMaxScrollOffset();
        const nextY = Math.max(
            0,
            Math.min(maximum.y, current.y - scrollY * 0.8)
        );
        this.scrollView.scrollToOffset(cc.v2(0, nextY), 0.08, false);
    }

    public updatePositions(): void {
        if (
            !this.opened
            || !this.catalogRoot
            || !cc.isValid(this.catalogRoot)
        ) {
            return;
        }

        this.catalogRoot.setPosition(-450, 0);
        this.catalogRoot.setScale(0.75, 0.8);
        if (this.detailRoot && cc.isValid(this.detailRoot)) {
            this.detailRoot.setPosition(0, 0);
            this.detailRoot.setScale(1, 1);
        }
    }

    private ensureBuilt(): void {
        if (this.built) {
            return;
        }

        this.buildCatalogPanel();
        this.buildDetailPanel();
        this.built = !!this.catalogRoot && !!this.detailRoot;
        if (!this.selectedRecipeId && this.entries.length > 0) {
            this.selectedRecipeId = this.entries[0].entry.recipe.id;
        }
    }

    private buildCatalogPanel(): void {
        const parent = this.craftingRoot;
        if (!parent) {
            return;
        }

        const oldRoot = parent.getChildByName("RecipeListCatalogRoot");
        if (oldRoot) {
            oldRoot.destroy();
        }

        this.catalogRoot = this.createBox(
            "RecipeListCatalogRoot",
            parent,
            540,
            600,
            this.panelColor
        );
        this.catalogRoot.zIndex = 1100;
        this.catalogRoot.active = false;
        this.catalogRoot.addComponent(cc.BlockInputEvents);

        this.createLabel(
            "Title",
            this.catalogRoot,
            "RECIPE CATALOG",
            25,
            cc.Color.WHITE,
            490
        ).node.setPosition(0, 260);

        const scrollNode = new cc.Node("RecipeScrollView");
        scrollNode.setContentSize(490, 500);
        scrollNode.setPosition(0, -10);
        this.catalogRoot.addChild(scrollNode);
        scrollNode.addComponent(cc.BlockInputEvents);

        const view = new cc.Node("View");
        view.setContentSize(490, 500);
        scrollNode.addChild(view);
        const mask = view.addComponent(cc.Mask);
        mask.type = cc.Mask.Type.RECT;

        this.content = new cc.Node("Content");
        this.content.anchorX = 0.5;
        this.content.anchorY = 1;
        this.content.setContentSize(470, 500);
        this.content.setPosition(0, 250);
        view.addChild(this.content);

        const layout = this.content.addComponent(cc.Layout);
        layout.type = cc.Layout.Type.VERTICAL;
        layout.resizeMode = cc.Layout.ResizeMode.CONTAINER;
        layout.spacingY = 8;
        layout.paddingTop = 4;
        layout.paddingBottom = 4;

        this.scrollView = scrollNode.addComponent(cc.ScrollView);
        this.scrollView.content = this.content;
        this.scrollView.vertical = true;
        this.scrollView.horizontal = false;
        this.scrollView.inertia = true;
        this.scrollView.brake = 0.75;
        this.entries = [];
        for (const entry of RecipeCatalog.getCatalogEntries(this.stationType)) {
            this.entries.push(this.createCatalogEntry(entry));
        }
        layout.updateLayout();
        this.scrollView.scrollToTop(0);
    }

    private createCatalogEntry(entry: RecipeCatalogEntry): CatalogEntryView {
        const node = new cc.Node(`RecipeEntry_${entry.recipe.id}`);
        node.setContentSize(460, 76);
        this.content.addChild(node);
        const background = node.addComponent(cc.Graphics);

        const iconBox = this.createBox(
            "IconBox",
            node,
            58,
            58,
            cc.color(18, 25, 32, 255)
        );
        iconBox.setPosition(-195, 0);
        const iconNode = new cc.Node("Icon");
        iconNode.setContentSize(50, 50);
        iconNode.zIndex = 10;
        iconBox.addChild(iconNode);
        const icon = iconNode.addComponent(cc.Sprite);
        icon.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        ItemIconLoader.apply(entry.recipe.outputItemId, icon);

        const name = this.createLabel(
            "Name",
            node,
            entry.outputName,
            17,
            entry.stationCompatible ? cc.Color.WHITE : cc.color(155, 160, 165),
            270,
            cc.Label.HorizontalAlign.LEFT
        );
        name.node.setPosition(-15, 14);

        const station = this.createLabel(
            "Station",
            node,
            this.formatStation(entry.recipe.stationType),
            12,
            entry.stationCompatible ? cc.color(185, 200, 210) : cc.color(230, 145, 120),
            270,
            cc.Label.HorizontalAlign.LEFT
        );
        station.node.setPosition(-15, -17);

        const outputCount = this.createLabel(
            "OutputCount",
            node,
            `x${entry.recipe.outputCount}`,
            15,
            cc.color(245, 190, 95),
            55
        );
        outputCount.node.setPosition(205, 0);

        node.on(cc.Node.EventType.MOUSE_UP, (event: cc.Event.EventMouse) => {
            event.stopPropagation();
            if (event.getButton() === cc.Event.EventMouse.BUTTON_LEFT) {
                this.selectRecipe(entry.recipe.id);
            }
        }, this);
        node.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
            event.stopPropagation();
            this.selectRecipe(entry.recipe.id);
        }, this);
        node.on(cc.Node.EventType.MOUSE_ENTER, () => {
            this.showTooltip(entry.recipe.outputItemId, node);
        }, this);
        node.on(cc.Node.EventType.MOUSE_LEAVE, this.hideTooltip, this);

        return { entry, node, background };
    }

    private buildDetailPanel(): void {
        const oldRoot = this.craftingRoot.getChildByName("RecipeListDetailRoot");
        if (oldRoot) {
            oldRoot.destroy();
        }

        this.detailRoot = this.createBox(
            "RecipeListDetailRoot",
            this.craftingRoot,
            410,
            500,
            this.panelColor
        );
        this.detailRoot.zIndex = 1100;
        this.detailRoot.active = false;
        this.detailRoot.addComponent(cc.BlockInputEvents);

        this.createLabel(
            "Title",
            this.detailRoot,
            "RECIPE",
            22,
            cc.Color.WHITE,
            360
        ).node.setPosition(0, 218);

        this.outputSlot = this.createPreviewSlot("OutputSlot", this.detailRoot);
        this.outputSlot.node.setPosition(-145, 155);
        this.outputSlot.node.on(cc.Node.EventType.MOUSE_ENTER, () => {
            this.showTooltip(this.outputSlot.itemId, this.outputSlot.node);
        }, this);
        this.outputSlot.node.on(cc.Node.EventType.MOUSE_LEAVE, this.hideTooltip, this);

        this.recipeNameLabel = this.createLabel(
            "RecipeName",
            this.detailRoot,
            "",
            19,
            cc.Color.WHITE,
            250,
            cc.Label.HorizontalAlign.LEFT
        );
        this.recipeNameLabel.node.setPosition(65, 170);

        this.recipeDescriptionLabel = this.createLabel(
            "RecipeDescription",
            this.detailRoot,
            "",
            12,
            cc.color(190, 205, 215),
            250,
            cc.Label.HorizontalAlign.LEFT
        );
        this.recipeDescriptionLabel.node.setContentSize(250, 52);
        this.recipeDescriptionLabel.node.setPosition(65, 128);
        this.recipeDescriptionLabel.overflow = cc.Label.Overflow.SHRINK;

        this.previewSlots = [];
        for (let index = 0; index < 9; index++) {
            const slot = this.createPreviewSlot(`PreviewSlot_${index}`, this.detailRoot);
            const column = index % 3;
            const row = Math.floor(index / 3);
            slot.node.setPosition(-66 + column * 66, 45 - row * 66);
            slot.node.on(cc.Node.EventType.MOUSE_ENTER, () => {
                this.showTooltip(slot.itemId, slot.node);
            }, this);
            slot.node.on(cc.Node.EventType.MOUSE_LEAVE, this.hideTooltip, this);
            this.previewSlots.push(slot);
        }

        this.materialStatusLabel = this.createLabel(
            "MaterialStatus",
            this.detailRoot,
            "",
            13,
            cc.color(170, 225, 200),
            360
        );
        this.materialStatusLabel.node.setPosition(0, -175);

        this.createButton(
            "BackButton",
            this.detailRoot,
            "BACK",
            cc.v2(150, 218),
            () => {
                if (this.onBack) {
                    this.onBack();
                }
            },
            88,
            34
        );

        this.useRecipeButton = this.createButton(
            "UseRecipeButton",
            this.detailRoot,
            "USE RECIPE",
            cc.v2(0, -215),
            () => this.useSelectedRecipe()
        );
    }

    private createPreviewSlot(
        name: string,
        parent: cc.Node
    ): PreviewSlotView {
        const node = this.createBox(name, parent, 58, 58, cc.color(65, 76, 86, 255));
        const iconNode = new cc.Node("Icon");
        iconNode.setContentSize(48, 48);
        iconNode.zIndex = 10;
        node.addChild(iconNode);
        const icon = iconNode.addComponent(cc.Sprite);
        icon.sizeMode = cc.Sprite.SizeMode.CUSTOM;

        const countLabel = this.createLabel(
            "Count",
            node,
            "",
            13,
            cc.Color.WHITE,
            26,
            cc.Label.HorizontalAlign.RIGHT
        );
        countLabel.node.setPosition(13, -20);
        countLabel.node.zIndex = 5;

        const ownedLabel = this.createLabel(
            "Owned",
            node,
            "",
            10,
            cc.color(180, 205, 220),
            40,
            cc.Label.HorizontalAlign.LEFT
        );
        ownedLabel.node.setPosition(-8, 21);
        ownedLabel.node.zIndex = 5;

        return {
            node,
            icon,
            countLabel,
            ownedLabel,
            itemId: null
        };
    }

    private selectRecipe(recipeId: string): void {
        if (!recipeId || this.selectedRecipeId === recipeId) {
            return;
        }
        this.hideTooltip();
        this.selectedRecipeId = recipeId;
        this.refreshCatalogSelection();
        this.refreshSelectedRecipe();
        cc.log(`[RecipeListUI] selected recipe=${recipeId}`);
    }

    private refreshCatalogSelection(): void {
        for (const view of this.entries) {
            const selected = view.entry.recipe.id === this.selectedRecipeId;
            const color = selected
                ? this.selectedColor
                : view.entry.stationCompatible
                    ? this.entryColor
                    : this.disabledColor;
            this.drawBox(view.background, view.node.width, view.node.height, color, selected);
            view.node.opacity = view.entry.stationCompatible ? 255 : 190;
        }
    }

    private refreshSelectedRecipe(): void {
        if (!this.built || this.entries.length === 0) {
            return;
        }

        const selected = this.entries.find(
            view => view.entry.recipe.id === this.selectedRecipeId
        ) || this.entries[0];
        this.selectedRecipeId = selected.entry.recipe.id;
        const recipe = selected.entry.recipe;
        const definition = getItemDefinition(recipe.outputItemId);

        this.recipeNameLabel.string = definition ? definition.name : recipe.outputItemId;
        this.recipeDescriptionLabel.string = definition ? definition.description : "";
        this.setPreviewSlot(this.outputSlot, recipe.outputItemId, recipe.outputCount, false);
        const grid = RecipeCatalog.getPreviewGrid(recipe);
        for (let index = 0; index < this.previewSlots.length; index++) {
            this.setPreviewSlot(
                this.previewSlots[index],
                grid[index].itemId,
                grid[index].count,
                true
            );
        }

        const missing = CraftingSession.shared.getMissingRequirementsForLoad(recipe);
        const canLoad = selected.entry.stationCompatible && missing.length === 0;
        this.setButtonState(this.useRecipeButton, canLoad);
        if (!selected.entry.stationCompatible) {
            this.materialStatusLabel.string =
                `Requires ${this.formatStation(recipe.stationType)}`;
            this.materialStatusLabel.node.color = cc.color(255, 145, 120);
        } else if (missing.length > 0) {
            this.materialStatusLabel.string =
                `Missing: ${this.formatMissingRequirements(missing)}`;
            this.materialStatusLabel.node.color = cc.color(255, 145, 120);
        } else {
            this.materialStatusLabel.string = "Materials available";
            this.materialStatusLabel.node.color = cc.color(170, 225, 200);
        }
    }

    private useSelectedRecipe(): void {
        if (this.useRecipeInProgress || !this.opened) {
            return;
        }
        const selected = this.entries.find(
            view => view.entry.recipe.id === this.selectedRecipeId
        );
        if (!selected || !this.onUseRecipe) {
            return;
        }

        this.useRecipeInProgress = true;
        const loaded = this.onUseRecipe(selected.entry.recipe);
        this.useRecipeInProgress = false;
        if (!loaded) {
            this.refreshSelectedRecipe();
            this.materialStatusLabel.string =
                "Unable to load recipe. Check inventory space.";
            this.materialStatusLabel.node.color = cc.color(255, 145, 120);
        }
    }

    private onCatalogMouseWheel(event: cc.Event.EventMouse): void {
        event.stopPropagation();
        this.scrollCatalog(event.getScrollY());
    }

    private bindBrowserWheel(): void {
        if (this.browserWheelHandler) {
            return;
        }

        const canvas = (cc.game as any).canvas;
        if (!canvas || !canvas.addEventListener) {
            return;
        }

        this.browserWheelHandler = (event: any) => {
            if (!this.opened || !this.isPointerOverCatalog(event, canvas)) {
                return;
            }

            // Browser deltaY is positive when scrolling down; Cocos scrollY uses
            // the opposite sign in this project.
            this.scrollCatalog(-event.deltaY);
            if (event.preventDefault) {
                event.preventDefault();
            }
            if (event.stopPropagation) {
                event.stopPropagation();
            }
        };
        canvas.addEventListener("wheel", this.browserWheelHandler, false);
    }

    private unbindBrowserWheel(): void {
        if (!this.browserWheelHandler) {
            return;
        }

        const canvas = (cc.game as any).canvas;
        if (canvas && canvas.removeEventListener) {
            canvas.removeEventListener("wheel", this.browserWheelHandler, false);
        }
        this.browserWheelHandler = null!;
    }

    private isPointerOverCatalog(event: any, canvas: any): boolean {
        if (!event || !canvas || !canvas.getBoundingClientRect) {
            return true;
        }

        const rect = canvas.getBoundingClientRect();
        const clientX = typeof event.clientX === "number"
            ? event.clientX
            : rect.left;
        return clientX >= rect.left && clientX <= rect.left + rect.width * 0.52;
    }

    private refreshInventoryState(): void {
        if (this.opened) {
            this.refreshSelectedRecipe();
        }
    }

    private setPreviewSlot(
        view: PreviewSlotView,
        itemId: string | null,
        count: number,
        showOwned: boolean
    ): void {
        view.itemId = itemId;
        if (!itemId) {
            view.icon.spriteFrame = null!;
            view.icon.node.active = false;
            view.countLabel.string = "";
            view.ownedLabel.string = "";
            return;
        }

        ItemIconLoader.apply(itemId, view.icon);
        view.countLabel.string = count > 0 ? `x${count}` : "";
        if (!showOwned) {
            view.ownedLabel.string = "";
            return;
        }

        const owned = InventoryManager.instance.getItemCount(itemId);
        view.ownedLabel.string = `${owned}`;
        view.ownedLabel.node.color = owned >= count
            ? cc.color(180, 220, 190)
            : cc.color(255, 130, 120);
    }

    private hideInventoryVisuals(): void {
        if (!this.inventoryUI || !this.catalogRoot || this.tooltipOriginalParent) {
            return;
        }

        const inventoryController = this.getInventoryController();
        const tooltip = inventoryController ? inventoryController.descriptionTooltip : null;
        if (tooltip && cc.isValid(tooltip) && tooltip.parent) {
            this.tooltipOriginalParent = tooltip.parent;
            this.tooltipOriginalSiblingIndex = tooltip.getSiblingIndex();
            this.tooltipOriginalActive = tooltip.active;
            this.tooltipOriginalZIndex = tooltip.zIndex;
            tooltip.removeFromParent(false);
            this.catalogRoot.addChild(tooltip);
            tooltip.zIndex = 2000;
            tooltip.active = false;
        }
        this.inventoryWasActive = this.inventoryUI.active;
        this.inventoryUI.active = false;
    }

    private restoreInventoryVisuals(): void {
        if (!this.inventoryUI || !cc.isValid(this.inventoryUI)) {
            this.tooltipOriginalParent = null!;
            return;
        }

        const inventoryController = this.getInventoryController();
        const tooltip = inventoryController ? inventoryController.descriptionTooltip : null;
        if (
            tooltip
            && cc.isValid(tooltip)
            && this.tooltipOriginalParent
            && cc.isValid(this.tooltipOriginalParent)
        ) {
            tooltip.active = false;
            tooltip.removeFromParent(false);
            this.tooltipOriginalParent.addChild(tooltip);
            if (this.tooltipOriginalSiblingIndex >= 0) {
                tooltip.setSiblingIndex(this.tooltipOriginalSiblingIndex);
            }
            tooltip.zIndex = this.tooltipOriginalZIndex;
            tooltip.active = this.tooltipOriginalActive;
        }
        this.tooltipOriginalParent = null!;
        this.tooltipOriginalSiblingIndex = -1;
        this.inventoryUI.active = this.inventoryWasActive;
    }

    private setCraftingPanelVisible(visible: boolean): void {
        if (!this.craftingRoot || !cc.isValid(this.craftingRoot)) {
            return;
        }
        const panel = this.craftingRoot.getChildByName("GeneratedCraftingPanel");
        if (panel && cc.isValid(panel)) {
            panel.active = visible;
        }
    }

    private showTooltip(itemId: string | null, anchorNode: cc.Node): void {
        const controller = this.getInventoryController();
        if (controller && itemId) {
            controller.showItemTooltip(itemId, anchorNode);
        }
    }

    private hideTooltip(): void {
        const controller = this.getInventoryController();
        if (controller) {
            controller.hideItemTooltip();
        }
    }

    private getInventoryController(): InventoryUIController | null {
        if (!this.inventoryUI || !cc.isValid(this.inventoryUI)) {
            return null;
        }
        return this.inventoryUI.getComponent(InventoryUIController) || null;
    }

    private formatStation(stationType: string): string {
        return (stationType || "crafting_table")
            .split("_")
            .map(part => part ? part.charAt(0).toUpperCase() + part.slice(1) : "")
            .join(" ");
    }

    private formatMissingRequirements(missing: { itemId: string; count: number }[]): string {
        return missing.slice(0, 3).map(requirement => {
            const definition = getItemDefinition(requirement.itemId);
            return `${definition ? definition.name : requirement.itemId} x${requirement.count}`;
        }).join(", ");
    }

    private createBox(
        name: string,
        parent: cc.Node,
        width: number,
        height: number,
        color: cc.Color
    ): cc.Node {
        const node = new cc.Node(name);
        node.setContentSize(width, height);
        parent.addChild(node);
        const graphics = node.addComponent(cc.Graphics);
        this.drawBox(graphics, width, height, color, false);
        return node;
    }

    private drawBox(
        graphics: cc.Graphics,
        width: number,
        height: number,
        color: cc.Color,
        selected: boolean
    ): void {
        graphics.clear();
        graphics.fillColor = color;
        graphics.roundRect(-width * 0.5, -height * 0.5, width, height, 5);
        graphics.fill();
        if (selected) {
            graphics.lineWidth = 2;
            graphics.strokeColor = this.accentColor;
            graphics.roundRect(-width * 0.5, -height * 0.5, width, height, 5);
            graphics.stroke();
        }
    }

    private createLabel(
        name: string,
        parent: cc.Node,
        text: string,
        fontSize: number,
        color: cc.Color,
        width: number,
        horizontalAlign: cc.Label.HorizontalAlign = cc.Label.HorizontalAlign.CENTER
    ): cc.Label {
        const node = new cc.Node(name);
        node.color = color;
        node.zIndex = 10;
        node.setContentSize(width, fontSize + 8);
        parent.addChild(node);
        const label = node.addComponent(cc.Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 4;
        label.horizontalAlign = horizontalAlign;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        label.overflow = cc.Label.Overflow.SHRINK;
        return label;
    }

    private createButton(
        name: string,
        parent: cc.Node,
        text: string,
        position: cc.Vec2,
        callback: () => void,
        width: number = 130,
        height: number = 38
    ): cc.Button {
        const node = this.createBox(name, parent, width, height, cc.color(55, 150, 105));
        node.setPosition(position);
        const button = node.addComponent(cc.Button);
        button.transition = cc.Button.Transition.NONE;
        const label = this.createLabel("Label", node, text, 14, cc.Color.WHITE, width);
        label.node.setContentSize(width, height);
        label.node.zIndex = 2;
        node.on(cc.Node.EventType.MOUSE_UP, (event: cc.Event.EventMouse) => {
            event.stopPropagation();
            if (
                button.interactable
                && event.getButton() === cc.Event.EventMouse.BUTTON_LEFT
            ) {
                callback();
            }
        }, this);
        node.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
            event.stopPropagation();
            if (button.interactable) {
                callback();
            }
        }, this);
        return button;
    }

    private setButtonState(button: cc.Button, enabled: boolean): void {
        if (!button || !button.node || !cc.isValid(button.node)) {
            return;
        }

        button.interactable = enabled;
        const graphics = button.node.getComponent(cc.Graphics);
        if (graphics) {
            this.drawBox(
                graphics,
                button.node.width,
                button.node.height,
                enabled ? cc.color(55, 150, 105) : cc.color(95, 95, 95),
                false
            );
        }
    }

    private destroyRuntimeRoots(): void {
        if (this.catalogRoot && cc.isValid(this.catalogRoot)) {
            this.catalogRoot.destroy();
        }
        if (this.detailRoot && cc.isValid(this.detailRoot)) {
            this.detailRoot.destroy();
        }
        this.catalogRoot = null!;
        this.detailRoot = null!;
        this.entries = [];
        this.previewSlots = [];
        this.built = false;
    }
}

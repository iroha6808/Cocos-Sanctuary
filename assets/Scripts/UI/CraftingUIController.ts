import CraftingSession from "../Crafting/CraftingSession";
import { getItemDefinition } from "../Data/ItemData";
import { InventoryManager } from "../Player/InventoryManager";
import ItemIconLoader from "./ItemIconLoader";
import InputManager from "../Input/InputManager";
import { InputAction, InputPayload } from "../Input/InputAction";
import { InputContext } from "../Input/InputContext";

const { ccclass, property } = cc._decorator;

// Reuses the scene's existing InventoryUI and its slot visuals.
interface CraftSlotView {
    node: cc.Node;
    icon: cc.Sprite;
    countLabel: cc.Label;
}

interface CraftingDragPayload {
    source: "inventory" | "crafting";
    sourceIndex: number;
    itemId: string;
    count: number;
}

interface DragState {
    payload: CraftingDragPayload;
    startWorld: cc.Vec2;
    sourceNode: cc.Node;
    didDrag: boolean;
}

@ccclass
export default class CraftingUIController extends cc.Component {

    @property(cc.Node)
    public root: cc.Node = null!;

    @property(cc.Node)
    public inventoryUI: cc.Node = null!;

    @property(cc.Boolean)
    public buildUIAtRuntime: boolean = true;

    @property(cc.Node)
    public mainCameraNode: cc.Node = null!;

    @property(cc.Boolean)
    public followMainCamera: boolean = true;

    @property(cc.Boolean)
    public clampToCameraView: boolean = true;

    @property(cc.Float)
    public screenPadding: number = 24;

    @property(cc.Float)
    public craftingPanelOffsetY: number = 0;

    private opened: boolean = false;
    private selectedItemId: string = null!;
    private craftingSlots: CraftSlotView[] = [];
    private resultSlot: CraftSlotView = null!;
    private recipeNameLabel: cc.Label = null!;
    private recipeDescriptionLabel: cc.Label = null!;
    private craftableCountLabel: cc.Label = null!;
    private selectedItemLabel: cc.Label = null!;
    private statusLabel: cc.Label = null!;
    private craftButton: cc.Button = null!;
    private craftMaxButton: cc.Button = null!;
    private inventoryGrid: cc.Node = null!;
    private inventoryWasActive: boolean = false;
    private inventoryOriginalPosition: cc.Vec2 = null!;
    private inventoryOriginalScale: cc.Vec2 = null!;
    private inventoryWidgets: cc.Widget[] = [];
    private inventoryWidgetStates: boolean[] = [];
    private inventoryListenersBound: boolean = false;
    private isDestroying: boolean = false;
    private canvasNode: cc.Node = null!;
    private mainCamera: cc.Camera = null!;
    private dragEventNode: cc.Node = null!;
    private dragState: DragState = null!;
    private dragVisual: CraftSlotView = null!;
    private highlightedNode: cc.Node = null!;
    private highlightedColor: cc.Color = null!;
    private inputManager: InputManager = null!;

    private readonly enabledColor = cc.color(55, 150, 105);
    private readonly disabledColor = cc.color(95, 95, 95);

    onLoad() {
        this.setupReferences();
        this.resolveSceneNodes();
        this.ensureUIRenderOrder();
        if (this.buildUIAtRuntime) {
            this.buildCraftingPanel();
        }

        this.inputManager = InputManager.getOrCreate(this.node);
        cc.systemEvent.on("INVENTORY_CHANGED", this.refresh, this);
        cc.systemEvent.on("CRAFTING_SESSION_CHANGED", this.refresh, this);
        this.bindGlobalDragEvents();
        this.setVisible(false);
        cc.log(
            `[CraftingUI] loaded root=${!!this.root}, inventory=${!!this.inventoryUI}, slots=${this.craftingSlots.length}`
        );
    }


    update() {
        if (!this.opened || !this.followMainCamera) {
            return;
        }

        this.updatePanelPosition();
    }

    public open(): boolean {
        this.setupReferences();
        this.resolveSceneNodes();
        if (!this.root || !this.inventoryUI) {
            cc.warn("[CraftingUI] Root or InventoryUI is missing.");
            return false;
        }

        if (this.opened) {
            return true;
        }

        this.inventoryWasActive = this.inventoryUI.active;
        this.inventoryOriginalPosition = cc.v2(this.inventoryUI.x, this.inventoryUI.y);
        this.inventoryOriginalScale = cc.v2(this.inventoryUI.scaleX, this.inventoryUI.scaleY);
        this.suspendInventoryWidgets();

        this.opened = true;
        this.sanitizeRenderComponents(this.inventoryUI);
        this.sanitizeRenderComponents(this.root);
        this.inventoryUI.active = true;
        this.ensureUIRenderOrder();
        this.layoutInventoryAndCrafting();
        this.setVisible(true);
        this.updatePanelPosition();
        this.bindInventorySelection();
        this.refresh();

        cc.log("[CraftingUI] opened: inventory left, crafting table right");
        if (this.inputManager) {
            this.inputManager.pushContext(InputContext.Crafting, this.handleCraftingInput, this);
        }
        cc.systemEvent.emit("CRAFTING_UI_OPENED");
        return true;
    }

    public close(): boolean {
        if (!this.opened) {
            this.setVisible(false);
            return true;
        }

        this.cancelDrag();
        if (!CraftingSession.shared.returnAllToInventory()) {
            this.setStatus("Inventory is full. Clear space before closing.", true);
            return false;
        }

        this.restoreInventory();

        const inventoryController = this.inventoryUI
            ? this.inventoryUI.getComponent("InventoryUIController") as any
            : null;
        if (inventoryController) {
            inventoryController.followMainCamera = true;
        }

        this.selectedItemId = null!;
        this.opened = false;
        this.setVisible(false);

        if (this.inputManager) {
            this.inputManager.popContext(InputContext.Crafting, this);
        }

        cc.log("[CraftingUI] closed");
        cc.systemEvent.emit("CRAFTING_UI_CLOSED");
        return true;
    }

    public toggle(): boolean {
        return this.opened ? this.close() : this.open();
    }

    public isOpen(): boolean {
        return this.opened;
    }

    public handleInput(action: InputAction): boolean {
        if (!this.opened) {
            return false;
        }

        if (action === InputAction.Cancel || action === InputAction.Crafting) {
            this.close();
            return true;
        }

        return true;
    }

    public refresh(): void {
        if (this.isDestroying || !this.opened) {
            return;
        }

        if (this.selectedItemId && !InventoryManager.instance.hasItem(this.selectedItemId)) {
            this.selectedItemId = null!;
        }

        this.refreshCraftingGrid();
        this.refreshResult();
        this.refreshSelection();
    }

    public onCraftClicked(): void {
        if (!CraftingSession.shared.craftOnce()) {
            this.setStatus("Cannot craft this result.", true);
            return;
        }
        this.setStatus("Crafted successfully.");
        this.refresh();
    }

    public onCraftMaxClicked(): void {
        const crafted = CraftingSession.shared.craftMax();
        if (crafted <= 0) {
            this.setStatus("Cannot craft any result.", true);
            return;
        }
        this.setStatus(`Crafted ${crafted} time${crafted === 1 ? "" : "s"}.`);
        this.refresh();
    }

    public onCloseClicked(): void {
        this.close();
    }

    onDestroy() {
        this.isDestroying = true;
        this.cancelDrag();
        cc.systemEvent.off("INVENTORY_CHANGED", this.refresh, this);
        cc.systemEvent.off("CRAFTING_SESSION_CHANGED", this.refresh, this);
        if (this.inputManager) {
            this.inputManager.clearOwner(this);
        }
        this.unbindGlobalDragEvents();
        if (!CraftingSession.shared.isEmpty()) {
            CraftingSession.shared.returnAllToInventory();
        }
        this.restoreInventory();
        if (this.dragVisual && this.dragVisual.node && cc.isValid(this.dragVisual.node)) {
            this.dragVisual.node.destroy();
        }
    }

    private handleCraftingInput(payload: InputPayload): boolean {
        if (!payload.isDown) {
            return true;
        }

        return this.handleInput(payload.action);
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
    }

    private resolveSceneNodes(): void {
        if (!this.root) {
            this.root = this.node.getChildByName("CraftingUIRoot") || null!;
        }
        if (!this.inventoryUI) {
            this.inventoryUI = cc.find("Canvas/InventoryUI") || null!;
        }
        if (!this.canvasNode) {
            this.canvasNode = cc.find("Canvas") || null!;
        }
        if (!this.mainCameraNode) {
            this.mainCameraNode = cc.find("Canvas/Main Camera") || cc.find("Main Camera") || null!;
        }
        if (!this.mainCamera && this.mainCameraNode) {
            this.mainCamera = this.mainCameraNode.getComponent(cc.Camera) || null!;
        }
        if (this.inventoryUI && !this.inventoryGrid) {
            const container = this.inventoryUI.getChildByName("GridContainer");
            this.inventoryGrid = container ? (container.getChildByName("New Layout") || null!) : null!;
        }
    }

    private ensureUIRenderOrder(): void {
        if (!this.root) {
            return;
        }

        const host = this.root.parent;
        const uiRoot = host ? host.parent : null;
        if (uiRoot) {
            uiRoot.zIndex = 100000;
        }
        if (host) {
            host.zIndex = 1000;
        }
        this.root.zIndex = 1000;
        if (this.inventoryUI && cc.isValid(this.inventoryUI)) {
            this.inventoryUI.zIndex = 1000;
        }
    }

    private layoutInventoryAndCrafting(): void {
        if (!this.inventoryUI || !this.root) {
            return;
        }

        const inventoryController = this.inventoryUI.getComponent("InventoryUIController") as any;
        if (inventoryController) {
            inventoryController.followMainCamera = false;
        }

        this.inventoryUI.setScale(0.8, 0.8);
        this.updatePanelPosition();
    }


    private updatePanelPosition(): void {
        if (!this.root || !cc.isValid(this.root) || !this.root.parent || !this.inventoryUI || !cc.isValid(this.inventoryUI) || !this.inventoryUI.parent) {
            return;
        }

        const cameraWorldPos = this.getCameraWorldPosition();
        if (!cameraWorldPos) {
            return;
        }

        const inventoryTargetCenter = cc.v2(
            cameraWorldPos.x - 340,
            cameraWorldPos.y + this.craftingPanelOffsetY
        );

        const craftingTargetCenter = cc.v2(
            cameraWorldPos.x + 340,
            cameraWorldPos.y + this.craftingPanelOffsetY
        );

        this.inventoryUI.setPosition(this.inventoryUI.parent.convertToNodeSpaceAR(inventoryTargetCenter));
        this.root.setPosition(this.root.parent.convertToNodeSpaceAR(craftingTargetCenter));

        this.alignNodeContentCenterToWorld(this.inventoryUI, inventoryTargetCenter);
        this.alignNodeContentCenterToWorld(this.root, craftingTargetCenter);

        if (this.clampToCameraView) {
            this.clampNodeToCameraView(this.inventoryUI);
            this.clampNodeToCameraView(this.root);
        }

        this.ensureUIRenderOrder();
    }

    private alignNodeContentCenterToWorld(node: cc.Node, targetCenterWorldPos: cc.Vec2): void {
        if (!node || !cc.isValid(node) || !node.parent) {
            return;
        }

        const contentBounds = this.getVisibleContentWorldBounds(node);
        if (!contentBounds) {
            return;
        }

        const contentCenterX = (contentBounds.xMin + contentBounds.xMax) * 0.5;
        const contentCenterY = (contentBounds.yMin + contentBounds.yMax) * 0.5;

        const deltaX = targetCenterWorldPos.x - contentCenterX;
        const deltaY = targetCenterWorldPos.y - contentCenterY;

        const nodeWorldPos = node.parent.convertToWorldSpaceAR(cc.v2(node.x, node.y));
        const correctedWorldPos = cc.v2(nodeWorldPos.x + deltaX, nodeWorldPos.y + deltaY);

        node.setPosition(node.parent.convertToNodeSpaceAR(correctedWorldPos));
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

    private getCameraVisibleWorldBounds(): { minX: number; maxX: number; minY: number; maxY: number; } | null {
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

    private clampNodeToCameraView(node: cc.Node): void {
        const cameraBounds = this.getCameraVisibleWorldBounds();
        const contentBounds = this.getVisibleContentWorldBounds(node);

        if (!cameraBounds || !contentBounds || !node || !cc.isValid(node) || !node.parent) {
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

        const nodeWorldPos = node.parent.convertToWorldSpaceAR(cc.v2(node.x, node.y));
        const correctedWorldPos = cc.v2(nodeWorldPos.x + offsetX, nodeWorldPos.y + offsetY);
        node.setPosition(node.parent.convertToNodeSpaceAR(correctedWorldPos));
    }

    private getVisibleContentWorldBounds(rootNode: cc.Node): { xMin: number; xMax: number; yMin: number; yMax: number; } | null {
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

    private restoreInventory(): void {
        if (!this.inventoryUI || !cc.isValid(this.inventoryUI)) {
            return;
        }
        if (this.inventoryOriginalPosition) {
            this.inventoryUI.setPosition(this.inventoryOriginalPosition);
        }
        if (this.inventoryOriginalScale) {
            this.inventoryUI.setScale(this.inventoryOriginalScale.x, this.inventoryOriginalScale.y);
        }
        this.restoreInventoryWidgets();
        this.inventoryUI.active = this.inventoryWasActive;
    }

    private suspendInventoryWidgets(): void {
        this.inventoryWidgets = this.inventoryUI
            ? this.inventoryUI.getComponents(cc.Widget)
            : [];
        this.inventoryWidgetStates = this.inventoryWidgets.map(widget => widget.enabled);
        for (const widget of this.inventoryWidgets) {
            widget.enabled = false;
        }
    }

    private restoreInventoryWidgets(): void {
        for (let index = 0; index < this.inventoryWidgets.length; index++) {
            const widget = this.inventoryWidgets[index];
            if (widget && cc.isValid(widget)) {
                widget.enabled = this.inventoryWidgetStates[index];
            }
        }
        this.inventoryWidgets = [];
        this.inventoryWidgetStates = [];
    }

    private bindInventorySelection(): void {
        if (this.inventoryListenersBound || !this.inventoryGrid) {
            return;
        }

        const slots = this.inventoryGrid.children;
        for (let index = 0; index < slots.length; index++) {
            slots[index].on(cc.Node.EventType.MOUSE_DOWN, (event: cc.Event.EventMouse) => {
                if (!this.opened || event.getButton() !== cc.Event.EventMouse.BUTTON_LEFT) {
                    return;
                }
                const item = InventoryManager.instance.getItemsSnapshot()[index];
                if (item) {
                    this.beginDrag({
                        source: "inventory",
                        sourceIndex: index,
                        itemId: item.id,
                        count: 1
                    }, slots[index], event.getLocation());
                }
            }, this);
            slots[index].on(cc.Node.EventType.TOUCH_START, (event: cc.Event.EventTouch) => {
                if (!this.opened) {
                    return;
                }
                const item = InventoryManager.instance.getItemsSnapshot()[index];
                if (item) {
                    this.beginDrag({
                        source: "inventory",
                        sourceIndex: index,
                        itemId: item.id,
                        count: 1
                    }, slots[index], event.getLocation());
                }
            }, this);
            slots[index].on(cc.Node.EventType.MOUSE_UP, (event: cc.Event.EventMouse) => {
                if (!this.opened || event.getButton() !== cc.Event.EventMouse.BUTTON_LEFT) {
                    return;
                }
                if (this.dragState && this.dragState.didDrag) {
                    this.onPointerEnd(event);
                    event.stopPropagation();
                    return;
                }
                event.stopPropagation();
                const item = InventoryManager.instance.getItemsSnapshot()[index];
                this.selectedItemId = item ? item.id : null!;
                this.setStatus(item ? `Selected ${item.name}.` : "Selection cleared.");
                this.refreshSelection();
            }, this);
            slots[index].on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
                if (this.dragState && this.dragState.didDrag) {
                    this.onPointerEnd(event);
                    event.stopPropagation();
                }
            }, this);
        }
        this.inventoryListenersBound = true;
    }

    private buildCraftingPanel(): void {
        if (!this.root) {
            cc.warn("[CraftingUI] Cannot build panel: root is missing.");
            return;
        }

        const oldPanel = this.root.getChildByName("GeneratedCraftingPanel");
        if (oldPanel) {
            oldPanel.destroy();
        }

        this.root.setContentSize(410, 500);
        if (!this.root.getComponent(cc.BlockInputEvents)) {
            this.root.addComponent(cc.BlockInputEvents);
        }

        const panel = this.createBox("GeneratedCraftingPanel", this.root, 410, 500, cc.color(25, 32, 40, 245));
        this.createLabel("Title", panel, "CRAFTING", 24, cc.Color.WHITE).node.setPosition(0, 215);
        this.selectedItemLabel = this.createLabel("Selected", panel, "Selected: none", 14, cc.color(210, 220, 230));
        this.selectedItemLabel.node.setPosition(0, 180);

        const slotTemplate = this.getInventorySlotTemplate();
        this.craftingSlots = [];
        for (let index = 0; index < 9; index++) {
            const slot = this.createStyledSlot(slotTemplate, `CraftSlot${index}`, panel);
            const column = index % 3;
            const row = Math.floor(index / 3);
            slot.node.setPosition(-125 + column * 72, 105 - row * 72);
            slot.node.on(cc.Node.EventType.MOUSE_UP, (event: cc.Event.EventMouse) => {
                if (this.dragState && this.dragState.didDrag) {
                    this.onPointerEnd(event);
                    event.stopPropagation();
                    return;
                }
                event.stopPropagation();
                this.onCraftingSlotClicked(index, event);
            }, this);
            slot.node.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
                if (this.dragState && this.dragState.didDrag) {
                    this.onPointerEnd(event);
                    event.stopPropagation();
                }
            }, this);
            slot.node.on(cc.Node.EventType.MOUSE_DOWN, (event: cc.Event.EventMouse) => {
                if (!this.opened || event.getButton() !== cc.Event.EventMouse.BUTTON_LEFT) {
                    return;
                }
                const current = CraftingSession.shared.getGrid()[index];
                if (current.itemId) {
                    this.beginDrag({
                        source: "crafting",
                        sourceIndex: index,
                        itemId: current.itemId,
                        count: current.count
                    }, slot.node, event.getLocation());
                }
            }, this);
            slot.node.on(cc.Node.EventType.TOUCH_START, (event: cc.Event.EventTouch) => {
                if (!this.opened) {
                    return;
                }
                const current = CraftingSession.shared.getGrid()[index];
                if (current.itemId) {
                    this.beginDrag({
                        source: "crafting",
                        sourceIndex: index,
                        itemId: current.itemId,
                        count: current.count
                    }, slot.node, event.getLocation());
                }
            }, this);
            this.craftingSlots.push(slot);
        }

        this.createLabel("Arrow", panel, ">", 30, cc.Color.WHITE).node.setPosition(95, 35);
        this.resultSlot = this.createStyledSlot(slotTemplate, "ResultSlot", panel);
        this.resultSlot.node.setPosition(150, 35);
        this.resultSlot.node.on(cc.Node.EventType.MOUSE_UP, (event: cc.Event.EventMouse) => {
            event.stopPropagation();
            if (event.getButton() === cc.Event.EventMouse.BUTTON_LEFT) {
                this.claimResult();
            }
        }, this);
        this.resultSlot.node.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
            event.stopPropagation();
            this.claimResult();
        }, this);
        this.createLabel("ResultHint", panel, "Click result to collect", 12, cc.color(205, 220, 235))
            .node.setPosition(118, -12);

        this.recipeNameLabel = this.createLabel("RecipeName", panel, "No matching recipe", 17, cc.Color.WHITE);
        this.recipeNameLabel.node.setPosition(20, -120);
        this.recipeDescriptionLabel = this.createLabel("RecipeDescription", panel, "", 12, cc.color(195, 205, 215));
        this.recipeDescriptionLabel.node.setContentSize(360, 42);
        this.recipeDescriptionLabel.node.setPosition(0, -150);
        this.craftableCountLabel = this.createLabel("CraftableCount", panel, "Craftable: 0", 14, cc.Color.WHITE);
        this.craftableCountLabel.node.setPosition(0, -180);

        this.craftButton = this.createButton("CraftButton", panel, "CRAFT", cc.v2(-72, -215), () => this.onCraftClicked());
        this.craftMaxButton = this.createButton("CraftMaxButton", panel, "CRAFT MAX", cc.v2(72, -215), () => this.onCraftMaxClicked());
        this.statusLabel = this.createLabel("Status", panel, "", 12, cc.color(170, 225, 200));
        this.statusLabel.node.setPosition(0, -242);
        this.createDragVisual(slotTemplate);
        cc.log(`[CraftingUI] panel built with ${this.craftingSlots.length} crafting slots`);
    }

    private getInventorySlotTemplate(): cc.Node {
        this.resolveSceneNodes();
        return this.inventoryGrid && this.inventoryGrid.children.length > 0
            ? this.inventoryGrid.children[0]
            : null!;
    }

    private createStyledSlot(
        template: cc.Node,
        name: string,
        parent: cc.Node
    ): CraftSlotView {
        let node: cc.Node;
        if (template) {
            node = cc.instantiate(template);
            node.name = name;
            node.active = true;
            node.setScale(1, 1);
            this.sanitizeRenderComponents(node);
        } else {
            node = this.createBox(name, parent, 60, 60, cc.color(70, 80, 90));
        }
        if (!node.parent) {
            parent.addChild(node);
        } else if (node.parent !== parent) {
            node.removeFromParent(false);
            parent.addChild(node);
        }

        const iconNode = node.getChildByName("Icon") || new cc.Node("Icon");
        if (!iconNode.parent) {
            node.addChild(iconNode);
        }
        iconNode.zIndex = 10;
        let icon = iconNode.getComponent(cc.Sprite);
        if (!icon) {
            icon = iconNode.addComponent(cc.Sprite);
        }

        const labelNode = node.getChildByName("Label") || new cc.Node("Label");
        if (!labelNode.parent) {
            node.addChild(labelNode);
        }
        labelNode.zIndex = 20;
        let countLabel = labelNode.getComponent(cc.Label);
        if (!countLabel) {
            countLabel = labelNode.addComponent(cc.Label);
        }

        icon.spriteFrame = null!;
        icon.node.active = false;
        countLabel.string = "";
        return { node, icon, countLabel };
    }

    private createDragVisual(template: cc.Node): void {
        if (!this.canvasNode || !this.inventoryUI) {
            this.resolveSceneNodes();
        }
        const overlayParent = this.inventoryUI && this.inventoryUI.parent
            ? this.inventoryUI.parent
            : (this.canvasNode ? this.canvasNode.parent : null);
        if (!overlayParent) {
            return;
        }

        const oldVisual = overlayParent.getChildByName("CraftingDragVisual");
        if (oldVisual) {
            oldVisual.destroy();
        }
        const node = new cc.Node("CraftingDragVisual");
        node.setContentSize(52, 52);
        node.zIndex = 100000;
        overlayParent.addChild(node);

        const iconNode = new cc.Node("Icon");
        iconNode.setContentSize(48, 48);
        iconNode.zIndex = 10;
        node.addChild(iconNode);
        const icon = iconNode.addComponent(cc.Sprite);
        icon.sizeMode = cc.Sprite.SizeMode.CUSTOM;

        const countNode = new cc.Node("Label");
        countNode.setContentSize(50, 18);
        countNode.setPosition(0, -18);
        countNode.zIndex = 20;
        node.addChild(countNode);
        const countLabel = countNode.addComponent(cc.Label);
        countLabel.fontSize = 14;
        countLabel.lineHeight = 16;
        countLabel.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
        countLabel.verticalAlign = cc.Label.VerticalAlign.CENTER;

        this.dragVisual = { node, icon, countLabel };
        this.dragVisual.node.active = false;
    }

    private bindGlobalDragEvents(): void {
        if (!this.canvasNode || !this.inventoryUI) {
            this.resolveSceneNodes();
        }
        this.dragEventNode = cc.director.getScene();
        if (!this.dragEventNode) {
            return;
        }

        this.dragEventNode.on(cc.Node.EventType.MOUSE_MOVE, this.onPointerMove, this);
        this.dragEventNode.on(cc.Node.EventType.MOUSE_UP, this.onPointerEnd, this);
        this.dragEventNode.on(cc.Node.EventType.TOUCH_MOVE, this.onPointerMove, this);
        this.dragEventNode.on(cc.Node.EventType.TOUCH_END, this.onPointerEnd, this);
        this.dragEventNode.on(cc.Node.EventType.TOUCH_CANCEL, this.onPointerCancel, this);
    }

    private unbindGlobalDragEvents(): void {
        if (!this.dragEventNode || !cc.isValid(this.dragEventNode)) {
            return;
        }
        this.dragEventNode.off(cc.Node.EventType.MOUSE_MOVE, this.onPointerMove, this);
        this.dragEventNode.off(cc.Node.EventType.MOUSE_UP, this.onPointerEnd, this);
        this.dragEventNode.off(cc.Node.EventType.TOUCH_MOVE, this.onPointerMove, this);
        this.dragEventNode.off(cc.Node.EventType.TOUCH_END, this.onPointerEnd, this);
        this.dragEventNode.off(cc.Node.EventType.TOUCH_CANCEL, this.onPointerCancel, this);
        this.dragEventNode = null!;
    }

    private beginDrag(
        payload: CraftingDragPayload,
        sourceNode: cc.Node,
        worldPosition: cc.Vec2
    ): void {
        this.cancelDrag();
        if (payload.source === "inventory") {
            this.selectedItemId = payload.itemId;
            this.refreshSelection();
        }
        this.dragState = {
            payload,
            startWorld: cc.v2(worldPosition.x, worldPosition.y),
            sourceNode,
            didDrag: false
        };
    }

    private onPointerMove(event: cc.Event.EventMouse | cc.Event.EventTouch): void {
        if (!this.dragState || !this.opened) {
            return;
        }

        const worldPosition = event.getLocation();
        if (!this.dragState.didDrag) {
            const deltaX = worldPosition.x - this.dragState.startWorld.x;
            const deltaY = worldPosition.y - this.dragState.startWorld.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            if (distance < 6) {
                return;
            }
            this.dragState.didDrag = true;
            this.dragState.sourceNode.opacity = 120;
            this.showDragVisual(this.dragState.payload);
        }

        this.updateDragVisualPosition(worldPosition);
        this.updateDropHighlight(worldPosition);
    }

    private onPointerEnd(event: cc.Event.EventMouse | cc.Event.EventTouch): void {
        if (!this.dragState) {
            return;
        }

        const wasDragging = this.dragState.didDrag;
        if (this.dragState.didDrag) {
            this.applyDrop(event.getLocation());
        }
        this.finishDrag();
        if (wasDragging) {
            event.stopPropagation();
        }
    }

    private onPointerCancel(): void {
        this.cancelDrag();
    }

    private applyDrop(worldPosition: cc.Vec2): void {
        if (!this.dragState) {
            return;
        }

        const payload = this.dragState.payload;
        const craftingIndex = this.findCraftingSlotAt(worldPosition);
        let success = false;

        if (craftingIndex >= 0) {
            if (payload.source === "inventory") {
                const target = CraftingSession.shared.getGrid()[craftingIndex];
                if (!target.itemId || target.itemId === payload.itemId) {
                    success = CraftingSession.shared.placeItem(
                        craftingIndex,
                        payload.itemId,
                        payload.count
                    );
                }
            } else {
                success = payload.sourceIndex === craftingIndex
                    || CraftingSession.shared.moveSlot(payload.sourceIndex, craftingIndex);
            }
        } else if (
            payload.source === "crafting"
            && this.inventoryUI
            && this.inventoryUI.getBoundingBoxToWorld().contains(worldPosition)
        ) {
            success = CraftingSession.shared.returnSlotToInventory(payload.sourceIndex);
        }

        if (success) {
            this.setStatus("Material moved.");
        } else {
            this.setStatus("Drop cancelled.", true);
        }
        this.refresh();
    }

    private showDragVisual(payload: CraftingDragPayload): void {
        if (!this.dragVisual) {
            return;
        }
        this.dragVisual.node.active = true;
        this.setSlotContent(this.dragVisual, payload.itemId, payload.count);
    }

    private updateDragVisualPosition(worldPosition: cc.Vec2): void {
        if (!this.dragVisual || !this.dragVisual.node.parent) {
            return;
        }
        // Event locations and direct children of the Scene use design-resolution coordinates.
        this.dragVisual.node.setPosition(worldPosition);
    }

    private updateDropHighlight(worldPosition: cc.Vec2): void {
        if (!this.dragState) {
            return;
        }

        const craftingIndex = this.findCraftingSlotAt(worldPosition);
        if (craftingIndex >= 0) {
            const target = CraftingSession.shared.getGrid()[craftingIndex];
            const valid = this.dragState.payload.source === "crafting"
                || !target.itemId
                || target.itemId === this.dragState.payload.itemId;
            this.setHighlightedNode(
                this.craftingSlots[craftingIndex].node,
                valid ? cc.color(110, 235, 150) : cc.color(245, 105, 105)
            );
            return;
        }

        if (
            this.inventoryUI
            && this.inventoryUI.getBoundingBoxToWorld().contains(worldPosition)
        ) {
            const valid = this.dragState.payload.source === "crafting";
            this.setHighlightedNode(
                this.inventoryUI,
                valid ? cc.color(110, 235, 150) : cc.color(245, 105, 105)
            );
            return;
        }

        this.clearDropHighlight();
    }

    private findCraftingSlotAt(worldPosition: cc.Vec2): number {
        for (let index = 0; index < this.craftingSlots.length; index++) {
            if (this.craftingSlots[index].node.getBoundingBoxToWorld().contains(worldPosition)) {
                return index;
            }
        }
        return -1;
    }

    private setHighlightedNode(node: cc.Node, color: cc.Color): void {
        if (this.highlightedNode === node) {
            node.color = color;
            return;
        }
        this.clearDropHighlight();
        this.highlightedNode = node;
        this.highlightedColor = cc.color(
            node.color.r,
            node.color.g,
            node.color.b,
            node.color.a
        );
        node.color = color;
    }

    private clearDropHighlight(): void {
        if (this.highlightedNode && cc.isValid(this.highlightedNode) && this.highlightedColor) {
            this.highlightedNode.color = this.highlightedColor;
        }
        this.highlightedNode = null!;
        this.highlightedColor = null!;
    }

    private finishDrag(): void {
        if (this.dragState && this.dragState.sourceNode && cc.isValid(this.dragState.sourceNode)) {
            this.dragState.sourceNode.opacity = 255;
        }
        if (this.dragVisual && this.dragVisual.node && cc.isValid(this.dragVisual.node)) {
            this.dragVisual.node.active = false;
        }
        this.clearDropHighlight();
        this.dragState = null!;
    }

    private cancelDrag(): void {
        this.finishDrag();
    }

    private onCraftingSlotClicked(index: number, event: cc.Event.EventMouse): void {
        const slot = CraftingSession.shared.getGrid()[index];
        const rightClick = event.getButton() === cc.Event.EventMouse.BUTTON_RIGHT;

        if (rightClick || (slot.itemId && !this.selectedItemId)) {
            if (!CraftingSession.shared.takeItem(index, 1)) {
                this.setStatus("Cannot return this material.", true);
            }
            return;
        }
        if (slot.itemId && slot.itemId !== this.selectedItemId) {
            this.setStatus("Right-click to clear this slot first.", true);
            return;
        }
        if (!this.selectedItemId) {
            this.setStatus("Select an item from the inventory.", true);
            return;
        }
        if (!CraftingSession.shared.placeItem(index, this.selectedItemId, 1)) {
            this.setStatus("Cannot place this material.", true);
        }
    }

    private refreshCraftingGrid(): void {
        const grid = CraftingSession.shared.getGrid();
        for (let index = 0; index < this.craftingSlots.length; index++) {
            this.setSlotContent(this.craftingSlots[index], grid[index].itemId, grid[index].count);
        }
    }

    private refreshResult(): void {
        const recipe = CraftingSession.shared.getMatchedRecipe();
        const craftable = CraftingSession.shared.getCraftableCount();
        const definition = recipe ? getItemDefinition(recipe.outputItemId) : null;
        const canCraft = !!recipe
            && craftable > 0
            && InventoryManager.instance.canAddItem(recipe.outputItemId, recipe.outputCount);

        this.setSlotContent(
            this.resultSlot,
            recipe ? recipe.outputItemId : null,
            recipe ? recipe.outputCount : 0
        );
        this.recipeNameLabel.string = definition ? definition.name : "No matching recipe";
        this.recipeDescriptionLabel.string = definition ? definition.description : "";
        this.craftableCountLabel.string = `Craftable: ${craftable}`;
        this.setButtonState(this.craftButton, canCraft);
        this.setButtonState(this.craftMaxButton, canCraft);
    }

    private claimResult(): void {
        const recipe = CraftingSession.shared.getMatchedRecipe();
        if (!recipe) {
            this.setStatus("No crafting result to collect.", true);
            return;
        }
        const definition = getItemDefinition(recipe.outputItemId);
        if (!CraftingSession.shared.craftOnce()) {
            this.setStatus("Cannot collect this result.", true);
            return;
        }
        this.setStatus(`Collected ${definition ? definition.name : recipe.outputItemId}.`);
        this.refresh();
    }

    private refreshSelection(): void {
        if (!this.selectedItemLabel) {
            return;
        }
        const definition = this.selectedItemId ? getItemDefinition(this.selectedItemId) : null;
        this.selectedItemLabel.string = definition
            ? `Selected: ${definition.name} x${InventoryManager.instance.getItemCount(definition.id)}`
            : "Selected: none";
    }

    private setSlotContent(view: CraftSlotView, itemId: string | null, count: number): void {
        if (!view) {
            return;
        }
        if (!itemId) {
            view.countLabel.string = "";
            view.icon.spriteFrame = null!;
            view.icon.node.active = false;
            return;
        }

        const definition = getItemDefinition(itemId);
        if (!definition || !definition.iconPath) {
            const shortName = definition
                ? definition.name.substring(0, 2).toUpperCase()
                : itemId.substring(0, 2).toUpperCase();
            view.countLabel.string = count > 1 ? `${shortName} ${count}` : shortName;
        } else {
            view.countLabel.string = count > 1 ? `${count}` : "";
        }
        ItemIconLoader.apply(itemId, view.icon);
    }

    private createBox(name: string, parent: cc.Node, width: number, height: number, color: cc.Color): cc.Node {
        const node = new cc.Node(name);
        node.setContentSize(width, height);
        parent.addChild(node);
        const graphics = node.addComponent(cc.Graphics);
        graphics.fillColor = color;
        graphics.roundRect(-width * 0.5, -height * 0.5, width, height, 6);
        graphics.fill();
        return node;
    }

    private createLabel(name: string, parent: cc.Node, text: string, size: number, color: cc.Color): cc.Label {
        const node = new cc.Node(name);
        node.color = color;
        node.setContentSize(360, size + 8);
        parent.addChild(node);
        const label = node.addComponent(cc.Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = size + 4;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        label.overflow = cc.Label.Overflow.SHRINK;
        return label;
    }

    private createButton(
        name: string,
        parent: cc.Node,
        text: string,
        position: cc.Vec2,
        callback: () => void
    ): cc.Button {
        const node = this.createBox(name, parent, 125, 38, this.enabledColor);
        node.setPosition(position);
        const button = node.addComponent(cc.Button);
        button.transition = cc.Button.Transition.NONE;
        const label = this.createLabel("Label", node, text, 14, cc.Color.WHITE);
        label.node.setContentSize(125, 38);
        label.node.setPosition(0, 0);
        label.node.zIndex = 100;
        label.node.opacity = 255;
        label.overflow = cc.Label.Overflow.NONE;
        label.enableWrapText = false;
        node.on(cc.Node.EventType.MOUSE_UP, (event: cc.Event.EventMouse) => {
            event.stopPropagation();
            if (button.interactable && event.getButton() === cc.Event.EventMouse.BUTTON_LEFT) {
                callback();
            }
        }, this);
        return button;
    }

    private setButtonState(button: cc.Button, enabled: boolean): void {
        if (!button) {
            return;
        }
        button.interactable = enabled;
        const graphics = button.node.getComponent(cc.Graphics);
        if (graphics) {
            graphics.clear();
            graphics.fillColor = enabled ? this.enabledColor : this.disabledColor;
            graphics.roundRect(-62.5, -19, 125, 38, 4);
            graphics.fill();
        }
    }

    private setStatus(message: string, error: boolean = false): void {
        if (!this.statusLabel) {
            return;
        }
        this.statusLabel.string = message || "";
        this.statusLabel.node.color = error ? cc.color(255, 130, 120) : cc.color(170, 225, 200);
    }

    private setVisible(visible: boolean): void {
        if (this.root && cc.isValid(this.root)) {
            if (visible) {
                this.sanitizeRenderComponents(this.root);
            }
            this.root.active = visible;
        }
    }

    private sanitizeRenderComponents(root: cc.Node): void {
        if (!root || !cc.isValid(root)) {
            return;
        }

        for (const sprite of root.getComponentsInChildren(cc.Sprite)) {
            const frame = sprite.spriteFrame;
            if (frame && (!cc.isValid(frame) || !frame.getTexture())) {
                sprite.spriteFrame = null!;
                sprite.enabled = false;
            }
        }

        for (const button of root.getComponentsInChildren(cc.Button)) {
            if (button.transition !== cc.Button.Transition.SPRITE) {
                continue;
            }

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

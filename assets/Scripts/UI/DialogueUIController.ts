const { ccclass, property } = cc._decorator;

export enum DialogueUIState {
    Hidden = 0,
    Prompt = 1,
    Options = 2
}

cc.Enum(DialogueUIState);

@ccclass
export default class DialogueUIController extends cc.Component {

    @property(cc.Node)
    public floatingRoot: cc.Node = null!;

    @property(cc.Node)
    public canvasNode: cc.Node = null!;

    @property(cc.Node)
    public mainCameraNode: cc.Node = null!;

    @property(cc.Node)
    public promptNode: cc.Node = null!;

    @property(cc.Label)
    public promptLabel: cc.Label = null!;

    @property(cc.Node)
    public dialoguePanel: cc.Node = null!;

    @property(cc.Label)
    public dialogueLabel: cc.Label = null!;

    @property([cc.Label])
    public optionLabels: cc.Label[] = [];

    @property(cc.Color)
    public selectedColor: cc.Color = cc.Color.YELLOW;

    @property(cc.Color)
    public normalColor: cc.Color = cc.Color.WHITE;

    @property(cc.Vec2)
    public followOffset: cc.Vec2 = cc.v2(0, 40);

    @property(cc.Boolean)
    public clampToCameraView: boolean = true;

    @property(cc.Float)
    public screenPadding: number = 24;

    private state: DialogueUIState = DialogueUIState.Hidden;
    private options: string[] = [];
    private selectedIndex: number = 0;
    private anchorTarget: cc.Node = null!;
    private mainCamera: cc.Camera = null!;
    private isDestroying: boolean = false;

    onLoad() {
        if (!this.floatingRoot) {
            this.floatingRoot = this.getDefaultFloatingRoot();
        }

        if (!this.canvasNode) {
            this.canvasNode = cc.find("Canvas") || null!;
        }

        if (!this.mainCameraNode) {
            this.mainCameraNode = cc.find("Canvas/Main Camera") || cc.find("Main Camera") || null!;
        }

        if (this.mainCameraNode) {
            this.mainCamera = this.mainCameraNode.getComponent(cc.Camera) || null!;
        }

        this.bindOptionInput();
        this.hide();
    }

    update() {
        if (this.state === DialogueUIState.Hidden) {
            return;
        }

        if (this.anchorTarget && !cc.isValid(this.anchorTarget)) {
            this.hide();
            return;
        }

        if (this.anchorTarget) {
            this.updateFloatingPosition();
        }
    }

    public showPrompt(text: string, anchorTarget?: cc.Node): void {
        this.state = DialogueUIState.Prompt;

        if (anchorTarget) {
            this.setAnchorTarget(anchorTarget);
        }

        if (this.promptNode) {
            this.promptNode.active = true;
        }

        if (this.promptLabel) {
            this.promptLabel.string = text;
        }

        if (this.dialoguePanel) {
            this.dialoguePanel.active = false;
        }

        this.updateFloatingPosition();
    }

    public hidePrompt(): void {
        if (this.state === DialogueUIState.Prompt) {
            this.hide();
            return;
        }

        if (this.promptNode) {
            this.promptNode.active = false;
        }
    }

    public showOptions(line: string, options: string[], anchorTarget?: cc.Node): void {
        this.state = DialogueUIState.Options;
        this.options = options ? options.slice() : [];
        this.selectedIndex = 0;

        if (anchorTarget) {
            this.setAnchorTarget(anchorTarget);
        }

        if (this.promptNode) {
            this.promptNode.active = false;
        }

        if (this.dialoguePanel) {
            this.dialoguePanel.active = true;
        }

        if (this.dialogueLabel) {
            this.dialogueLabel.string = line || "";
        }

        this.refreshOptions();
        this.updateFloatingPosition();
    }

    public selectNext(): void {
        if (!this.isOptionsVisible() || this.options.length <= 0) {
            return;
        }

        this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
        this.refreshOptions();
    }

    public selectPrev(): void {
        if (!this.isOptionsVisible() || this.options.length <= 0) {
            return;
        }

        this.selectedIndex = (this.selectedIndex - 1 + this.options.length) % this.options.length;
        this.refreshOptions();
    }

    public getSelectedIndex(): number {
        return this.selectedIndex;
    }

    public selectOption(index: number): void {
        if (!this.isOptionsVisible() || index < 0 || index >= this.options.length) {
            return;
        }

        this.selectedIndex = index;
        this.refreshOptions();
    }

    public confirmOption(index: number): void {
        this.selectOption(index);

        if (this.isOptionsVisible()) {
            cc.systemEvent.emit("DIALOGUE_OPTION_CONFIRMED", this.selectedIndex);
        }
    }

    public hide(): void {
        this.clearState();

        if (this.isDestroying || !this.node || !cc.isValid(this.node)) {
            return;
        }

        if (this.promptNode && cc.isValid(this.promptNode)) {
            this.promptNode.active = false;
        }

        if (this.dialoguePanel && cc.isValid(this.dialoguePanel)) {
            this.dialoguePanel.active = false;
        }

        this.refreshOptions();
    }

    public clearForOwnerDestroy(): void {
        this.clearState();
    }

    onDestroy() {
        this.isDestroying = true;
        this.clearState();
        this.optionLabels = [];
        this.floatingRoot = null!;
        this.canvasNode = null!;
        this.mainCameraNode = null!;
        this.mainCamera = null!;
        this.promptNode = null!;
        this.promptLabel = null!;
        this.dialoguePanel = null!;
        this.dialogueLabel = null!;
    }

    public isPromptVisible(): boolean {
        return this.state === DialogueUIState.Prompt;
    }

    public isOptionsVisible(): boolean {
        return this.state === DialogueUIState.Options;
    }

    public setAnchorTarget(anchorTarget: cc.Node): void {
        this.anchorTarget = anchorTarget;
    }

    public clearAnchorTarget(): void {
        this.anchorTarget = null!;
    }

    private refreshOptions(): void {
        if (this.isDestroying || !this.node || !cc.isValid(this.node)) {
            return;
        }

        const labels = this.optionLabels || [];
        const options = this.options || [];

        for (let i = 0; i < labels.length; i++) {
            const label = labels[i];
            if (!label || !cc.isValid(label) || !label.node || !cc.isValid(label.node)) {
                continue;
            }

            if (i < options.length) {
                label.node.active = true;
                label.string = `${i === this.selectedIndex ? "> " : "  "}${options[i]}`;
                label.node.color = i === this.selectedIndex ? this.selectedColor : this.normalColor;
            } else {
                label.string = "";
                label.node.active = false;
            }
        }
    }

    private bindOptionInput(): void {
        const labels = this.optionLabels || [];

        for (let index = 0; index < labels.length; index++) {
            const label = labels[index];
            if (!label || !label.node || (label.node as any).__dialogueInputBound) {
                continue;
            }

            (label.node as any).__dialogueInputBound = true;

            label.node.on(cc.Node.EventType.MOUSE_DOWN, (event: cc.Event.EventMouse) => {
                if (this.isOptionsVisible() && event.getButton() === cc.Event.EventMouse.BUTTON_LEFT) {
                    this.selectOption(index);
                }
            }, this);

            label.node.on(cc.Node.EventType.MOUSE_UP, (event: cc.Event.EventMouse) => {
                if (this.isOptionsVisible() && event.getButton() === cc.Event.EventMouse.BUTTON_LEFT) {
                    event.stopPropagation();
                    this.confirmOption(index);
                }
            }, this);

            label.node.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
                if (this.isOptionsVisible()) {
                    event.stopPropagation();
                    this.confirmOption(index);
                }
            }, this);
        }
    }

    private clearState(): void {
        this.state = DialogueUIState.Hidden;
        this.options = [];
        this.selectedIndex = 0;
        this.anchorTarget = null!;
    }

    private updateFloatingPosition(): void {
        const root = this.floatingRoot || this.node;
        if (!root || !cc.isValid(root) || !this.anchorTarget || !cc.isValid(this.anchorTarget)) {
            return;
        }

        const rootParent = root.parent;
        if (!rootParent) {
            return;
        }

        let targetWorldPos = this.anchorTarget.convertToWorldSpaceAR(cc.v2(0, 0));

        targetWorldPos = cc.v2(
            targetWorldPos.x + this.followOffset.x,
            targetWorldPos.y + this.followOffset.y
        );

        if (this.clampToCameraView) {
            targetWorldPos = this.clampWorldPositionToCameraView(targetWorldPos);
        }

        root.setPosition(rootParent.convertToNodeSpaceAR(targetWorldPos));
    }

    private clampWorldPositionToCameraView(worldPos: cc.Vec2): cc.Vec2 {
        const bounds = this.getCameraVisibleWorldBounds();
        if (!bounds) {
            return worldPos;
        }

        return cc.v2(
            Math.max(bounds.minX + this.screenPadding, Math.min(bounds.maxX - this.screenPadding, worldPos.x)),
            Math.max(bounds.minY + this.screenPadding, Math.min(bounds.maxY - this.screenPadding, worldPos.y))
        );
    }

    private getCameraVisibleWorldBounds(): {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    } | null {
        if (!this.mainCameraNode || !cc.isValid(this.mainCameraNode)) {
            this.mainCameraNode = cc.find("Canvas/Main Camera") || cc.find("Main Camera") || null!;
        }

        if (!this.mainCameraNode || !cc.isValid(this.mainCameraNode)) {
            return null;
        }

        if (!this.mainCamera) {
            this.mainCamera = this.mainCameraNode.getComponent(cc.Camera) || null!;
        }

        const cameraWorldPos = this.mainCameraNode.parent
            ? this.mainCameraNode.parent.convertToWorldSpaceAR(cc.v2(this.mainCameraNode.x, this.mainCameraNode.y))
            : cc.v2(this.mainCameraNode.x, this.mainCameraNode.y);

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

    private getDefaultFloatingRoot(): cc.Node {
        if (this.promptNode && this.dialoguePanel && this.promptNode.parent === this.dialoguePanel.parent) {
            return this.promptNode.parent;
        }

        if (this.promptNode && this.promptNode.parent) {
            return this.promptNode.parent;
        }

        if (this.dialoguePanel && this.dialoguePanel.parent) {
            return this.dialoguePanel.parent;
        }

        return this.node;
    }
}

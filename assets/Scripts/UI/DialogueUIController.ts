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
    public promptNode: cc.Node = null;

    @property(cc.Label)
    public promptLabel: cc.Label = null;

    @property(cc.Node)
    public dialoguePanel: cc.Node = null;

    @property(cc.Label)
    public dialogueLabel: cc.Label = null;

    @property([cc.Label])
    public optionLabels: cc.Label[] = [];

    @property(cc.Color)
    public selectedColor: cc.Color = cc.Color.YELLOW;

    @property(cc.Color)
    public normalColor: cc.Color = cc.Color.WHITE;

    private state: DialogueUIState = DialogueUIState.Hidden;
    private options: string[] = [];
    private selectedIndex: number = 0;

    onLoad() {
        this.hide();
    }

    public showPrompt(text: string): void {
        this.state = DialogueUIState.Prompt;

        if (this.promptNode) {
            this.promptNode.active = true;
        }
        if (this.promptLabel) {
            this.promptLabel.string = text;
        }
        if (this.dialoguePanel) {
            this.dialoguePanel.active = false;
        }
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

    public showOptions(line: string, options: string[]): void {
        this.state = DialogueUIState.Options;
        this.options = options ? options.slice() : [];
        this.selectedIndex = 0;

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

    public hide(): void {
        this.state = DialogueUIState.Hidden;
        this.options = [];
        this.selectedIndex = 0;

        if (this.promptNode) {
            this.promptNode.active = false;
        }
        if (this.dialoguePanel) {
            this.dialoguePanel.active = false;
        }

        this.refreshOptions();
    }

    public isPromptVisible(): boolean {
        return this.state === DialogueUIState.Prompt;
    }

    public isOptionsVisible(): boolean {
        return this.state === DialogueUIState.Options;
    }

    private refreshOptions(): void {
        for (let i = 0; i < this.optionLabels.length; i++) {
            const label = this.optionLabels[i];
            if (!label) {
                continue;
            }

            if (i < this.options.length) {
                label.node.active = true;
                label.string = `${i === this.selectedIndex ? "> " : "  "}${this.options[i]}`;
                label.node.color = i === this.selectedIndex ? this.selectedColor : this.normalColor;
            } else {
                label.string = "";
                label.node.active = false;
            }
        }
    }
}

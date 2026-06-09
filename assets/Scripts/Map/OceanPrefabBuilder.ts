const { ccclass, property } = cc._decorator;

@ccclass
export default class OceanPrefabBuilder extends cc.Component {
    @property
    buildOnLoad: boolean = false;

    @property
    clearOldGeneratedContent: boolean = true;

    @property
    generatedRootName: string = "GeneratedContent";

    onLoad() {
        if (this.clearOldGeneratedContent) {
            this.clearGeneratedContent();
        }
    }

    private clearGeneratedContent(): void {
        const oldRoot = this.node.getChildByName(this.generatedRootName);
        if (oldRoot) {
            oldRoot.destroy();
        }
    }
}
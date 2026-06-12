const { ccclass } = cc._decorator;

@ccclass
export default class OceanLayerOrder extends cc.Component {
    onLoad() {
        this.node.zIndex = -10;

        const skyVisual = this.node.getChildByName("SkyVisual");
        const waterVisual = this.node.getChildByName("WaterVisual");
        const seaFloor = this.node.getChildByName("SeaFloor");
        const oceanTrigger = this.node.getChildByName("OceanTrigger");
        const generatedContent = this.node.getChildByName("GeneratedContent");

        if (skyVisual) {
            skyVisual.active = false;
        }

        if (waterVisual) {
            waterVisual.active = true;
            waterVisual.opacity = 255;
            waterVisual.zIndex = 0;

            const sprite = waterVisual.getComponent(cc.Sprite);
            if (sprite) {
                sprite.enabled = true;
            }
        }

        if (seaFloor) {
            seaFloor.active = true;
            seaFloor.opacity = 255;
            seaFloor.zIndex = 1;
        }

        if (oceanTrigger) {
            oceanTrigger.zIndex = 2;
        }

        if (generatedContent) {
            generatedContent.active = true;
            generatedContent.opacity = 255;
            generatedContent.zIndex = 3;
        }
    }
}
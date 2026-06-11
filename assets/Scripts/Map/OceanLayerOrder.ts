const { ccclass } = cc._decorator;

@ccclass
export default class OceanLayerOrder extends cc.Component {
    onLoad() {
        this.node.zIndex = 50;

        const skyVisual = this.node.getChildByName("SkyVisual");
        const waterVisual = this.node.getChildByName("WaterVisual");
        const seaFloor = this.node.getChildByName("SeaFloor");
        const oceanTrigger = this.node.getChildByName("OceanTrigger");
        const generatedContent = this.node.getChildByName("GeneratedContent");

        if (skyVisual) {
            skyVisual.active = true;
            skyVisual.opacity = 255;
            skyVisual.zIndex = 0;
        }

        if (waterVisual) {
            waterVisual.active = true;
            waterVisual.opacity = 255;
            waterVisual.zIndex = 1;

            const sprite = waterVisual.getComponent(cc.Sprite);
            if (sprite) {
                sprite.enabled = true;
            }
        }

        if (seaFloor) {
            seaFloor.active = true;
            seaFloor.opacity = 255;
            seaFloor.zIndex = 2;
        }

        if (oceanTrigger) {
            oceanTrigger.zIndex = 3;
        }

        if (generatedContent) {
            generatedContent.active = true;
            generatedContent.opacity = 255;
            generatedContent.zIndex = 4;
        }
    }
}
const { ccclass } = cc._decorator;

@ccclass
export default class OceanLayerOrder extends cc.Component {
    onLoad() {
        this.node.zIndex = -100;

        const skyVisual = this.node.getChildByName("SkyVisual");
        const waterVisual = this.node.getChildByName("WaterVisual");
        const seaFloor = this.node.getChildByName("SeaFloor");
        const oceanTrigger = this.node.getChildByName("OceanTrigger");

        if (skyVisual) {
            skyVisual.zIndex = -100;
        }

        if (waterVisual) {
            waterVisual.zIndex = -90;
        }

        if (seaFloor) {
            seaFloor.zIndex = -80;
        }

        if (oceanTrigger) {
            oceanTrigger.zIndex = -70;
        }
    }
}
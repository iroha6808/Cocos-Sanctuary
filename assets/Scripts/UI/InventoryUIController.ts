const { ccclass, property } = cc._decorator;
import { InventoryManager } from "../Player/InventoryManager";

@ccclass
export default class InventoryUIController extends cc.Component {

    @property(cc.Node)
    gridContainer: cc.Node = null;

    onLoad() {
        cc.systemEvent.on("INVENTORY_CHANGED", this.refreshUI, this);
    }

    onEnable() {
        this.refreshUI();
    }

    refreshUI() {
        if (!this.gridContainer) return;

        let items = InventoryManager.instance.getItems();
        let slots = this.gridContainer.children; 
        cc.log(`🎒 UI目前掃描到大腦裡的道具數量: ${items.length}，格子總數: ${slots.length}`);
        for (let i = 0; i < slots.length; i++) {
            let currentSlot = slots[i];
            let labelNode = currentSlot.getChildByName("Label");
            let label = labelNode ? labelNode.getComponent(cc.Label) : null;

            if (i < items.length) {
                let item = items[i];
                if (label) {
                    label.string = `${item.name}\nx${item.count}`;
                }
                currentSlot.opacity = 255;
            } else {
                if (label) label.string = "";
            }
        }
    }

    onDestroy() {
        cc.systemEvent.off("INVENTORY_CHANGED", this.refreshUI, this);
    }
}
const { ccclass, property } = cc._decorator;
import { InventoryManager } from "./InventoryManager";

@ccclass
export default class CollectibleItem extends cc.Component {

    @property(cc.String)
    itemId: string = "apple";

    @property(cc.String)
    itemName: string = "蘋果";

    @property(cc.Integer)
    itemCount: number = 1;

    @property(cc.String)
    itemDescription: string = "一顆蘋果";

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        let playerCtrl = otherCollider.node.getComponent("PlayerController");
        
        if (playerCtrl) {
            let isPickedUp = InventoryManager.instance.addItem(
                this.itemId, 
                this.itemName, 
                this.itemCount, 
                this.itemDescription
            );

            if (isPickedUp) {
                cc.log(`成功撿起：${this.itemName} x ${this.itemCount}`);
                this.node.destroy();
            }
        }
    }
}
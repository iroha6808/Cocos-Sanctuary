const { ccclass, property } = cc._decorator;

enum ResourceType {
    TREE = 0,
    ORE = 1,
}

@ccclass
export default class ResourceObject extends cc.Component {
    @property({
        type: cc.Enum(ResourceType)
    })
    resourceType: ResourceType = ResourceType.TREE;

    @property()
    maxDurability: number = 3;

    @property()
    resourceAmount: number = 1;

    @property()
    autoListenKey: boolean = true;

    private currentDurability: number = 0;
    private playerInRange: boolean = false;

    onLoad() {
        this.currentDurability = this.maxDurability;

        if (this.autoListenKey) {
            cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        }
    }

    onDestroy() {
        if (this.autoListenKey) {
            cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        }
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (otherCollider.node.name === "Player") {
            this.playerInRange = true;
            cc.log("Player entered resource range:", this.node.name);
        }
    }

    onEndContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (otherCollider.node.name === "Player") {
            this.playerInRange = false;
            cc.log("Player left resource range:", this.node.name);
        }
    }

    private onKeyDown(event: cc.Event.EventKeyboard) {
        if (!this.playerInRange) {
            return;
        }

        if (event.keyCode === cc.macro.KEY.e) {
            this.interact();
        }
    }

    public canInteract(): boolean {
        return this.playerInRange && this.currentDurability > 0;
    }

    public interact() {
        if (this.currentDurability <= 0) {
            return;
        }

        this.currentDurability--;

        if (this.resourceType === ResourceType.TREE) {
            cc.log("Hit tree. Durability:", this.currentDurability);
        } else {
            cc.log("Hit ore. Durability:", this.currentDurability);
        }

        if (this.currentDurability <= 0) {
            this.collect();
        }
    }

    private collect() {
        if (this.resourceType === ResourceType.TREE) {
            cc.log("Gain wood:", this.resourceAmount);
        } else {
            cc.log("Gain ore:", this.resourceAmount);
        }

        this.node.active = false;
    }
}
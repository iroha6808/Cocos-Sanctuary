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
    dropAmount: number = 1;

    @property(cc.Prefab)
    dropPrefab: cc.Prefab = null!;

    @property(cc.SpriteFrame)
    depletedSpriteFrame: cc.SpriteFrame = null!;

    @property(cc.Sprite)
    targetSprite: cc.Sprite = null!;

    @property()
    interactDistance: number = 160;

    private currentDurability: number = 0;
    private isDepleted: boolean = false;

    onLoad() {
        this.currentDurability = this.maxDurability;

        const canvas = cc.find("Canvas");
        if (canvas) {
            canvas.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        }
    }

    onDestroy() {
        const canvas = cc.find("Canvas");
        if (canvas) {
            canvas.off(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        }
    }

    private onMouseDown(event: cc.Event.EventMouse) {
        // stall other interactions when checking backpack
        const inventoryUI = cc.find("Canvas/UI Root/InventoryUI");
        if (inventoryUI && inventoryUI.active) {
            return; 
        }

        if (event.getButton() !== cc.Event.EventMouse.BUTTON_LEFT) {
            return;
        }

        cc.log("Mouse clicked. Resource:", this.node.name);

        if (!this.canInteract()) {
            return;
        }

        this.interact();
    }

    public canInteract(): boolean {
        if (this.isDepleted) {
            cc.log("Cannot interact. Resource already depleted:", this.node.name);
            return false;
        }

        if (this.currentDurability <= 0) {
            cc.log("Cannot interact. Durability is 0:", this.node.name);
            return false;
        }

        const player = this.findPlayer();
        if (!player) {
            cc.log("Cannot interact. Player not found.");
            return false;
        }

        const resourceWorldPos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const playerWorldPos = player.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const distance = resourceWorldPos.sub(playerWorldPos).mag();

        cc.log("Distance to", this.node.name, "=", distance);

        if (distance > this.interactDistance) {
            cc.log("Too far from resource:", this.node.name);
            return false;
        }

        return true;
    }

    public interact() {
        if (this.currentDurability <= 0 || this.isDepleted) {
            return;
        }

        this.currentDurability--;

        if (this.resourceType === ResourceType.TREE) {
            cc.log("Hit tree. Durability:", this.currentDurability);
        } else {
            cc.log("Hit ore. Durability:", this.currentDurability);
        }

        if (this.currentDurability <= 0) {
            this.deplete();
        }
    }

    private deplete() {
        this.isDepleted = true;

        this.spawnDrop();

        if (this.resourceType === ResourceType.TREE) {
            this.changeToDepletedTree();
        } else {
            cc.log("Ore depleted. Destroy ore.");
            this.node.destroy();
        }
    }

    private spawnDrop() {
        if (!this.dropPrefab) {
            cc.log("Drop prefab is not assigned:", this.node.name);
            return;
        }

        const parent = this.node.parent;
        const dropNode = cc.instantiate(this.dropPrefab);

        dropNode.parent = parent;

        if (this.resourceType === ResourceType.TREE) {
            dropNode.setPosition(this.node.x, this.node.y + 80);
        } else {
            dropNode.setPosition(this.node.x, this.node.y + 40);
        }

        const dropScript = dropNode.getComponent("DropItem") as any;
        if (dropScript) {
            if (this.resourceType === ResourceType.TREE) {
                dropScript.itemName = "Apple";
            } else {
                dropScript.itemName = "Ore";
            }

            dropScript.itemAmount = this.dropAmount;
            dropScript.launch();
        }

        cc.log("Spawn drop from:", this.node.name);
    }

    private changeToDepletedTree() {
        let sprite = this.targetSprite;

        if (!sprite) {
            sprite = this.getComponent(cc.Sprite);
        }

        if (!sprite) {
            cc.log("Tree depleted, but Sprite is not assigned:", this.node.name);
            return;
        }

        if (!this.depletedSpriteFrame) {
            cc.log("Tree depleted, but depletedSpriteFrame is not assigned:", this.node.name);
            return;
        }

        sprite.spriteFrame = this.depletedSpriteFrame;

        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        sprite.node.width = this.node.width;
        sprite.node.height = this.node.height;

        cc.log("Tree image changed to depleted sprite.");
    }

    private findPlayer(): cc.Node | null {
        const player = cc.find("Canvas/Player");
        if (player) {
            return player;
        }

        return null;
    }
}
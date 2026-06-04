const { ccclass, property } = cc._decorator;
import { InventoryManager } from '../../Player/InventoryManager';

enum ObjectOrDrop{
    Object = 0,
    Drop = 1,
}

enum DropState {
    Flying = 0,
    Resting = 1,
    Attracting = 2,
    Held = 3,
}

@ccclass
export default class DropItem extends cc.Component {
    @property({ tooltip: '物件或掉落物' })
    objectOrDrop: ObjectOrDrop = ObjectOrDrop.Drop;

    @property({ tooltip: '道具名稱（存入背包用）' })
    itemName: string = "Item";

    @property({ tooltip: '數量' })
    itemAmount: number = 1;

    @property({ tooltip: '吸引距離' })
    attractDistance: number = 140;

    @property({ tooltip: '收集距離' })
    collectDistance: number = 28;

    @property({ tooltip: '吸引速度' })
    attractSpeed: number = 220;

    @property({ tooltip: '發射速度（X軸）' })
    launchSpeedX: number = 120;

    @property({ tooltip: '發射速度（Y軸）' })
    launchSpeedY: number = 260;

    private rb: cc.RigidBody = null!;
    private collider: cc.PhysicsCollider = null!;
    private targetPlayer: cc.Node | null = null;
    private state: DropState = DropState.Flying;

    onLoad() {
        this.rb = this.getComponent(cc.RigidBody);
        this.collider = this.getComponent(cc.PhysicsCollider);

        if (this.rb) {
            this.rb.type = cc.RigidBodyType.Dynamic;
            this.rb.gravityScale = 1;
            this.rb.linearDamping = 2;
            this.rb.angularDamping = 8;
        }
    }

    start() {
        this.launch();
    }

    public launch() {
        if (!this.rb) {
            return;
        }

        const direction = Math.random() < 0.5 ? -1 : 1;

        this.state = DropState.Flying;
        this.rb.type = cc.RigidBodyType.Dynamic;
        this.rb.gravityScale = 1;
        this.rb.linearVelocity = cc.v2(direction * this.launchSpeedX, this.launchSpeedY);
        this.rb.angularVelocity = 0;
    }

    update(dt: number) {
        const player = this.findPlayer();
        if (!player) {
            return;
        }

        const distance = this.getWorldDistanceTo(player);

        if (this.state !== DropState.Attracting && distance <= this.attractDistance) {
            this.startAttract(player);
        }

        if (this.state === DropState.Attracting) {
            this.moveToPlayer(player, dt);
        }
    }

    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        if (this.state !== DropState.Flying) {
            return;
        }

        if (this.isGround(otherCollider.node)) {
            this.stopOnGround();
        }
    }

    private stopOnGround() {
        if (!this.rb) {
            return;
        }

        this.state = DropState.Resting;
        this.rb.linearVelocity = cc.v2(0, 0);
        this.rb.angularVelocity = 0;
        this.rb.gravityScale = 0;
        this.rb.type = cc.RigidBodyType.Static;

        cc.log("Drop item stopped on ground:", this.itemName);
    }

    private startAttract(player: cc.Node) {
        if (this.objectOrDrop === ObjectOrDrop.Object) return;
        
        this.targetPlayer = player;
        this.state = DropState.Attracting;

        if (this.rb) {
            this.rb.linearVelocity = cc.v2(0, 0);
            this.rb.angularVelocity = 0;
            this.rb.gravityScale = 0;
            this.rb.type = cc.RigidBodyType.Kinematic;
        }

        if (this.collider) {
            this.collider.enabled = false;
        }

        cc.log("Drop item starts attracting:", this.itemName);
    }

    private moveToPlayer(player: cc.Node, dt: number) {
        if (this.objectOrDrop === ObjectOrDrop.Object) return;
        const dropWorldPos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const playerWorldPos = player.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const direction = playerWorldPos.sub(dropWorldPos);

        if (direction.mag() <= this.collectDistance) {
            this.collect();
            return;
        }

        const movementWorld = direction.normalize().mul(this.attractSpeed * dt);
        const newWorldPos = dropWorldPos.add(movementWorld);

        if (!this.node.parent) {
            return;
        }

        const newLocalPos = this.node.parent.convertToNodeSpaceAR(newWorldPos);
        this.node.setPosition(newLocalPos);
    }

    private collect() {
        if (this.objectOrDrop === ObjectOrDrop.Object) return;
        cc.log("Collect item:", this.itemName, this.itemAmount);
        if (!InventoryManager.instance) {
            cc.error('[FoodBase] 無法找到 InventoryManager，無法加入背包');
            return;
        }
        const id = this.itemName.toLowerCase();
        const name = this.itemName;
        const description = `獲得 ${this.itemAmount} 個 ${name}`;
        const added = InventoryManager.instance.addItem(id, name, 1, description);
        if (added) cc.log(`[FoodBase] ${name} 已加入背包`);
        else cc.warn(`[FoodBase] 背包已滿，${name} 無法加入`); 
        this.node.destroy();
    }

    private findPlayer(): cc.Node | null {
        const player = cc.find("Canvas/Player");
        if (player) {
            return player;
        }

        return null;
    }

    private getWorldDistanceTo(target: cc.Node): number {
        const selfWorldPos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const targetWorldPos = target.convertToWorldSpaceAR(cc.Vec2.ZERO);
        return selfWorldPos.sub(targetWorldPos).mag();
    }

    private isGround(node: cc.Node): boolean {
        if (node.group === "ground") {
            return true;
        }

        if (node.name === "ground" || node.name === "Ground") {
            return true;
        }

        if (node.name === "tempFloor" || node.name === "TempFloor") {
            return true;
        }

        return false;
    }
}
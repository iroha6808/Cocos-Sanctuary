const { ccclass, property } = cc._decorator;

enum DropState {
    Flying = 0,
    Resting = 1,
    Attracting = 2,
}

@ccclass
export default class FoodBase extends cc.Component {

    @property foodName: string = '';
    @property hpRestore: number = 0;
    @property staminaRestore: number = 0;
    @property itemName: string = "Item";
    @property itemAmount: number = 1;
    @property attractDistance: number = 80;
    @property collectDistance: number = 40;
    @property attractSpeed: number = 220;
    @property launchSpeedX: number = 30;
    @property launchSpeedY: number = 65;
    private rb: cc.RigidBody = null!;
    private collider: cc.PhysicsCollider = null!;
    private targetPlayer: cc.Node | null = null;
    private state: DropState = DropState.Flying;

    // 由 Firebase 地圖渲染時呼叫，傳入初始資料
    init(data: { name: string; hp: number; stamina: number }) {
        this.foodName = data.name;
        this.hpRestore = data.hp;
        this.staminaRestore = data.stamina;
    }
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
            // this.stopOnGround();
            this.state = DropState.Resting;
        }
    }

    // private stopOnGround() {
    //     if (!this.rb) {
    //         return;
    //     }

    //     this.state = DropState.Resting;
    //     this.rb.linearVelocity = cc.v2(0, 0);
    //     this.rb.type = cc.RigidBodyType.Static;

    //     cc.log("Drop item stopped on ground:", this.itemName);
    // }

    private startAttract(player: cc.Node) {
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
        cc.log("Collect item:", this.itemName, this.itemAmount);
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

    // 吃掉：直接套用效果（你可以換成呼叫 PlayerStats）
    eat(player: cc.Node) {
        const stats = player.getComponent('Player'); // 換成你實際的元件名
        if (stats) {
            stats.restoreHp(this.hpRestore);
            stats.restoreStamina(this.staminaRestore);
        }
        this.node.destroy();
    }

    // 丟掉：放回玩家腳下
    drop(position: cc.Vec2) {
        this.node.setPosition(position);
    }

    // 未來背包用
    addToInventory() {
        // TODO
    }
}
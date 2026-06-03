const { ccclass, property } = cc._decorator;
import FoodBase from '../FoodBase';

export enum CoconutState {
    OnTree,      // 掛在樹上
    Falling,     // 掉落中
    OnGround,    // 在地上
    Held,        // 手持
}

@ccclass
export default class Coconut extends FoodBase {

    state: CoconutState = CoconutState.OnTree;
    foodName: string = 'Coconut';
    hpRestore: number = 10;
    staminaRestore: number = 30;

    private rb: cc.RigidBody = null;
    private collider: cc.PhysicsCircleCollider = null;
    private interactLabel: cc.Node = null;  // 「按 F 採集」的 UI Label

    onLoad() {
        this.foodName = 'Coconut';
        this.hpRestore = 10;
        this.staminaRestore = 30;

        this.rb = this.getComponent(cc.RigidBody);
        this.collider = this.getComponent(cc.PhysicsCircleCollider);
        this.interactLabel = this.node.getChildByName('InteractLabel');

        // 初始狀態：掛樹上，不受重力
        this.rb.type = cc.RigidBodyType.Kinematic;
        this.rb.gravityScale = 0;
        if (this.interactLabel) this.interactLabel.active = false;
        this.enablePhysics();
    }

    // ── 採集：玩家按 F，椰子從樹上掉下來 ──
    startFall() {
        if (this.state !== CoconutState.OnTree) return;
        this.state = CoconutState.Falling;

        this.rb.type = cc.RigidBodyType.Dynamic;
        this.rb.gravityScale = 1;

        // 稍微加個隨機橫向力，讓椰子不要直直掉
        this.rb.linearVelocity = cc.v2(
            (Math.random() - 0.5) * 80,
            0
        );
    }

    // ── 落地：PhysicsCollider 偵測到碰地 ──
    onBeginContact(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        if (this.state === CoconutState.Falling && other.node.group === 'ground') {
            this.state = CoconutState.OnGround;

            // 高阻尼讓他快速停下，不要一直滾
            this.rb.linearDamping = 8;
            this.rb.angularDamping = 8;
        }
    }

    // ── 玩家進入互動範圍 ──
    showInteractHint() {
        if (this.state === CoconutState.OnTree || this.state === CoconutState.OnGround) {
            if (this.interactLabel) this.interactLabel.active = true;
        }
    }

    hideInteractHint() {
        if (this.interactLabel) this.interactLabel.active = false;
    }

    // ── 撿起（從地上） ──
    pickup(playerNode: cc.Node) {
        if (this.state !== CoconutState.OnGround) return;
        this.state = CoconutState.Held;

        // 關掉物理，讓 node 跟著玩家
        this.rb.type = cc.RigidBodyType.Kinematic;
        this.rb.linearVelocity = cc.v2(0, 0);
        this.node.parent = playerNode;
        this.node.setPosition(30, 20); // 玩家右手位置，自己調
        this.hideInteractHint();
    }

    // ── 吃掉 ──
    eat(player: cc.Node) {
        if (this.state !== CoconutState.Held) return;
        const stats = player.getComponent('PlayerStats');
        if (stats) {
            stats.restoreHp(this.hpRestore);
            stats.restoreStamina(this.staminaRestore);
        }
        this.node.destroy();
    }

    // ── 丟掉 ──
    drop(direction: cc.Vec2) {
        if (this.state !== CoconutState.Held) return;
        this.state = CoconutState.Falling;

        // 把 node 移回地圖層，不然座標會跑掉
        const worldPos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        this.node.parent = cc.director.getScene().getChildByName('Canvas');
        this.node.setPosition(this.node.parent.convertToNodeSpaceAR(worldPos));

        this.rb.type = cc.RigidBodyType.Dynamic;
        this.rb.gravityScale = 1;
        // 往玩家面朝方向丟出去
        this.rb.linearVelocity = direction.normalize().mul(300);
    }

    // 呼叫這個讓椰子開始受物理影響
    enablePhysics() {
        this.state = CoconutState.Falling;
        this.rb.type = cc.RigidBodyType.Dynamic;
        this.rb.gravityScale = 1;
        // 稍微往旁邊推，不要直直掉
        this.rb.linearVelocity = cc.v2((Math.random() - 0.5) * 1.5, 0);
    }
}
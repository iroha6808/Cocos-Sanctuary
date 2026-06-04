const { ccclass, property } = cc._decorator;
import FoodBase from '../FoodBase';
import DropState from '../../DropItem';

export enum ItemState {
    Flying = 0,
    Resting = 1,
    Attracting = 2,
    Held = 3,
}

export enum ItemMode{
    Object = 0, // 物件模式：純物理，不可吸附，不可撿起
    Drop = 1, // 掉落物模式：可被吸附、收進背包
}

// 大部分紅線都是繼承的變數和函式，不用管它們

@ccclass
export default class Coconut extends FoodBase {

    itemName: string = 'Coconut';
    foodName: string = 'Coconut';
    hpRestore: number = 10;
    staminaRestore: number = 30;
    rottenTimer: number = 600; // 10分鐘腐敗

    @property({ tooltip: '椰子狀態' })         coconutState: ItemState = ItemState.Resting;
    @property({ tooltip: '為世界唯一交易貨幣' }) cashValue: number = 1;

    private interactLabel: cc.Node = null!;

    onLoad() {
        // ★ 先讓父類初始化 this.rb 和 this.collider
        super.onLoad();

        this.interactLabel = this.node.getChildByName('InteractLabel');
        if (this.interactLabel) this.interactLabel.active = false;

        // super.onLoad() 會把 rb 設成 Dynamic + gravityScale=1
        // 目前還沒做樹，直接讓它落下即可，不需要額外覆蓋
        // 等做樹之後：把下面兩行取消註解，並在 start() 清空
        // this.rb.type         = cc.RigidBodyType.Kinematic;
        // this.rb.gravityScale = 0;
    }

    start() {
        // 尚未做樹：直接以 Falling 狀態開始
        // super.start() 會呼叫 launch()（帶水平初速），這裡改用 enablePhysics()（幾乎垂直落下）
        this.enablePhysics();
    }

    // ── 採集：玩家按 F，椰子從樹上掉下來 ──────────────
    startFall() {
        if (this.coconutState !== ItemState.Resting) return;
        this.coconutState = ItemState.Flying;
        this.hideInteractHint();

        this.rb.type           = cc.RigidBodyType.Dynamic;
        this.rb.gravityScale   = 1;
        this.rb.linearVelocity = cc.v2((Math.random() - 0.5) * 80, 0);
    }

    // ── 落地：同步兩套 state ────────────────────────────
    onBeginContact(
        contact: cc.PhysicsContact,
        self: cc.PhysicsCollider,
        other: cc.PhysicsCollider
    ) {
        if (this.coconutState !== ItemState.Flying) return;
        if (!this.isGround(other.node)) return;

        this.coconutState = ItemState.Resting;

        this.stopOnGround();
        this.rb.linearDamping  = 8;
        this.rb.angularDamping = 8;
        
        if (this.collider) this.collider.sensor = true;
    }

    // ── 互動提示 ────────────────────────────────────────
    showInteractHint() {
        const canShow = this.coconutState === ItemState.Resting;
        if (canShow && this.interactLabel) this.interactLabel.active = true;
    }

    hideInteractHint() {
        if (this.interactLabel) this.interactLabel.active = false;
    }

    // ── 撿起（玩家手動從地上撿） ────────────────────────
    pickup(playerNode: cc.Node) {
        if (this.coconutState !== ItemState.Resting) return;
        this.coconutState = ItemState.Held;
        this.changeState(ItemState.Held);

        this.rb.type           = cc.RigidBodyType.Kinematic;
        this.rb.linearVelocity = cc.v2(0, 0);
        this.node.parent       = playerNode;
        this.node.setPosition(30, 20);
        this.hideInteractHint();
        this.collect();
    }

    // ── 吃掉（手持狀態） ────────────────────────────────
    eat(player: cc.Node) {
        if (this.coconutState !== ItemState.Held) return;
        super.eat(player);
    }

    // ── 丟掉（手持狀態） ────────────────────────────────
    drop(direction: cc.Vec2) {
        if (this.coconutState !== ItemState.Held) return;
        this.coconutState = ItemState.Flying;
        this.changeState(ItemState.Flying);

        const worldPos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const canvas   = cc.director.getScene().getChildByName('Canvas');
        this.node.parent = canvas;
        this.node.setPosition(this.node.parent.convertToNodeSpaceAR(worldPos));

        this.rb.type           = cc.RigidBodyType.Dynamic;
        this.rb.gravityScale   = 1;
        this.rb.linearVelocity = direction.normalize().mul(300);

        // 恢復 collider（丟出去的椰子要能碰地）
        if (this.collider) {
            this.collider.enabled = true;
            this.collider.sensor  = false;
        }
    }

    // ── 直接受物理影響（從天而降時使用） ────────────────
    enablePhysics() {
        this.coconutState = ItemState.Flying;

        if (!this.rb) {
            cc.error('[Coconut] enablePhysics: rb 為 null，請確認 super.onLoad() 有被呼叫');
            return;
        }
        this.rb.type           = cc.RigidBodyType.Dynamic;
        this.rb.gravityScale   = 1;
        this.rb.linearVelocity = cc.v2((Math.random() - 0.5) * 1.5, 0);
    }
}
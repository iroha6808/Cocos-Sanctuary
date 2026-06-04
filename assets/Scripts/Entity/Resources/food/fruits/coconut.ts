const { ccclass, property } = cc._decorator;
import FoodBase from '../FoodBase';
import DropState from '../../DropItem';

export enum CoconutState {
    OnTree   = 0,
    Falling  = 1,
    OnGround = 2,
    Held     = 3,
}

// 大部分紅線都是繼承的變數和函式，不用管它們

@ccclass
export default class Coconut extends FoodBase {

    itemName: string = 'Coconut';
    foodName: string = 'Coconut';
    hpRestore: number = 10;
    staminaRestore: number = 30;

    @property({ tooltip: '椰子狀態' })         coconutState: CoconutState = CoconutState.OnTree;
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
        if (this.coconutState !== CoconutState.OnTree) return;
        this.coconutState = CoconutState.Falling;
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
        if (this.coconutState !== CoconutState.Falling) return;
        if (!this.isGround(other.node)) return;

        this.coconutState = CoconutState.OnGround;

        // ★ 呼叫父類的 stopOnGround()（現在是 protected，可以直接呼叫）
        //   讓 this.state = Resting，同時停止 rb
        this.stopOnGround();
        this.rb.linearDamping  = 8;
        this.rb.angularDamping = 8;

        // ★ Resting 時把 collider 設成 sensor，讓椰子不再推玩家
        //   （Attracting 時父類會 disable collider，雙重保險）
        if (this.collider) this.collider.sensor = true;
    }

    // ── 互動提示 ────────────────────────────────────────
    showInteractHint() {
        const canShow =
            this.coconutState === CoconutState.OnTree ||
            this.coconutState === CoconutState.OnGround;
        if (canShow && this.interactLabel) this.interactLabel.active = true;
    }

    hideInteractHint() {
        if (this.interactLabel) this.interactLabel.active = false;
    }

    // ── 撿起（玩家手動從地上撿） ────────────────────────
    pickup(playerNode: cc.Node) {
        if (this.coconutState !== CoconutState.OnGround) return;
        this.coconutState = CoconutState.Held;
        this.state        = DropState.Held;

        this.rb.type           = cc.RigidBodyType.Kinematic;
        this.rb.linearVelocity = cc.v2(0, 0);
        this.node.parent       = playerNode;
        this.node.setPosition(30, 20);
        this.hideInteractHint();
        this.collect();
    }

    // ── 吃掉（手持狀態） ────────────────────────────────
    eat(player: cc.Node) {
        if (this.coconutState !== CoconutState.Held) return;
        super.eat(player);
    }

    // ── 丟掉（手持狀態） ────────────────────────────────
    drop(direction: cc.Vec2) {
        if (this.coconutState !== CoconutState.Held) return;
        this.coconutState = CoconutState.Falling;
        this.state        = DropState.Flying;

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
        this.coconutState = CoconutState.Falling;

        if (!this.rb) {
            cc.error('[Coconut] enablePhysics: rb 為 null，請確認 super.onLoad() 有被呼叫');
            return;
        }
        this.rb.type           = cc.RigidBodyType.Dynamic;
        this.rb.gravityScale   = 1;
        this.rb.linearVelocity = cc.v2((Math.random() - 0.5) * 1.5, 0);
    }
}
const { ccclass, property } = cc._decorator;
import DropItem from '../DropItem';
import { InventoryManager } from '../../../Player/InventoryManager';
import EventCenter from '../../../Core/EventCenter';
import { GameEvent } from '../../../Core/Constants';
import AudioManager, { SfxType } from '../../../Core/AudioManager';
import EffectsManager, { EffectType } from '../../../Core/EffectsManager';

export enum ItemMode{
    Object = 0, // 物件模式：純物理，不可吸附，不可撿起
    Drop = 1, // 掉落物模式：可被吸附、收進背包
}

export enum ItemState {
    Flying = 0,
    Resting = 1,
    Attracting = 2,
    Held = 3,
}

@ccclass
export default class Orebase extends DropItem {

    @property({ tooltip: '顯示名稱' }) oreName: string = 'ore';
    @property({ tooltip: '關於礦物的描述（背包內顯示）' }) description: string = '';
    @property({ tooltip: '礦物狀態' })         oreState: ItemState = ItemState.Resting;
    @property({ tooltip: '互動提示標籤' }) interactLabel: cc.Node = null!;
    itemtype: string = "ore";
    itemName: string = "ore";

    onLoad() {
        super.onLoad();
        cc.log(`[Orebase] onLoad → ${this.oreName || this.itemName}`);

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

    init(data: { name: string; hp: number; stamina: number }) {
        this.oreName       = data.name;
    }

    collect() {
        const id   = this.itemName.toLowerCase();
        const name = this.oreName || this.itemName;

        cc.log(`[OreBase] 嘗試將 ${name} 加入背包...`);
        if (!InventoryManager.instance) {
            cc.error('[OreBase] 無法找到 InventoryManager，無法加入背包');
            return;
        }
        const added = InventoryManager.instance.addItem(id, 1);

        if (added) {
            cc.log(`[OreBase] ${name} 已加入背包`);
            EventCenter.emit(GameEvent.ITEM_COLLECTED, id, 1);
            AudioManager.play(SfxType.COLLECT);
            EffectsManager.play(EffectType.COLLECT, this.node.convertToWorldSpaceAR(cc.Vec2.ZERO));
        } else {
            cc.warn(`[OreBase] 背包已滿，${name} 無法加入`);
        }
        this.node.destroy();
    }

    changeMode(newState: ItemMode) {
        this.mode = newState;
    }

    changeState(newState: ItemState) {
        this.state = newState;
    }

    startFall() {
        if (this.oreState !== ItemState.Resting) return;
        this.oreState = ItemState.Flying;
        this.hideInteractHint();

        this.rb.type           = cc.RigidBodyType.Dynamic;
        this.rb.gravityScale   = 1;
        this.rb.linearVelocity = cc.v2((Math.random() - 0.5) * 80, 0);
    }

    // ── 落地：同步兩套 state ────────────────────────────
    onBeginContact(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        if (this.oreState !== ItemState.Flying) return;
        if (!this.isGround(other.node)) return;

        this.oreState = ItemState.Resting;
        this.stopOnGround();
        this.rb.linearDamping  = 8;
        this.rb.angularDamping = 8;

        if (this.collider) this.collider.sensor = true;
    }

    // ── 互動提示 ────────────────────────────────────────
    showInteractHint() {
        const canShow = this.oreState === ItemState.Resting;
        if (canShow && this.interactLabel) this.interactLabel.active = true;
    }

    hideInteractHint() {
        if (this.interactLabel) this.interactLabel.active = false;
    }

    // ── 撿起（玩家手動從地上撿） ────────────────────────
    pickup(playerNode: cc.Node) {
        if (this.oreState !== ItemState.Resting) return;
        this.oreState = ItemState.Held;
        this.changeState(ItemState.Held);

        this.rb.type           = cc.RigidBodyType.Kinematic;
        this.rb.linearVelocity = cc.v2(0, 0);
        this.node.parent       = playerNode;
        this.node.setPosition(30, 20);
        this.hideInteractHint();
        this.collect();
    }

    // ── 丟掉（手持狀態） ────────────────────────────────
    drop(direction: cc.Vec2) {
        if (this.oreState !== ItemState.Held) return;
        this.oreState = ItemState.Flying;
        this.changeState(ItemState.Flying);

        const worldPos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const canvas   = cc.director.getScene().getChildByName('Canvas');
        this.node.parent = canvas;
        this.node.setPosition(this.node.parent.convertToNodeSpaceAR(worldPos));

        this.rb.type           = cc.RigidBodyType.Dynamic;
        this.rb.gravityScale   = 1;
        this.rb.linearVelocity = direction.normalize().mul(300);

        // 恢復 collider（丟出去的食物要能碰地）
        if (this.collider) {
            this.collider.enabled = true;
            this.collider.sensor  = false;
        }
    }

    // ── 直接受物理影響（從天而降時使用） ────────────────
    enablePhysics() {
        this.oreState = ItemState.Flying;

        if (!this.rb) {
            cc.error(`[${this.oreName}] enablePhysics: rb 為 null，請確認 super.onLoad() 有被呼叫`);
            return;
        }
        this.rb.type           = cc.RigidBodyType.Dynamic;
        this.rb.gravityScale   = 1;
        this.rb.linearVelocity = cc.v2((Math.random() - 0.5) * 1.5, 0);
    }
}

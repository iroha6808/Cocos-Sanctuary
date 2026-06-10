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
export default class FoodBase extends DropItem {

    @property({ tooltip: '食物顯示名稱' }) foodName: string = '';
    @property({ tooltip: '關於食物的描述（背包內顯示）' }) description: string = '';
    @property({ tooltip: '吃掉後恢復的 HP' })   hpRestore: number = 0;
    @property({ tooltip: '吃掉後恢復的體力' })  staminaRestore: number = 0;
    @property({ tooltip: '腐敗時間（秒）' }) rottenTime: number = 0;
    @property({ tooltip: '食物狀態' })         foodState: ItemState = ItemState.Resting;
    @property({ tooltip: '互動提示標籤' }) interactLabel: cc.Node = null!;
    itemName: string = "food";
    rottenTimer: number = 0;
    isRotten: boolean   = false;

    onLoad() {
        super.onLoad();
        cc.log(`[FoodBase] onLoad → ${this.foodName || this.itemName}, rottenTime=${this.rottenTime}`);

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
        this.foodName       = data.name;
        this.hpRestore      = data.hp;
        this.staminaRestore = data.stamina;
    }

    collect() {
        const id   = (this.foodName || this.itemName).toLowerCase();
        const name = this.foodName || this.itemName;

        cc.log(`[FoodBase] 嘗試將 ${name} 加入背包...`);
        if (!InventoryManager.instance) {
            cc.error('[FoodBase] 無法找到 InventoryManager，無法加入背包');
            return;
        }
        const added = InventoryManager.instance.addItem(id, 1);

        if (added) {
            cc.log(`[FoodBase] ${name} 已加入背包`);
            EventCenter.emit(GameEvent.ITEM_COLLECTED, id, 1);
            AudioManager.play(SfxType.COLLECT);
            EffectsManager.play(EffectType.COLLECT, this.node.convertToWorldSpaceAR(cc.Vec2.ZERO));
        } else {
            cc.warn(`[FoodBase] 背包已滿，${name} 無法加入`);
        }
        this.node.destroy();
    }

    eat(player: cc.Node) {
        const stats = player.getComponent('PlayerStats');
        if (stats) {
            stats.restoreHp(this.hpRestore);
            stats.restoreStamina(this.staminaRestore);
            cc.log(`[FoodBase] ${this.foodName} 吃掉，恢復 HP=${this.hpRestore} 體力=${this.staminaRestore}`);
        } else {
            const entity = player.getComponent('PlayerController') as any;
            if (entity && typeof entity.heal === "function") {
                entity.heal(this.hpRestore);
                EventCenter.emit(GameEvent.PLAYER_HP_CHANGED, entity.currentHp, entity.maxHp);
                cc.log(`[FoodBase] ${this.foodName} 吃掉，恢復 HP=${this.hpRestore}`);
            } else {
                cc.error('[FoodBase] Player 缺少 PlayerStats / PlayerController 組件');
                return;
            }
        }
        AudioManager.play(SfxType.HEAL);
        EffectsManager.play(EffectType.HEAL, player.convertToWorldSpaceAR(cc.Vec2.ZERO));
        this.node.destroy();
    }

    update(dt: number) {
        super.update(dt);

        if (this.mode !== ItemMode.Object) return;
        if (this.rottenTime < 0) return;
        if (this.isRotten) return;

        this.rottenTimer += dt;
        if (this.rottenTimer >= this.rottenTime) {
            this.onRotten();
        }
    }

    protected onRotten() {
        this.isRotten = true;
        cc.log(`[FoodBase] ${this.foodName || this.itemName} 已腐敗，從場景移除`);
        this.node.destroy();
    }

    changeMode(newState: ItemMode) {
        this.mode = newState;
    }

    changeState(newState: ItemState) {
        this.state = newState;
    }

    startFall() {
        if (this.foodState !== ItemState.Resting) return;
        this.foodState = ItemState.Flying;
        this.hideInteractHint();

        this.rb.type           = cc.RigidBodyType.Dynamic;
        this.rb.gravityScale   = 1;
        this.rb.linearVelocity = cc.v2((Math.random() - 0.5) * 80, 0);
    }

    // ── 落地：同步兩套 state ────────────────────────────
    onBeginContact(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        if (this.foodState !== ItemState.Flying) return;
        if (!this.isGround(other.node)) return;

        this.foodState = ItemState.Resting;
        this.stopOnGround();
        this.rb.linearDamping  = 8;
        this.rb.angularDamping = 8;

        if (this.collider) this.collider.sensor = true;
    }

    // ── 互動提示 ────────────────────────────────────────
    showInteractHint() {
        const canShow = this.foodState === ItemState.Resting;
        if (canShow && this.interactLabel) this.interactLabel.active = true;
    }

    hideInteractHint() {
        if (this.interactLabel) this.interactLabel.active = false;
    }

    // ── 撿起（玩家手動從地上撿） ────────────────────────
    pickup(playerNode: cc.Node) {
        if (this.foodState !== ItemState.Resting) return;
        this.foodState = ItemState.Held;
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
        if (this.foodState !== ItemState.Held) return;
        this.foodState = ItemState.Flying;
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
        this.foodState = ItemState.Flying;

        if (!this.rb) {
            cc.error(`[${this.foodName}] enablePhysics: rb 為 null，請確認 super.onLoad() 有被呼叫`);
            return;
        }
        this.rb.type           = cc.RigidBodyType.Dynamic;
        this.rb.gravityScale   = 1;
        this.rb.linearVelocity = cc.v2((Math.random() - 0.5) * 1.5, 0);
    }
}

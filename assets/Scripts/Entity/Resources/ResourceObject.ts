import EventCenter from "../../Core/EventCenter";
import { GameEvent } from "../../Core/Constants";

const { ccclass, property } = cc._decorator;

/**
 * ResourceObject — 基底類別
 * ─────────────────────────────────────────────
 * 管理「被攻擊幾下後觸發掉落」的核心邏輯。
 * 支援全域武器物理碰撞受擊與滑鼠世界座標點擊判定。
 */
@ccclass
export default class ResourceObject extends cc.Component {

    @property({ tooltip: '每幾下攻擊觸發一次掉落' })
    hitsPerDrop: number = 3;

    @property({ tooltip: '每次掉落幾個' })
    dropAmount: number = 1;

    @property({ tooltip: '互動距離（px）' })
    interactDistance: number = 160;

    @property(cc.SpriteFrame)
    depletedSpriteFrame: cc.SpriteFrame = null!;

    @property(cc.Sprite)
    targetSprite: cc.Sprite = null!;

    protected hitCount: number = 0;
    private inputLockedByGamePause: boolean = false;

    onLoad() {
        // 🌟 修正 1：改為全域場景監聽，避免超出 Canvas 框群組後失效
        const scene = cc.director.getScene();
        if (scene) {
            scene.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        }
        EventCenter.on(GameEvent.GAME_PAUSED, this.onGamePaused, this);
        EventCenter.on(GameEvent.GAME_RESUMED, this.onGameResumed, this);
    }

    onDestroy() {
        const scene = cc.director.getScene();
        if (scene) {
            scene.off(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        }
        EventCenter.off(GameEvent.GAME_PAUSED, this.onGamePaused, this);
        EventCenter.off(GameEvent.GAME_RESUMED, this.onGameResumed, this);
    }

    /** 🌟 修正 2：加入 Box2D 物理碰撞監聽，讓武器揮砍判定與滑鼠分離 */
    onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
        // 根據日誌，判定是否命中帶有 CombatHitbox 腳本或名稱為 AttackHitbox 的武器節點
        const isWeapon = otherCollider.node.name === "AttackHitbox" || otherCollider.getComponent("CombatHitbox");
        
        if (isWeapon) {
            cc.log(`[ResourceObject] ${this.node.name} 被武器物理碰撞擊中`);
            if (!this.canInteract()) return;
            this.receiveHit();
        }
    }

    private onMouseDown(event: cc.Event.EventMouse) {
        if (this.inputLockedByGamePause) return;
        const inventoryUI = cc.find('Canvas/UI Root/InventoryUI');
        if (inventoryUI && inventoryUI.active) return;
        if (event.getButton() !== cc.Event.EventMouse.BUTTON_LEFT) return;

        // 🌟 修正 3：滑鼠螢幕座標透過相機轉換為真實世界座標，解決相機移動後的座標錯位
        let mouseWorldPos = event.getLocation();
        const cameraNode = cc.find("Canvas/Main Camera") || cc.find("Main Camera");
        if (cameraNode) {
            const mainCamera = cameraNode.getComponent(cc.Camera);
            if (mainCamera) {
                mouseWorldPos = mainCamera.getScreenToWorldPoint(event.getLocation());
            }
        }

        // 取得該資源物件在世界座標系的 Bounding Box
        const nodeBoundingBox = this.node.getBoundingBoxToWorld();
        
        // 精準檢查點擊範圍是否落在物件身上
        if (!nodeBoundingBox.contains(mouseWorldPos)) {
            return;
        }

        cc.log(`[ResourceObject] 滑鼠點擊精準命中 ${this.node.name}`);
        if (!this.checkDistance()) return;
        if (!this.canInteract()) return;

        this.receiveHit();
    }

    private checkDistance(): boolean {
        const player = cc.find('Canvas/Player');
        if (!player) return false;

        const dist = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO)
                         .sub(player.convertToWorldSpaceAR(cc.Vec2.ZERO)).mag();

        if (dist > this.interactDistance) {
            cc.log(`[ResourceObject] 距離 ${dist.toFixed(0)} > ${this.interactDistance}，太遠`);
            return false;
        }
        return true;
    }

    private receiveHit() {
        this.hitCount++;
        cc.log(`[ResourceObject] ${this.node.name} 累計受擊 ${this.hitCount}/${this.hitsPerDrop}`);

        if (this.hitCount >= this.hitsPerDrop) {
            this.hitCount = 0;
            this.onDrop();
        }
    }

    // ── 子類覆寫的 Hook ──────────────────────────────

    protected onDrop() {
        cc.log(`[ResourceObject] onDrop（子類應覆寫）`);
    }

    protected onDepleted() {
        cc.log(`[ResourceObject] onDepleted（子類應覆寫）`);
    }

    protected canInteract(): boolean {
        return true;
    }

    // ── 工具方法（子類可用） ─────────────────────────

    protected spawnPrefab(prefab: cc.Prefab, worldX: number, worldY: number) {
        if (!prefab) {
            cc.warn(`[ResourceObject] spawnPrefab：prefab 為 null`);
            return;
        }
        const node = cc.instantiate(prefab);
        node.parent = this.node.parent;
        node.setPosition(
            this.node.parent.convertToNodeSpaceAR(cc.v2(worldX, worldY))
        );
        const drop = node.getComponent('DropItem') as any;
        if (drop) drop.launch();
        cc.log(`[ResourceObject] 生成掉落物 ${node.name}`);
    }

    /** 切換成耗盡外觀（子類呼叫） */
    protected changeToDepletedSprite() {
        if (!this.depletedSpriteFrame) return;
        const sprite = this.targetSprite || this.getComponent(cc.Sprite);
        if (!sprite) return;
        sprite.spriteFrame = this.depletedSpriteFrame;
        sprite.sizeMode    = cc.Sprite.SizeMode.CUSTOM;
        cc.log(`[ResourceObject] ${this.node.name} 切換成耗盡外觀`);
    }

    protected getWorldPos(): cc.Vec2 {
        return this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
    }

    private onGamePaused(): void {
        this.inputLockedByGamePause = true;
    }

    private onGameResumed(): void {
        this.inputLockedByGamePause = false;
    }
}
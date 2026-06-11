const { ccclass, property } = cc._decorator;

/**
 * Rope
 * ─────────────────────────────────────────────
 * 掛在藤蔓 / 梯子的父節點上。
 * 子節點串成鏈狀，這個 script 負責：
 *   1. 偵測玩家進入 / 離開範圍
 *   2. 玩家按 W 時通知 PlayerController 進入爬行
 *   3. 提供頂端 / 底端座標給 PlayerController 判斷邊界
 *
 * 節點結構範例：
 *   [Rope]              ← 掛 Rope.ts + PhysicsBoxCollider(sensor)
 *     ├─ segment_0      ← 藤蔓節點（視覺用）
 *     ├─ segment_1
 *     └─ segment_n
 */
@ccclass
export default class Rope extends cc.Component {

    @property({ tooltip: '爬行速度（px/s）' })
    climbSpeed: number = 160;

    @property({ tooltip: '水平微移速度（px/s）' })
    horizontalDriftSpeed: number = 60;

    @property({ tooltip: '頂端偏移（從節點中心往上，px）' })
    topOffset: number = 0;

    @property({ tooltip: '底端偏移（從節點中心往下，px）' })
    bottomOffset: number = 0;

    // 目前在範圍內的玩家（sensor overlap）
    private playerInRange: cc.Node | null = null;

    onLoad() {
        const col = this.getComponent(cc.PhysicsCollider);
        if (col) {
            col.sensor = true;
            (col as any).enabledContactListener = true;
            col.apply(); // ← 加這行，確保設定生效
            cc.log('[Rope] collider 設定完成, sensor=true');
        }
    }

    // ── 玩家進入範圍 ─────────────────────────────────
    onBeginContact(
        _contact: cc.PhysicsContact,
        _self: cc.PhysicsCollider,
        other: cc.PhysicsCollider
    ) {
        if (!this.isPlayer(other.node)) return;
        this.playerInRange = other.node;
        cc.log('[Rope] 玩家進入藤蔓範圍');

        // 通知玩家：你在藤蔓旁邊了，可以按 W 抓住
        const ctrl = this.getPlayerController(other.node);
        if (ctrl) ctrl.onNearRope(this);
    }

    // ── 玩家離開範圍 ─────────────────────────────────
    onEndContact(
        _contact: cc.PhysicsContact,
        _self: cc.PhysicsCollider,
        other: cc.PhysicsCollider
    ) {
        if (!this.isPlayer(other.node)) return;
        cc.log('[Rope] 玩家離開藤蔓範圍');

        const ctrl = this.getPlayerController(other.node);
        if (ctrl) ctrl.onLeaveRope(this);

        this.playerInRange = null;
    }

    // ── 公開 API：給 PlayerController 查詢邊界 ───────

    /** 藤蔓頂端的世界 Y 座標 */
    getTopWorldY(): number {
        const worldPos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const col = this.getComponent(cc.PhysicsCollider) as any;
        const halfH = col ? (col.size ? col.size.height / 2 : this.node.height / 2) : this.node.height / 2;
        return worldPos.y + halfH + this.topOffset;
    }

    /** 藤蔓底端的世界 Y 座標 */
    getBottomWorldY(): number {
        const worldPos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const col = this.getComponent(cc.PhysicsCollider) as any;
        const halfH = col ? (col.size ? col.size.height / 2 : this.node.height / 2) : this.node.height / 2;
        return worldPos.y - halfH - this.bottomOffset;
    }

    /** 藤蔓中心的世界 X 座標（讓玩家對齊用） */
    getCenterWorldX(): number {
        return this.node.convertToWorldSpaceAR(cc.Vec2.ZERO).x;
    }

    getClimbSpeed(): number    { return this.climbSpeed; }
    getDriftSpeed(): number    { return this.horizontalDriftSpeed; }

    // ── 私有輔助 ─────────────────────────────────────

    private isPlayer(node: cc.Node): boolean {
        let current = node;
        while (current) {
            if (current.getComponent('PlayerController')) return true;
            current = current.parent;
        }
        return false;
    }

    private getPlayerController(node: cc.Node): any {
        let current = node;
        while (current) {
            const ctrl = current.getComponent('PlayerController');
            if (ctrl) return ctrl;
            current = current.parent;
        }
        return null;
    }
}
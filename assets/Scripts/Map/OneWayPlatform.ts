const { ccclass, property } = cc._decorator;

@ccclass
export default class OneWayPlatform extends cc.Component {

    @property({ tooltip: '玩家腳底高於平台上表面的容許誤差' })
    topTolerance: number = 16;

    onLoad() {
        const col = this.getComponent(cc.PhysicsCollider);
        if (col) {
            (col as any).enabledContactListener = true;
            col.apply();
        }
    }

    onPreSolve(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        const player = this.findPlayer(other.node);
        if (!player) {
            return;
        }

        const rb = player.getComponent(cc.RigidBody);
        if (!rb) {
            contact.disabled = true;
            return;
        }

        const playerCollider = other as any;
        const playerWorldPos = player.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const platformWorldPos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);

        const playerHalfHeight = playerCollider.size
            ? playerCollider.size.height / 2
            : player.height / 2;

        const playerBottomY = playerWorldPos.y - playerHalfHeight;
        const platformTopY = platformWorldPos.y + this.getPlatformHalfHeight(self);

        const isAbovePlatform = playerBottomY >= platformTopY - this.topTolerance;
        const isMovingDown = rb.linearVelocity.y <= 0;

        if (!isAbovePlatform || !isMovingDown) {
            contact.disabled = true;
        }
    }

    private getPlatformHalfHeight(col: cc.PhysicsCollider): number {
        const anyCol: any = col;

        if (anyCol.size) {
            return anyCol.size.height / 2;
        }

        if (this.node.height > 0) {
            return this.node.height / 2;
        }

        return 15;
    }

    private findPlayer(node: cc.Node): cc.Node | null {
        let current: cc.Node | null = node;

        while (current) {
            if (current.getComponent('PlayerController')) {
                return current;
            }
            current = current.parent;
        }

        return null;
    }
}
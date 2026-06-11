const { ccclass, property } = cc._decorator;

@ccclass
export default class CameraUIFollower extends cc.Component {

    @property(cc.Node)
    targetCamera: cc.Node = null!;

    @property(cc.Boolean)
    followX: boolean = true;

    @property(cc.Boolean)
    followY: boolean = true;

    private offset: cc.Vec2 = cc.v2(0, 0);

    onLoad() {
        if (!this.targetCamera) {
            cc.error("[CameraUIFollower] targetCamera is not assigned.");
            return;
        }

        this.offset.x = this.node.x - this.targetCamera.x;
        this.offset.y = this.node.y - this.targetCamera.y;
    }

    lateUpdate() {
        if (!this.targetCamera) {
            return;
        }

        let nextX = this.node.x;
        let nextY = this.node.y;

        if (this.followX) {
            nextX = this.targetCamera.x + this.offset.x;
        }

        if (this.followY) {
            nextY = this.targetCamera.y + this.offset.y;
        }

        this.node.setPosition(nextX, nextY);
    }
}
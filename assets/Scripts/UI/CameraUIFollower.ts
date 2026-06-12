const { ccclass, property } = cc._decorator;

@ccclass
export default class CameraUIFollower extends cc.Component {

    @property(cc.Node)
    targetCamera: cc.Node = null!;

    @property(cc.Boolean)
    followX: boolean = true;

    @property(cc.Boolean)
    followY: boolean = true;

    @property(cc.Boolean)
    compensateCameraZoomScale: boolean = true;

    private offset: cc.Vec2 = cc.v2(0, 0);
    private baseScale: cc.Vec2 = cc.v2(1, 1);
    private baseZoom: number = 1;
    private camera: cc.Camera = null;

    onLoad() {
        if (!this.targetCamera) {
            cc.error("[CameraUIFollower] targetCamera is not assigned.");
            return;
        }

        this.camera = this.targetCamera.getComponent(cc.Camera);
        this.baseZoom = this.camera ? Math.max(0.01, this.camera.zoomRatio || 1) : 1;
        this.baseScale = cc.v2(this.node.scaleX, this.node.scaleY);
        this.offset = this.getNodeWorldPosition(this.node).sub(this.getNodeWorldPosition(this.targetCamera));
    }

    lateUpdate() {
        if (!this.targetCamera) {
            return;
        }

        const currentZoom = this.camera ? Math.max(0.01, this.camera.zoomRatio || 1) : this.baseZoom;
        const zoomFactor = currentZoom / this.baseZoom;
        const offsetFactor = this.baseZoom / currentZoom;
        const scaleFactor = this.compensateCameraZoomScale ? offsetFactor : zoomFactor;
        const currentWorld = this.getNodeWorldPosition(this.node);
        const cameraWorld = this.getNodeWorldPosition(this.targetCamera);
        const targetWorld = cameraWorld.clone().add(this.offset.clone().mul(offsetFactor));

        if (this.followX) {
            currentWorld.x = targetWorld.x;
        }

        if (this.followY) {
            currentWorld.y = targetWorld.y;
        }

        this.setNodeWorldPosition(this.node, currentWorld);
        this.node.scaleX = this.baseScale.x * scaleFactor;
        this.node.scaleY = this.baseScale.y * scaleFactor;
    }

    private getNodeWorldPosition(node: cc.Node): cc.Vec2 {
        return node.parent
            ? node.parent.convertToWorldSpaceAR(node.position)
            : cc.v2(node.x, node.y);
    }

    private setNodeWorldPosition(node: cc.Node, worldPosition: cc.Vec2): void {
        if (node.parent) {
            node.setPosition(node.parent.convertToNodeSpaceAR(worldPosition));
        } else {
            node.setPosition(worldPosition);
        }
    }
}

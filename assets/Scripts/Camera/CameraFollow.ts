const { ccclass, property } = cc._decorator;

@ccclass
export default class CameraFollow extends cc.Component {
    @property(cc.Node)
    target: cc.Node = null!;

    @property
    targetPath: string = "Canvas/Player";

    @property
    followX: boolean = true;

    @property
    followY: boolean = false;

    @property
    smoothFollow: boolean = true;

    @property
    smoothSpeed: number = 6;

    @property(cc.Float)
    targetOffsetX: number = 0;

    @property(cc.Float)
    targetOffsetY: number = 160;

    @property
    useXLimit: boolean = true;

    @property
    minX: number = -2000;

    @property
    maxX: number = 960;

    @property
    useYLimit: boolean = false;

    @property
    minY: number = 0;

    @property
    maxY: number = 0;

    onLoad() {
        if (!this.target && this.targetPath !== "") {
            this.target = cc.find(this.targetPath) || null!;
        }

        if (!this.target) {
            cc.warn("[CameraFollow] Target not found.");
        }
    }

    lateUpdate(dt: number) {
        if (!this.target) {
            return;
        }

        let nextX = this.node.x;
        let nextY = this.node.y;

        if (this.followX) {
            nextX = this.target.x + this.targetOffsetX;
        }

        if (this.followY) {
            nextY = this.target.y + this.targetOffsetY;
        }

        if (this.useXLimit) {
            nextX = this.clamp(nextX, this.minX, this.maxX);
        }

        if (this.useYLimit) {
            nextY = this.clamp(nextY, this.minY, this.maxY);
        }

        if (this.smoothFollow) {
            const ratio = Math.min(1, dt * this.smoothSpeed);
            this.node.x = this.node.x + (nextX - this.node.x) * ratio;
            this.node.y = this.node.y + (nextY - this.node.y) * ratio;
        } else {
            this.node.x = nextX;
            this.node.y = nextY;
        }
    }

    public setBounds(minX: number, maxX: number, minY: number, maxY: number): void {
        this.useXLimit = true;
        this.useYLimit = true;
        this.minX = minX;
        this.maxX = maxX;
        this.minY = minY;
        this.maxY = maxY;
    }

    private clamp(value: number, min: number, max: number): number {
        if (value < min) {
            return min;
        }

        if (value > max) {
            return max;
        }

        return value;
    }
}
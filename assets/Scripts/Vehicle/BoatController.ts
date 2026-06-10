import VehicleController from "./VehicleController";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BoatController extends VehicleController {
    @property(cc.Float)
    public horizontalSpeed: number = 300;

    @property(cc.Float)
    public verticalSpeed: number = 160;

    @property(cc.Float)
    public control: number = 5;

    @property(cc.Float)
    public boostAcceleration: number = 520;

    @property(cc.Float)
    public maxBoostSpeed: number = 420;

    @property(cc.Float)
    public waterDrag: number = 0.985;

    private facing: number = 1;

    update(dt: number): void {
        super.update(dt);
        if (!this.rb || !this.isMounted()) {
            return;
        }

        const axisX = this.getMoveX();
        const axisY = this.getMoveY();
        if (axisX !== 0) {
            this.facing = axisX > 0 ? 1 : -1;
        }

        const velocity = this.rb.linearVelocity || cc.v2(0, 0);
        const ratio = Math.min(1, this.control * dt);
        let nextX = velocity.x + (axisX * this.horizontalSpeed - velocity.x) * ratio;
        let nextY = velocity.y + (axisY * this.verticalSpeed - velocity.y) * ratio;

        if (this.isJumpHeld()) {
            nextX += this.facing * this.boostAcceleration * dt;
        }

        nextX = Math.max(-this.maxBoostSpeed, Math.min(this.maxBoostSpeed, nextX));
        const dragRatio = Math.pow(this.waterDrag, dt * 60);
        this.rb.linearVelocity = cc.v2(nextX * dragRatio, nextY * dragRatio);
        this.rb.awake = true;
    }
}

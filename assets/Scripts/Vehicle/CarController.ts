import VehicleController from "./VehicleController";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CarController extends VehicleController {
    @property(cc.Float)
    public acceleration: number = 900;

    @property(cc.Float)
    public maxSpeed: number = 420;

    @property(cc.Float)
    public brakeStrength: number = 1400;

    @property(cc.Float)
    public idleDrag: number = 0.94;

    update(dt: number): void {
        super.update(dt);
        if (!this.rb || !this.isMounted()) {
            return;
        }

        const velocity = this.rb.linearVelocity || cc.v2(0, 0);
        let nextX = velocity.x + this.getMoveX() * this.acceleration * dt;

        if (this.isJumpHeld()) {
            nextX = this.moveToward(nextX, 0, this.brakeStrength * dt);
        } else if (this.getMoveX() === 0) {
            nextX *= Math.pow(this.idleDrag, dt * 60);
        }

        nextX = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, nextX));
        this.rb.linearVelocity = cc.v2(nextX, velocity.y);
        this.rb.awake = true;
    }

    private moveToward(value: number, target: number, maxDelta: number): number {
        if (Math.abs(target - value) <= maxDelta) {
            return target;
        }
        return value + Math.sign(target - value) * maxDelta;
    }
}

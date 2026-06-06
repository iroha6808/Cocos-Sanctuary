import PlayerController from "../Player/PlayerController";

const { ccclass } = cc._decorator;

@ccclass
export default class OceanArea extends cc.Component {
    private playersInside: PlayerController[] = [];

    onLoad() {
        const collider = this.getComponent(cc.PhysicsBoxCollider);

        if (collider) {
            collider.sensor = true;
            collider.apply();
        }
    }

    onBeginContact(
        contact: cc.PhysicsContact,
        selfCollider: cc.PhysicsCollider,
        otherCollider: cc.PhysicsCollider
    ) {
        const player = this.findPlayerController(otherCollider.node);

        if (!player) {
            return;
        }

        if (this.playersInside.indexOf(player) !== -1) {
            return;
        }

        this.playersInside.push(player);
        player.enterOceanArea();

        cc.log("Player entered ocean area");
    }

    onEndContact(
        contact: cc.PhysicsContact,
        selfCollider: cc.PhysicsCollider,
        otherCollider: cc.PhysicsCollider
    ) {
        const player = this.findPlayerController(otherCollider.node);

        if (!player) {
            return;
        }

        const index = this.playersInside.indexOf(player);
        if (index !== -1) {
            this.playersInside.splice(index, 1);
        }

        player.exitOceanArea();

        cc.log("Player exited ocean area");
    }

    private findPlayerController(node: cc.Node): PlayerController {
        let current: cc.Node | null = node;

        while (current) {
            if (current.name === "Player") {
                return current.getComponent(PlayerController) || null!;
            }

            current = current.parent;
        }

        return null!;
    }
}
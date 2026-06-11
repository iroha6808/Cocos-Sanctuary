import PlayerController from "../Player/PlayerController";
import EventCenter from "../Core/EventCenter";
import { GameEvent } from "../Core/Constants";

const { ccclass, property } = cc._decorator;

@ccclass
export default class OceanArea extends cc.Component {
    @property(PlayerController)
    public player: PlayerController = null!;

    @property(cc.Node)
    public playerNode: cc.Node = null!;

    private playerInside: boolean = false;
    private oceanCollider: cc.PhysicsBoxCollider = null!;

    onLoad() {
        const body = this.getComponent(cc.RigidBody);
        if (body) {
            body.type = cc.RigidBodyType.Static;
        }

        this.oceanCollider = this.getComponent(cc.PhysicsBoxCollider) || null!;
        if (this.oceanCollider) {
            this.oceanCollider.sensor = true;
            this.oceanCollider.apply();
        } else {
            cc.warn("[OceanArea] Missing PhysicsBoxCollider on OceanTrigger.");
        }

        if (this.player && cc.isValid(this.player.node)) {
            this.playerNode = this.player.node;
        } else {
            this.findPlayer();
        }
    }

    update() {
        if (!this.player || !this.playerNode || !cc.isValid(this.playerNode)) {
            this.findPlayer();
            return;
        }

        if (!this.oceanCollider) {
            return;
        }

        const isInsideNow = this.isPlayerInsideOcean();

        if (isInsideNow && !this.playerInside) {
            this.playerInside = true;
            this.player.enterOceanArea();
            EventCenter.emit(GameEvent.PLAYER_WATER_STATE_CHANGED, true, this.node);
            cc.log("[OceanArea] Player entered ocean area by bounds");
        }

        if (!isInsideNow && this.playerInside) {
            this.playerInside = false;
            this.player.exitOceanArea();
            EventCenter.emit(GameEvent.PLAYER_WATER_STATE_CHANGED, false, this.node);
            cc.log("[OceanArea] Player exited ocean area by bounds");
        }
    }

    private findPlayer() {
        const node = cc.find("Canvas/Player");
        if (!node) {
            return;
        }

        const player = node.getComponent(PlayerController);
        if (!player) {
            cc.warn("[OceanArea] PlayerController not found on Canvas/Player.");
            return;
        }

        this.playerNode = node;
        this.player = player;
    }

    private isPlayerInsideOcean(): boolean {
        const playerWorldPos = this.playerNode.parent
            ? this.playerNode.parent.convertToWorldSpaceAR(this.playerNode.position)
            : this.playerNode.position;

        const oceanRect = this.getOceanWorldRect();

        return (
            playerWorldPos.x >= oceanRect.xMin &&
            playerWorldPos.x <= oceanRect.xMax &&
            playerWorldPos.y >= oceanRect.yMin &&
            playerWorldPos.y <= oceanRect.yMax
        );
    }

    private getOceanWorldRect(): { xMin: number; xMax: number; yMin: number; yMax: number } {
        const size = this.oceanCollider.size;
        const offset = this.oceanCollider.offset;

        const leftBottomLocal = cc.v2(offset.x - size.width / 2, offset.y - size.height / 2);
        const rightTopLocal = cc.v2(offset.x + size.width / 2, offset.y + size.height / 2);

        const leftBottomWorld = this.node.convertToWorldSpaceAR(leftBottomLocal);
        const rightTopWorld = this.node.convertToWorldSpaceAR(rightTopLocal);

        return {
            xMin: Math.min(leftBottomWorld.x, rightTopWorld.x),
            xMax: Math.max(leftBottomWorld.x, rightTopWorld.x),
            yMin: Math.min(leftBottomWorld.y, rightTopWorld.y),
            yMax: Math.max(leftBottomWorld.y, rightTopWorld.y)
        };
    }
}

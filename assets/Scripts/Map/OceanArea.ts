import PlayerController from "../Player/PlayerController";
import EventCenter from "../Core/EventCenter";
import { GameEvent } from "../Core/Constants";
import { PhysicsTag } from "../Core/PhysicsTags";

const { ccclass, property } = cc._decorator;

@ccclass
export default class OceanArea extends cc.Component {
    @property(PlayerController)
    public player: PlayerController = null!;

    @property(cc.Node)
    public playerNode: cc.Node = null!;

    private playerInsideThisArea: boolean = false;
    private oceanCollider: cc.PhysicsBoxCollider = null!;

    private static activeAreaCount: number = 0;
    private static playerInOcean: boolean = false;
    private static areas: OceanArea[] = [];

    onLoad() {
        if (OceanArea.areas.indexOf(this) < 0) {
            OceanArea.areas.push(this);
        }

        const body = this.getComponent(cc.RigidBody);
        if (body) {
            body.type = cc.RigidBodyType.Static;
        }

        this.oceanCollider = this.getComponent(cc.PhysicsBoxCollider) || null!;
        if (this.oceanCollider) {
            this.oceanCollider.sensor = true;
            this.oceanCollider.tag = PhysicsTag.TRIGGER;
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

    onDestroy() {
        const areaIndex = OceanArea.areas.indexOf(this);
        if (areaIndex >= 0) {
            OceanArea.areas.splice(areaIndex, 1);
        }

        if (this.playerInsideThisArea) {
            this.playerInsideThisArea = false;
            OceanArea.activeAreaCount = Math.max(0, OceanArea.activeAreaCount - 1);
            this.refreshGlobalWaterState();
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

        if (isInsideNow && !this.playerInsideThisArea) {
            this.playerInsideThisArea = true;
            OceanArea.activeAreaCount++;
            this.refreshGlobalWaterState();
        }

        if (!isInsideNow && this.playerInsideThisArea) {
            this.playerInsideThisArea = false;
            OceanArea.activeAreaCount = Math.max(0, OceanArea.activeAreaCount - 1);
            this.refreshGlobalWaterState();
        }
    }

    private refreshGlobalWaterState() {
        if (!this.player || !cc.isValid(this.player.node)) {
            return;
        }

        const shouldBeInOcean = OceanArea.activeAreaCount > 0;

        if (shouldBeInOcean && !OceanArea.playerInOcean) {
            OceanArea.playerInOcean = true;
            this.player.enterOceanArea();
            EventCenter.emit(GameEvent.PLAYER_WATER_STATE_CHANGED, true, this.node);
            cc.log("[OceanArea] Player entered ocean area");
        }

        if (!shouldBeInOcean && OceanArea.playerInOcean) {
            OceanArea.playerInOcean = false;
            this.player.exitOceanArea();
            EventCenter.emit(GameEvent.PLAYER_WATER_STATE_CHANGED, false, this.node);
            cc.log("[OceanArea] Player exited ocean area");
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

        return this.containsWorldPoint(playerWorldPos);
    }

    public containsWorldPoint(point: cc.Vec2): boolean {
        if (!point || !this.oceanCollider || !cc.isValid(this.node)) {
            return false;
        }

        const bounds = this.getWorldBounds();
        return point.x >= bounds.xMin
            && point.x <= bounds.xMax
            && point.y >= bounds.yMin
            && point.y <= bounds.yMax;
    }

    public overlapsWorldRect(rect: cc.Rect): boolean {
        if (!rect || !this.oceanCollider || !cc.isValid(this.node)) {
            return false;
        }

        const bounds = this.getWorldBounds();
        return rect.xMin <= bounds.xMax
            && rect.xMax >= bounds.xMin
            && rect.yMin <= bounds.yMax
            && rect.yMax >= bounds.yMin;
    }

    public getWorldBounds(): cc.Rect {
        if (!this.oceanCollider || !cc.isValid(this.node)) {
            return cc.rect(0, 0, 0, 0);
        }

        const size = this.oceanCollider.size;
        const offset = this.oceanCollider.offset;
        const halfWidth = size.width * 0.5;
        const halfHeight = size.height * 0.5;
        const corners = [
            cc.v2(offset.x - halfWidth, offset.y - halfHeight),
            cc.v2(offset.x + halfWidth, offset.y - halfHeight),
            cc.v2(offset.x - halfWidth, offset.y + halfHeight),
            cc.v2(offset.x + halfWidth, offset.y + halfHeight)
        ].map(point => this.node.convertToWorldSpaceAR(point));

        const xs = corners.map(point => point.x);
        const ys = corners.map(point => point.y);
        const minX = Math.min.apply(null, xs);
        const maxX = Math.max.apply(null, xs);
        const minY = Math.min.apply(null, ys);
        const maxY = Math.max.apply(null, ys);
        return cc.rect(minX, minY, maxX - minX, maxY - minY);
    }

    public static containsPointInAnyOcean(point: cc.Vec2): boolean {
        return OceanArea.getValidAreas().some(area => area.containsWorldPoint(point));
    }

    public static overlapsAnyOcean(rect: cc.Rect): boolean {
        return OceanArea.getValidAreas().some(area => area.overlapsWorldRect(rect));
    }

    public static getActiveAreas(): OceanArea[] {
        return OceanArea.getValidAreas().slice();
    }

    private static getValidAreas(): OceanArea[] {
        OceanArea.areas = OceanArea.areas.filter(area => (
            !!area && !!area.node && cc.isValid(area.node)
        ));
        return OceanArea.areas;
    }
}

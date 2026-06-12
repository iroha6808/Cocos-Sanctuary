import OceanArea from "../Map/OceanArea";
import { PhysicsTag } from "../Core/PhysicsTags";

const { ccclass, property } = cc._decorator;

export interface LandSpawnRequest {
    playerNode: cc.Node;
    spawnParent: cc.Node;
    minDistance: number;
    maxDistance: number;
    clearanceWidth: number;
    clearanceHeight: number;
    occupiedWorldPositions?: cc.Vec2[];
    minimumSpacing?: number;
    avoidCameraView?: boolean;
    cameraPadding?: number;
}

export interface LandSpawnResult {
    worldPosition: cc.Vec2;
    localPosition: cc.Vec2;
    groundNode: cc.Node;
}

interface GroundSupport {
    point: cc.Vec2;
    collider: cc.PhysicsCollider;
}

@ccclass
export default class LandSpawnPositionResolver extends cc.Component {
    @property(cc.Float)
    public raycastHeight: number = 500;

    @property(cc.Float)
    public raycastDepth: number = 1000;

    @property(cc.Float)
    public spawnHeightOffset: number = 2;

    @property(cc.Integer)
    public maxPositionAttempts: number = 12;

    @property(cc.Float)
    public supportProbeDepth: number = 28;

    @property(cc.Float)
    public supportInset: number = 4;

    @property(cc.Float)
    public maxSupportHeightDifference: number = 12;

    @property([cc.Integer])
    public groundGroupIndices: number[] = [0];

    @property(cc.Boolean)
    public allowGroundGroupFallback: boolean = true;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    @property(cc.Boolean)
    public debugDraw: boolean = false;

    private debugGraphics: cc.Graphics = null;

    public findLandPosition(request: LandSpawnRequest): LandSpawnResult {
        if (
            !request
            || !request.playerNode
            || !cc.isValid(request.playerNode)
            || !request.spawnParent
            || !cc.isValid(request.spawnParent)
        ) {
            this.log("rejected: missing player or spawn parent");
            return null;
        }

        this.prepareDebugDraw();
        const playerWorld = this.getWorldPosition(request.playerNode);
        const minDistance = Math.max(
            0,
            Math.min(request.minDistance, request.maxDistance)
        );
        const maxDistance = Math.max(
            minDistance,
            Math.max(request.minDistance, request.maxDistance)
        );
        const width = Math.max(8, request.clearanceWidth);
        const height = Math.max(8, request.clearanceHeight);

        for (let attempt = 0; attempt < Math.max(1, this.maxPositionAttempts); attempt++) {
            const direction = Math.random() < 0.5 ? -1 : 1;
            const distance = minDistance + Math.random() * (maxDistance - minDistance);
            const candidateX = playerWorld.x + direction * distance;
            const ground = this.findGround(candidateX, playerWorld.y);

            if (!ground) {
                this.reject(attempt, cc.v2(candidateX, playerWorld.y), "no terrain");
                continue;
            }

            const worldPosition = cc.v2(
                ground.point.x,
                ground.point.y + height * 0.5 + Math.max(0, this.spawnHeightOffset)
            );
            const bodyRect = cc.rect(
                worldPosition.x - width * 0.5,
                worldPosition.y - height * 0.5,
                width,
                height
            );

            if (
                OceanArea.containsPointInAnyOcean(ground.point)
                || OceanArea.containsPointInAnyOcean(worldPosition)
                || OceanArea.overlapsAnyOcean(bodyRect)
            ) {
                this.reject(attempt, worldPosition, "inside OceanArea");
                continue;
            }

            if (!this.hasStableSupport(ground, width)) {
                this.reject(attempt, worldPosition, "missing or uneven support");
                continue;
            }

            if (!this.hasClearance(worldPosition, width, height, ground.collider)) {
                this.reject(attempt, worldPosition, "clearance blocked");
                continue;
            }

            if (this.isTooClose(worldPosition, request)) {
                this.reject(attempt, worldPosition, "too close to occupied position");
                continue;
            }

            if (
                request.avoidCameraView
                && this.isInsideCamera(
                    worldPosition,
                    width,
                    height,
                    Math.max(0, request.cameraPadding || 0)
                )
            ) {
                this.reject(attempt, worldPosition, "inside camera view");
                continue;
            }

            this.drawBody(worldPosition, width, height, true);
            this.log(
                `accepted: ground=${ground.collider.node.name}, ` +
                `world=(${worldPosition.x.toFixed(1)}, ${worldPosition.y.toFixed(1)})`
            );
            return {
                worldPosition,
                localPosition: request.spawnParent.convertToNodeSpaceAR(worldPosition),
                groundNode: ground.collider.node
            };
        }

        this.log("rejected: maximum position attempts reached");
        return null;
    }

    private findGround(x: number, referenceY: number): GroundSupport {
        const start = cc.v2(x, referenceY + Math.max(1, this.raycastHeight));
        const end = cc.v2(x, referenceY - Math.max(1, this.raycastDepth));
        this.drawRay(start, end, cc.color(240, 210, 70, 170));
        return this.findHighestTerrainHit(start, end);
    }

    private findHighestTerrainHit(start: cc.Vec2, end: cc.Vec2): GroundSupport {
        const results = cc.director.getPhysicsManager()
            .rayCast(start, end, cc.RayCastType.All) || [];
        let best: GroundSupport = null;

        for (const result of results) {
            if (!this.isValidTerrainHit(result)) {
                continue;
            }
            if (!best || result.point.y > best.point.y) {
                best = {
                    point: result.point,
                    collider: result.collider
                };
            }
        }
        return best;
    }

    private isValidTerrainHit(result: cc.PhysicsRayCastResult): boolean {
        if (
            !result
            || !result.collider
            || !result.collider.node
            || result.collider.sensor
        ) {
            return false;
        }

        if (result.collider.tag === PhysicsTag.TERRAIN) {
            return true;
        }

        return result.collider.tag === PhysicsTag.DEFAULT
            && this.allowGroundGroupFallback
            && this.isGroundGroup(result.collider.node.groupIndex);
    }

    private hasStableSupport(centerGround: GroundSupport, width: number): boolean {
        const halfWidth = width * 0.5;
        const inset = Math.min(
            Math.max(1, this.supportInset),
            Math.max(1, halfWidth - 1)
        );
        const offsets = [-halfWidth + inset, 0, halfWidth - inset];
        const supports: GroundSupport[] = [];

        for (const offset of offsets) {
            const x = centerGround.point.x + offset;
            const start = cc.v2(
                x,
                centerGround.point.y
                    + Math.max(4, this.maxSupportHeightDifference + 4)
            );
            const end = cc.v2(
                x,
                centerGround.point.y - Math.max(4, this.supportProbeDepth)
            );
            this.drawRay(start, end, cc.color(80, 180, 255, 180));
            const support = this.findHighestTerrainHit(start, end);
            if (!support || OceanArea.containsPointInAnyOcean(support.point)) {
                return false;
            }
            supports.push(support);
        }

        const heights = supports.map(support => support.point.y);
        const minHeight = Math.min.apply(null, heights);
        const maxHeight = Math.max.apply(null, heights);
        return maxHeight - minHeight <= Math.max(0, this.maxSupportHeightDifference);
    }

    private hasClearance(
        center: cc.Vec2,
        width: number,
        height: number,
        groundCollider: cc.PhysicsCollider
    ): boolean {
        const halfWidth = width * 0.5;
        const halfHeight = height * 0.5;
        const inset = 2;
        const bottom = center.y - halfHeight + Math.max(2, this.spawnHeightOffset + 1);
        const top = center.y + halfHeight - inset;
        const left = center.x - halfWidth + inset;
        const right = center.x + halfWidth - inset;
        const rays = [
            [cc.v2(left, bottom), cc.v2(left, top)],
            [cc.v2(center.x, bottom), cc.v2(center.x, top)],
            [cc.v2(right, bottom), cc.v2(right, top)],
            [cc.v2(left, center.y), cc.v2(right, center.y)]
        ];

        for (const ray of rays) {
            const results = cc.director.getPhysicsManager()
                .rayCast(ray[0], ray[1], cc.RayCastType.All) || [];
            this.drawRay(ray[0], ray[1], cc.color(220, 120, 80, 130));
            if (results.some(result => (
                !!result
                && !!result.collider
                && !!result.collider.node
                && !result.collider.sensor
                && result.collider !== groundCollider
            ))) {
                return false;
            }
        }
        return true;
    }

    private isTooClose(position: cc.Vec2, request: LandSpawnRequest): boolean {
        const minDistance = Math.max(0, request.minimumSpacing || 0);
        return (request.occupiedWorldPositions || []).some(other => (
            !!other && position.sub(other).mag() < minDistance
        ));
    }

    private isInsideCamera(
        position: cc.Vec2,
        width: number,
        height: number,
        padding: number
    ): boolean {
        const camera = cc.Camera.main;
        if (!camera || !camera.node) {
            return false;
        }

        const cameraWorld = this.getWorldPosition(camera.node);
        const zoom = Math.max(0.01, (camera as any).zoomRatio || 1);
        const halfWidth = cc.winSize.width * 0.5 / zoom + padding + width * 0.5;
        const halfHeight = cc.winSize.height * 0.5 / zoom + padding + height * 0.5;
        return Math.abs(position.x - cameraWorld.x) <= halfWidth
            && Math.abs(position.y - cameraWorld.y) <= halfHeight;
    }

    private isGroundGroup(groupIndex: number): boolean {
        return !this.groundGroupIndices
            || this.groundGroupIndices.length <= 0
            || this.groundGroupIndices.indexOf(groupIndex) >= 0;
    }

    private getWorldPosition(node: cc.Node): cc.Vec2 {
        return node.parent
            ? node.parent.convertToWorldSpaceAR(node.position)
            : cc.v2(node.x, node.y);
    }

    private reject(attempt: number, position: cc.Vec2, reason: string): void {
        this.drawBody(position, 12, 12, false);
        this.log(`attempt ${attempt + 1} rejected: ${reason}`);
    }

    private prepareDebugDraw(): void {
        if (!this.debugDraw) {
            if (this.debugGraphics) {
                this.debugGraphics.clear();
            }
            return;
        }

        if (!this.debugGraphics) {
            let node = this.node.getChildByName("LandSpawnDebug");
            if (!node) {
                node = new cc.Node("LandSpawnDebug");
                this.node.addChild(node);
            }
            this.debugGraphics = node.getComponent(cc.Graphics)
                || node.addComponent(cc.Graphics);
        }
        this.debugGraphics.clear();
        this.drawOceanBounds();
    }

    private drawOceanBounds(): void {
        if (!this.debugDraw || !this.debugGraphics || !this.debugGraphics.node.parent) {
            return;
        }

        const parent = this.debugGraphics.node.parent;
        this.debugGraphics.strokeColor = cc.color(70, 220, 235, 170);
        for (const area of OceanArea.getActiveAreas()) {
            const bounds = area.getWorldBounds();
            const leftBottom = parent.convertToNodeSpaceAR(cc.v2(bounds.xMin, bounds.yMin));
            const rightTop = parent.convertToNodeSpaceAR(cc.v2(bounds.xMax, bounds.yMax));
            this.debugGraphics.rect(
                leftBottom.x,
                leftBottom.y,
                rightTop.x - leftBottom.x,
                rightTop.y - leftBottom.y
            );
            this.debugGraphics.stroke();
        }
    }

    private drawRay(start: cc.Vec2, end: cc.Vec2, color: cc.Color): void {
        if (!this.debugDraw || !this.debugGraphics || !this.debugGraphics.node.parent) {
            return;
        }
        const parent = this.debugGraphics.node.parent;
        const localStart = parent.convertToNodeSpaceAR(start);
        const localEnd = parent.convertToNodeSpaceAR(end);
        this.debugGraphics.strokeColor = color;
        this.debugGraphics.moveTo(localStart.x, localStart.y);
        this.debugGraphics.lineTo(localEnd.x, localEnd.y);
        this.debugGraphics.stroke();
    }

    private drawBody(
        center: cc.Vec2,
        width: number,
        height: number,
        valid: boolean
    ): void {
        if (!this.debugDraw || !this.debugGraphics || !this.debugGraphics.node.parent) {
            return;
        }
        const local = this.debugGraphics.node.parent.convertToNodeSpaceAR(center);
        this.debugGraphics.strokeColor = valid
            ? cc.color(70, 230, 130, 220)
            : cc.color(245, 80, 80, 220);
        this.debugGraphics.rect(
            local.x - width * 0.5,
            local.y - height * 0.5,
            width,
            height
        );
        this.debugGraphics.stroke();
    }

    private log(message: string): void {
        if (this.debugLog) {
            cc.log(`[LandSpawn] ${message}`);
        }
    }
}

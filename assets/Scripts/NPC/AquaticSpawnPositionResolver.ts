import { PhysicsTag } from "../Core/PhysicsTags";
import { MonsterSpawnEntry } from "../Data/MonsterPool";
import OceanArea from "../Map/OceanArea";

const { ccclass, property } = cc._decorator;

export interface AquaticSpawnRequest {
    playerNode: cc.Node;
    spawnParent: cc.Node;
    entry: MonsterSpawnEntry;
    minDistance: number;
    maxDistance: number;
    occupiedWorldPositions?: cc.Vec2[];
    minimumSpacing?: number;
    avoidCameraView?: boolean;
    cameraPadding?: number;
}

export interface AquaticSpawnResult {
    worldPosition: cc.Vec2;
    localPosition: cc.Vec2;
    oceanArea: OceanArea;
}

@ccclass
export default class AquaticSpawnPositionResolver extends cc.Component {
    @property(cc.Integer)
    public maxPositionAttempts: number = 20;

    @property(cc.Float)
    public surfaceMargin: number = 32;

    @property(cc.Float)
    public bottomMargin: number = 32;

    @property(cc.Float)
    public sideMargin: number = 24;

    @property(cc.Boolean)
    public allowDefaultTerrainTag: boolean = true;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    @property(cc.Boolean)
    public debugDraw: boolean = false;

    private debugGraphics: cc.Graphics = null;

    public findAquaticPosition(request: AquaticSpawnRequest): AquaticSpawnResult {
        if (
            !request
            || !request.entry
            || !request.playerNode
            || !cc.isValid(request.playerNode)
            || !request.spawnParent
            || !cc.isValid(request.spawnParent)
        ) {
            this.log("rejected: missing request, player, parent, or entry");
            return null;
        }

        const areas = OceanArea.getActiveAreas();
        if (areas.length <= 0) {
            this.log("rejected: no active OceanArea");
            return null;
        }

        this.prepareDebugDraw(areas);
        const playerWorld = this.getWorldPosition(request.playerNode);
        const minDistance = Math.max(
            0,
            Math.min(request.minDistance, request.maxDistance)
        );
        const maxDistance = Math.max(
            minDistance,
            Math.max(request.minDistance, request.maxDistance)
        );
        const width = Math.max(8, request.entry.spawnClearanceWidth);
        const height = Math.max(8, request.entry.spawnClearanceHeight);
        const minDepth = this.clamp01(Math.min(
            request.entry.minDepthRatio,
            request.entry.maxDepthRatio
        ));
        const maxDepth = this.clamp01(Math.max(
            request.entry.minDepthRatio,
            request.entry.maxDepthRatio
        ));

        for (let attempt = 0; attempt < Math.max(1, this.maxPositionAttempts); attempt++) {
            const area = areas[Math.floor(Math.random() * areas.length)];
            const bounds = area.getWorldBounds();
            const minX = bounds.xMin + this.sideMargin + width * 0.5;
            const maxX = bounds.xMax - this.sideMargin - width * 0.5;
            const topY = bounds.yMax - this.surfaceMargin - height * 0.5;
            const bottomY = bounds.yMin + this.bottomMargin + height * 0.5;

            if (maxX <= minX || topY <= bottomY) {
                this.reject(
                    attempt,
                    cc.v2(
                        bounds.xMin + bounds.width * 0.5,
                        bounds.yMin + bounds.height * 0.5
                    ),
                    width,
                    height,
                    "insufficient water size"
                );
                continue;
            }

            const depthSpan = topY - bottomY;
            const shallowY = topY - depthSpan * minDepth;
            const deepY = topY - depthSpan * maxDepth;
            const candidate = cc.v2(
                minX + Math.random() * (maxX - minX),
                deepY + Math.random() * Math.max(0, shallowY - deepY)
            );
            const bodyRect = cc.rect(
                candidate.x - width * 0.5,
                candidate.y - height * 0.5,
                width,
                height
            );

            const distance = candidate.sub(playerWorld).mag();
            if (distance < minDistance || distance > maxDistance) {
                this.reject(attempt, candidate, width, height, "outside player distance");
                continue;
            }
            if (!area.containsWorldRect(bodyRect)) {
                this.reject(attempt, candidate, width, height, "outside OceanArea");
                continue;
            }
            if (this.isTooClose(candidate, request)) {
                this.reject(attempt, candidate, width, height, "too close to another NPC");
                continue;
            }
            if (this.overlapsTerrain(candidate, width, height)) {
                this.reject(attempt, candidate, width, height, "overlaps terrain");
                continue;
            }
            if (
                request.avoidCameraView
                && this.isInsideCamera(
                    candidate,
                    width,
                    height,
                    Math.max(0, request.cameraPadding || 0)
                )
            ) {
                this.reject(attempt, candidate, width, height, "inside camera view");
                continue;
            }

            this.drawBody(candidate, width, height, true);
            this.log(
                `accepted: area=${area.node.name}, world=`
                + `(${candidate.x.toFixed(1)}, ${candidate.y.toFixed(1)})`
            );
            return {
                worldPosition: candidate,
                localPosition: request.spawnParent.convertToNodeSpaceAR(candidate),
                oceanArea: area
            };
        }

        this.log("rejected: maximum position attempts reached");
        return null;
    }

    private overlapsTerrain(center: cc.Vec2, width: number, height: number): boolean {
        const halfWidth = width * 0.5;
        const halfHeight = height * 0.5;
        const left = center.x - halfWidth;
        const right = center.x + halfWidth;
        const bottom = center.y - halfHeight;
        const top = center.y + halfHeight;
        const rays: cc.Vec2[][] = [
            [cc.v2(left, bottom), cc.v2(right, bottom)],
            [cc.v2(left, top), cc.v2(right, top)],
            [cc.v2(left, bottom), cc.v2(left, top)],
            [cc.v2(right, bottom), cc.v2(right, top)],
            [cc.v2(left, bottom), cc.v2(right, top)],
            [cc.v2(left, top), cc.v2(right, bottom)]
        ];

        for (const ray of rays) {
            const hits = cc.director.getPhysicsManager()
                .rayCast(ray[0], ray[1], cc.RayCastType.All) || [];
            this.drawRay(ray[0], ray[1]);
            if (hits.some(hit => this.isBlockingCollider(hit.collider))) {
                return true;
            }
        }
        return false;
    }

    private isBlockingCollider(collider: cc.PhysicsCollider): boolean {
        if (!collider || !collider.node || collider.sensor) {
            return false;
        }
        return collider.tag === PhysicsTag.TERRAIN
            || (this.allowDefaultTerrainTag && collider.tag === PhysicsTag.DEFAULT);
    }

    private isTooClose(position: cc.Vec2, request: AquaticSpawnRequest): boolean {
        const minimum = Math.max(0, request.minimumSpacing || 0);
        return (request.occupiedWorldPositions || []).some(other => (
            !!other && position.sub(other).mag() < minimum
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

    private getWorldPosition(node: cc.Node): cc.Vec2 {
        return node.parent
            ? node.parent.convertToWorldSpaceAR(node.position)
            : cc.v2(node.x, node.y);
    }

    private clamp01(value: number): number {
        return Math.max(0, Math.min(1, isFinite(value) ? value : 0));
    }

    private reject(
        attempt: number,
        position: cc.Vec2,
        width: number,
        height: number,
        reason: string
    ): void {
        this.drawBody(position, width, height, false);
        this.log(`attempt ${attempt + 1} rejected: ${reason}`);
    }

    private prepareDebugDraw(areas: OceanArea[]): void {
        if (!this.debugDraw) {
            if (this.debugGraphics) {
                this.debugGraphics.clear();
            }
            return;
        }
        if (!this.debugGraphics) {
            let node = this.node.getChildByName("AquaticSpawnDebug");
            if (!node) {
                node = new cc.Node("AquaticSpawnDebug");
                this.node.addChild(node);
            }
            this.debugGraphics = node.getComponent(cc.Graphics)
                || node.addComponent(cc.Graphics);
        }
        this.debugGraphics.clear();
        this.debugGraphics.strokeColor = cc.color(70, 210, 240, 180);
        for (const area of areas) {
            const bounds = area.getWorldBounds();
            const local = this.node.convertToNodeSpaceAR(
                cc.v2(bounds.xMin, bounds.yMin)
            );
            this.debugGraphics.rect(local.x, local.y, bounds.width, bounds.height);
            this.debugGraphics.stroke();
        }
    }

    private drawBody(
        center: cc.Vec2,
        width: number,
        height: number,
        valid: boolean
    ): void {
        if (!this.debugDraw || !this.debugGraphics) {
            return;
        }
        const local = this.node.convertToNodeSpaceAR(center);
        this.debugGraphics.strokeColor = valid
            ? cc.color(70, 230, 130, 220)
            : cc.color(245, 80, 80, 180);
        this.debugGraphics.rect(
            local.x - width * 0.5,
            local.y - height * 0.5,
            width,
            height
        );
        this.debugGraphics.stroke();
    }

    private drawRay(start: cc.Vec2, end: cc.Vec2): void {
        if (!this.debugDraw || !this.debugGraphics) {
            return;
        }
        const localStart = this.node.convertToNodeSpaceAR(start);
        const localEnd = this.node.convertToNodeSpaceAR(end);
        this.debugGraphics.strokeColor = cc.color(245, 170, 70, 100);
        this.debugGraphics.moveTo(localStart.x, localStart.y);
        this.debugGraphics.lineTo(localEnd.x, localEnd.y);
        this.debugGraphics.stroke();
    }

    private log(message: string): void {
        if (this.debugLog) {
            cc.log(`[AquaticSpawn] ${message}`);
        }
    }
}

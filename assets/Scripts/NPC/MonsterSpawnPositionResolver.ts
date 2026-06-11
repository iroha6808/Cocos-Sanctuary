import { MonsterSpawnEntry } from "../Data/MonsterPool";

const { ccclass, property } = cc._decorator;

export interface MonsterSpawnPositionResult {
    worldPosition: cc.Vec2;
    localPosition: cc.Vec2;
    groundNode: cc.Node;
}

@ccclass
export default class MonsterSpawnPositionResolver extends cc.Component {
    @property(cc.Float)
    public minSpawnDistance: number = 500;

    @property(cc.Float)
    public maxSpawnDistance: number = 900;

    @property(cc.Float)
    public raycastHeight: number = 500;

    @property(cc.Float)
    public raycastDepth: number = 1000;

    @property(cc.Float)
    public spawnHeightOffset: number = 2;

    @property(cc.Integer)
    public maxPositionAttempts: number = 8;

    @property(cc.Float)
    public minimumMonsterSpacing: number = 80;

    @property(cc.Boolean)
    public avoidCameraView: boolean = true;

    @property(cc.Float)
    public cameraPadding: number = 80;

    @property([cc.Integer])
    public groundGroupIndices: number[] = [0];

    @property(cc.Boolean)
    public debugLog: boolean = false;

    @property(cc.Boolean)
    public debugDraw: boolean = false;

    private debugGraphics: cc.Graphics = null;

    public findSpawnPosition(
        playerNode: cc.Node,
        spawnParent: cc.Node,
        entry: MonsterSpawnEntry,
        occupiedWorldPositions: cc.Vec2[]
    ): MonsterSpawnPositionResult {
        if (!playerNode || !spawnParent || !entry) {
            this.log("missing player, spawn parent, or pool entry");
            return null;
        }

        this.prepareDebugDraw();
        const playerWorld = this.getWorldPosition(playerNode);
        const minDistance = Math.max(
            0,
            Math.min(this.minSpawnDistance, this.maxSpawnDistance)
        );
        const maxDistance = Math.max(
            minDistance,
            Math.max(this.minSpawnDistance, this.maxSpawnDistance)
        );

        for (let attempt = 0; attempt < Math.max(1, this.maxPositionAttempts); attempt++) {
            const direction = Math.random() < 0.5 ? -1 : 1;
            const distance = minDistance + Math.random() * (maxDistance - minDistance);
            const candidateX = playerWorld.x + direction * distance;
            const groundHit = this.findGround(candidateX, playerWorld.y);

            if (!groundHit) {
                this.log(`attempt ${attempt + 1}: no ground at x=${candidateX.toFixed(1)}`);
                this.drawCandidate(cc.v2(candidateX, playerWorld.y), false);
                continue;
            }

            const width = Math.max(8, entry.spawnClearanceWidth);
            const height = Math.max(8, entry.spawnClearanceHeight);
            const worldPosition = cc.v2(
                groundHit.point.x,
                groundHit.point.y + height * 0.5 + this.spawnHeightOffset
            );

            if (this.isInsideCamera(worldPosition, width, height)) {
                this.log(`attempt ${attempt + 1}: candidate is inside camera view`);
                this.drawCandidate(worldPosition, false);
                continue;
            }
            if (this.isTooCloseToMonster(worldPosition, occupiedWorldPositions)) {
                this.log(`attempt ${attempt + 1}: candidate is too close to another monster`);
                this.drawCandidate(worldPosition, false);
                continue;
            }
            if (!this.hasClearance(worldPosition, width, height)) {
                this.log(`attempt ${attempt + 1}: spawn clearance is blocked`);
                this.drawCandidate(worldPosition, false);
                continue;
            }

            this.drawCandidate(worldPosition, true);
            return {
                worldPosition,
                localPosition: spawnParent.convertToNodeSpaceAR(worldPosition),
                groundNode: groundHit.collider.node
            };
        }

        return null;
    }

    private findGround(x: number, referenceY: number): cc.PhysicsRayCastResult {
        const manager = cc.director.getPhysicsManager();
        const start = cc.v2(x, referenceY + Math.max(1, this.raycastHeight));
        const end = cc.v2(x, referenceY - Math.max(1, this.raycastDepth));
        const results = manager.rayCast(start, end, cc.RayCastType.All) || [];

        let best: cc.PhysicsRayCastResult = null;
        for (const result of results) {
            if (
                !result
                || !result.collider
                || !result.collider.node
                || result.collider.sensor
                || !this.isGroundGroup(result.collider.node.groupIndex)
            ) {
                continue;
            }
            if (!best || result.point.y > best.point.y) {
                best = result;
            }
        }
        return best;
    }

    private hasClearance(center: cc.Vec2, width: number, height: number): boolean {
        const manager = cc.director.getPhysicsManager();
        const halfWidth = width * 0.5;
        const halfHeight = height * 0.5;
        const inset = 2;
        const bottom = center.y - halfHeight + Math.max(2, this.spawnHeightOffset);
        const top = center.y + halfHeight;
        const left = center.x - halfWidth + inset;
        const right = center.x + halfWidth - inset;
        const rays = [
            [cc.v2(left, bottom), cc.v2(left, top)],
            [cc.v2(center.x, bottom), cc.v2(center.x, top)],
            [cc.v2(right, bottom), cc.v2(right, top)],
            [cc.v2(left, center.y), cc.v2(right, center.y)]
        ];

        for (const ray of rays) {
            const results = manager.rayCast(ray[0], ray[1], cc.RayCastType.All) || [];
            if (results.some(result => (
                result
                && result.collider
                && result.collider.node
                && !result.collider.sensor
            ))) {
                return false;
            }
        }
        return true;
    }

    private isGroundGroup(groupIndex: number): boolean {
        return !this.groundGroupIndices
            || this.groundGroupIndices.length <= 0
            || this.groundGroupIndices.indexOf(groupIndex) >= 0;
    }

    private isTooCloseToMonster(
        position: cc.Vec2,
        occupiedWorldPositions: cc.Vec2[]
    ): boolean {
        const minDistance = Math.max(0, this.minimumMonsterSpacing);
        return (occupiedWorldPositions || []).some(other => (
            !!other && position.sub(other).mag() < minDistance
        ));
    }

    private isInsideCamera(position: cc.Vec2, width: number, height: number): boolean {
        if (!this.avoidCameraView) {
            return false;
        }

        const camera = cc.Camera.main;
        if (!camera || !camera.node) {
            return false;
        }

        const cameraWorld = this.getWorldPosition(camera.node);
        const zoom = Math.max(0.01, (camera as any).zoomRatio || 1);
        const halfWidth = cc.winSize.width * 0.5 / zoom + this.cameraPadding + width * 0.5;
        const halfHeight = cc.winSize.height * 0.5 / zoom + this.cameraPadding + height * 0.5;
        return Math.abs(position.x - cameraWorld.x) <= halfWidth
            && Math.abs(position.y - cameraWorld.y) <= halfHeight;
    }

    private getWorldPosition(node: cc.Node): cc.Vec2 {
        return node.parent
            ? node.parent.convertToWorldSpaceAR(cc.v2(node.x, node.y))
            : cc.v2(node.x, node.y);
    }

    private prepareDebugDraw(): void {
        if (!this.debugDraw) {
            if (this.debugGraphics) {
                this.debugGraphics.clear();
            }
            return;
        }
        if (!this.debugGraphics) {
            let node = this.node.getChildByName("MonsterSpawnDebug");
            if (!node) {
                node = new cc.Node("MonsterSpawnDebug");
                this.node.addChild(node);
            }
            this.debugGraphics = node.getComponent(cc.Graphics) || node.addComponent(cc.Graphics);
        }
        this.debugGraphics.clear();
    }

    private drawCandidate(worldPosition: cc.Vec2, valid: boolean): void {
        if (!this.debugDraw || !this.debugGraphics || !this.debugGraphics.node.parent) {
            return;
        }
        const local = this.debugGraphics.node.parent.convertToNodeSpaceAR(worldPosition);
        this.debugGraphics.fillColor = valid
            ? cc.color(80, 220, 130, 190)
            : cc.color(240, 90, 90, 190);
        this.debugGraphics.circle(local.x, local.y, valid ? 8 : 5);
        this.debugGraphics.fill();
    }

    private log(message: string): void {
        if (this.debugLog) {
            cc.log(`[MonsterSpawnPositionResolver] ${message}`);
        }
    }
}


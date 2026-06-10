import PathGraph from "../Map/PathGraph";
import PathNode from "../Map/PathNode";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NPCPathAgent extends cc.Component {
    @property(PathGraph)
    public pathGraph: PathGraph = null;

    @property(cc.Float)
    public repathInterval: number = 0.35;

    @property(cc.Float)
    public waypointReachDistance: number = 28;

    @property(cc.Float)
    public portalUseDistance: number = 36;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    private path: PathNode[] = [];
    private pathIndex: number = 0;
    private repathTimer: number = 0;
    private lastTargetWorld: cc.Vec2 = null;

    public getSteeringDirection(targetWorld: cc.Vec2, dt: number): cc.Vec2 {
        if (!targetWorld) {
            return null;
        }

        this.repathTimer -= dt;
        const shouldRepath = this.repathTimer <= 0 || this.hasTargetMoved(targetWorld);
        if (shouldRepath) {
            this.rebuildPath(targetWorld);
        }

        const waypoint = this.getCurrentWaypoint();
        if (!waypoint) {
            return null;
        }

        const selfWorld = this.getNodeWorldPosition(this.node);
        const waypointWorld = waypoint.getWorldPosition();
        const delta = waypointWorld.sub(selfWorld);

        if (delta.mag() <= this.waypointReachDistance) {
            this.tryUsePortal(waypoint);
            this.pathIndex++;
            return this.getSteeringDirection(targetWorld, 0);
        }

        return delta;
    }

    public clearPath(): void {
        this.path = [];
        this.pathIndex = 0;
        this.repathTimer = 0;
        this.lastTargetWorld = null;
    }

    private rebuildPath(targetWorld: cc.Vec2): void {
        const graph = this.pathGraph || PathGraph.instance;
        if (!graph) {
            this.clearPath();
            return;
        }

        this.path = graph.findPath(this.getNodeWorldPosition(this.node), targetWorld);
        this.pathIndex = 0;
        this.repathTimer = this.repathInterval;
        this.lastTargetWorld = targetWorld.clone();

        if (this.debugLog) {
            cc.log(`[NPCPathAgent] path length=${this.path.length}.`);
        }
    }

    private getCurrentWaypoint(): PathNode {
        while (this.pathIndex < this.path.length) {
            const waypoint = this.path[this.pathIndex];
            if (waypoint && cc.isValid(waypoint.node)) {
                return waypoint;
            }
            this.pathIndex++;
        }
        return null;
    }

    private tryUsePortal(waypoint: PathNode): void {
        if (!waypoint || !waypoint.portal) {
            return;
        }

        const distance = waypoint.getWorldPosition().sub(this.getNodeWorldPosition(this.node)).mag();
        if (distance > Math.max(this.portalUseDistance, waypoint.usePortalDistance)) {
            return;
        }

        waypoint.portal.teleportActor(this.node);
    }

    private hasTargetMoved(targetWorld: cc.Vec2): boolean {
        return !this.lastTargetWorld || this.lastTargetWorld.sub(targetWorld).magSqr() > 48 * 48;
    }

    private getNodeWorldPosition(node: cc.Node): cc.Vec2 {
        return node.parent
            ? node.parent.convertToWorldSpaceAR(node.position)
            : cc.v2(node.x, node.y);
    }
}

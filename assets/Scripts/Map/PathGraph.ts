import PathNode from "./PathNode";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PathGraph extends cc.Component {
    public static instance: PathGraph = null;

    @property([PathNode])
    public pathNodes: PathNode[] = [];

    @property(cc.Boolean)
    public autoCollectChildren: boolean = true;

    @property(cc.Float)
    public maxStartDistance: number = 900;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    onLoad(): void {
        PathGraph.instance = this;
        this.refreshNodes();
    }

    onDestroy(): void {
        if (PathGraph.instance === this) {
            PathGraph.instance = null;
        }
    }

    public refreshNodes(): void {
        const collected = this.autoCollectChildren ? this.node.getComponentsInChildren(PathNode) : [];
        const merged: PathNode[] = [];

        for (const node of this.pathNodes || []) {
            if (node && merged.indexOf(node) < 0) {
                merged.push(node);
            }
        }

        for (const node of collected) {
            if (node && merged.indexOf(node) < 0) {
                merged.push(node);
            }
        }

        this.pathNodes = merged;
    }

    public findPath(startWorld: cc.Vec2, targetWorld: cc.Vec2): PathNode[] {
        this.refreshNodes();
        if (!this.pathNodes || this.pathNodes.length <= 0) {
            return [];
        }

        const startNode = this.findNearestNode(startWorld);
        const targetNode = this.findNearestNode(targetWorld);
        if (!startNode || !targetNode) {
            return [];
        }

        const startDistance = startNode.getWorldPosition().sub(startWorld).mag();
        const targetDistance = targetNode.getWorldPosition().sub(targetWorld).mag();
        if (startDistance > this.maxStartDistance || targetDistance > this.maxStartDistance) {
            return [];
        }

        if (startNode === targetNode) {
            return [targetNode];
        }

        return this.aStar(startNode, targetNode);
    }

    public getNeighbors(node: PathNode): PathNode[] {
        if (!node) {
            return [];
        }

        const result: PathNode[] = [];
        for (const neighbor of node.neighbors || []) {
            if (neighbor && cc.isValid(neighbor.node) && result.indexOf(neighbor) < 0) {
                result.push(neighbor);
            }
        }

        const portalLinkedNode = node.getLinkedPortalNode();
        if (portalLinkedNode && result.indexOf(portalLinkedNode) < 0) {
            result.push(portalLinkedNode);
        }

        return result;
    }

    private findNearestNode(worldPosition: cc.Vec2): PathNode {
        let bestNode: PathNode = null;
        let bestDistance = Number.MAX_VALUE;
        for (const pathNode of this.pathNodes || []) {
            if (!pathNode || !cc.isValid(pathNode.node)) {
                continue;
            }

            const distance = pathNode.getWorldPosition().sub(worldPosition).magSqr();
            if (distance < bestDistance) {
                bestDistance = distance;
                bestNode = pathNode;
            }
        }
        return bestNode;
    }

    private aStar(startNode: PathNode, targetNode: PathNode): PathNode[] {
        const openSet: PathNode[] = [startNode];
        const cameFrom: { [uuid: string]: PathNode } = {};
        const gScore: { [uuid: string]: number } = {};
        const fScore: { [uuid: string]: number } = {};

        gScore[startNode.node.uuid] = 0;
        fScore[startNode.node.uuid] = this.heuristic(startNode, targetNode);

        while (openSet.length > 0) {
            const current = this.popLowestScore(openSet, fScore);
            if (current === targetNode) {
                return this.reconstructPath(cameFrom, current);
            }

            for (const neighbor of this.getNeighbors(current)) {
                const currentScore = gScore[current.node.uuid] || 0;
                const tentativeScore = currentScore + this.distance(current, neighbor);
                const neighborScore = gScore[neighbor.node.uuid];
                if (neighborScore !== undefined && tentativeScore >= neighborScore) {
                    continue;
                }

                cameFrom[neighbor.node.uuid] = current;
                gScore[neighbor.node.uuid] = tentativeScore;
                fScore[neighbor.node.uuid] = tentativeScore + this.heuristic(neighbor, targetNode);
                if (openSet.indexOf(neighbor) < 0) {
                    openSet.push(neighbor);
                }
            }
        }

        if (this.debugLog) {
            cc.log("[PathGraph] no path found.");
        }
        return [];
    }

    private popLowestScore(openSet: PathNode[], fScore: { [uuid: string]: number }): PathNode {
        let bestIndex = 0;
        let bestScore = Number.MAX_VALUE;
        for (let index = 0; index < openSet.length; index++) {
            const score = fScore[openSet[index].node.uuid] || Number.MAX_VALUE;
            if (score < bestScore) {
                bestScore = score;
                bestIndex = index;
            }
        }
        return openSet.splice(bestIndex, 1)[0];
    }

    private reconstructPath(cameFrom: { [uuid: string]: PathNode }, current: PathNode): PathNode[] {
        const result = [current];
        while (cameFrom[current.node.uuid]) {
            current = cameFrom[current.node.uuid];
            result.unshift(current);
        }
        return result;
    }

    private heuristic(a: PathNode, b: PathNode): number {
        return this.distance(a, b);
    }

    private distance(a: PathNode, b: PathNode): number {
        return a.getWorldPosition().sub(b.getWorldPosition()).mag();
    }
}

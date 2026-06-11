import Portal from "./Portal";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PathNode extends cc.Component {
    @property
    public nodeId: string = "";

    @property([PathNode])
    public neighbors: PathNode[] = [];

    @property(Portal)
    public portal: Portal = null;

    @property(cc.Float)
    public usePortalDistance: number = 36;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    public getWorldPosition(): cc.Vec2 {
        return this.node.parent
            ? this.node.parent.convertToWorldSpaceAR(this.node.position)
            : cc.v2(this.node.x, this.node.y);
    }

    public getLinkedPortalNode(): PathNode {
        if (!this.portal) {
            return null;
        }

        const linkedPortal = this.portal.getLinkedPortal();
        if (!linkedPortal || !cc.isValid(linkedPortal.node)) {
            return null;
        }

        return linkedPortal.node.getComponent(PathNode);
    }
}

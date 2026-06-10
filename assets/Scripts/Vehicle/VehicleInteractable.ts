const { ccclass, property } = cc._decorator;

@ccclass
export default class VehicleInteractable extends cc.Component {
    @property(cc.Float)
    public interactionDistance: number = 120;

    @property
    public promptText: string = "Press F to Ride";

    @property(cc.Boolean)
    public interactable: boolean = true;

    public canInteract(playerNode: cc.Node): boolean {
        if (!this.interactable || !playerNode || !cc.isValid(playerNode)) {
            return false;
        }

        return this.getDistanceTo(playerNode) <= this.interactionDistance;
    }

    public getVehicleController(): any {
        const components = this.getComponents(cc.Component);
        for (const component of components) {
            const anyComponent = component as any;
            if (anyComponent && typeof anyComponent.tryMount === "function" && typeof anyComponent.isMounted === "function") {
                return anyComponent;
            }
        }
        return null;
    }

    private getDistanceTo(node: cc.Node): number {
        const selfWorld = this.node.parent
            ? this.node.parent.convertToWorldSpaceAR(this.node.position)
            : cc.v2(this.node.x, this.node.y);
        const otherWorld = node.parent
            ? node.parent.convertToWorldSpaceAR(node.position)
            : cc.v2(node.x, node.y);
        return selfWorld.sub(otherWorld).mag();
    }
}

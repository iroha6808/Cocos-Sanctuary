import EventCenter from "../Core/EventCenter";
import { GameEvent } from "../Core/Constants";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Portal extends cc.Component {
    private static portalsByPairId: { [pairId: string]: Portal[] } = {};
    private static lastUseAtByActor: { [actorUuid: string]: number } = {};

    @property
    public pairId: string = "A";

    @property(cc.Vec2)
    public exitOffset: cc.Vec2 = cc.v2(0, 16);

    @property(cc.Float)
    public cooldown: number = 0.35;

    @property(cc.Boolean)
    public affectPlayer: boolean = true;

    @property(cc.Boolean)
    public affectNpc: boolean = true;

    @property(cc.Boolean)
    public preserveVelocity: boolean = true;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    onEnable(): void {
        this.registerPortal();
    }

    onDisable(): void {
        this.unregisterPortal();
    }

    onDestroy(): void {
        this.unregisterPortal();
    }

    public getExitWorldPosition(): cc.Vec2 {
        const ownWorld = this.getNodeWorldPosition(this.node);
        return ownWorld.add(this.exitOffset || cc.v2(0, 0));
    }

    public getLinkedPortal(): Portal {
        const portals = Portal.portalsByPairId[this.pairId] || [];
        for (const portal of portals) {
            if (portal && portal !== this && cc.isValid(portal.node)) {
                return portal;
            }
        }
        return null;
    }

    public canTeleportActor(actorNode: cc.Node): boolean {
        if (!actorNode || !cc.isValid(actorNode)) {
            return false;
        }

        const now = Date.now();
        const lastUseAt = Portal.lastUseAtByActor[actorNode.uuid] || 0;
        return now - lastUseAt >= this.cooldown * 1000;
    }

    public teleportActor(actorNode: cc.Node): boolean {
        if (!actorNode || !cc.isValid(actorNode) || !this.canTeleportActor(actorNode)) {
            return false;
        }

        const linkedPortal = this.getLinkedPortal();
        if (!linkedPortal) {
            if (this.debugLog) {
                cc.warn(`[Portal] ${this.node.name} has no linked portal for pairId=${this.pairId}.`);
            }
            return false;
        }

        const parent = actorNode.parent;
        if (!parent) {
            return false;
        }

        const rb = actorNode.getComponent(cc.RigidBody);
        const previousVelocity = rb ? rb.linearVelocity.clone() : null;
        const exitWorld = linkedPortal.getExitWorldPosition();
        actorNode.setPosition(parent.convertToNodeSpaceAR(exitWorld));

        if (rb) {
            rb.linearVelocity = this.preserveVelocity && previousVelocity ? previousVelocity : cc.v2(0, 0);
            rb.awake = true;
        }

        const now = Date.now();
        const cooldownMs = Math.max(this.cooldown, linkedPortal.cooldown) * 1000;
        Portal.lastUseAtByActor[actorNode.uuid] = now;
        Portal.lastUseAtByActor[linkedPortal.node.uuid + ":" + actorNode.uuid] = now + cooldownMs;

        EventCenter.emit(GameEvent.PORTAL_USED, {
            actorNode,
            fromPortal: this.node,
            toPortal: linkedPortal.node,
            pairId: this.pairId,
            worldPosition: exitWorld
        });

        if (this.debugLog) {
            cc.log(`[Portal] ${actorNode.name} used pairId=${this.pairId}.`);
        }
        return true;
    }

    onBeginContact(
        contact: cc.PhysicsContact,
        selfCollider: cc.PhysicsCollider,
        otherCollider: cc.PhysicsCollider
    ): void {
        if (!otherCollider || !otherCollider.node) {
            return;
        }

        const actorNode = this.resolveActorNode(otherCollider.node);
        if (!actorNode) {
            return;
        }

        this.teleportActor(actorNode);
    }

    private resolveActorNode(startNode: cc.Node): cc.Node {
        let current = startNode;
        while (current) {
            if (this.affectPlayer && current.getComponent("PlayerController")) {
                return current;
            }
            if (this.affectNpc && current.getComponent("NPC_AI")) {
                return current;
            }
            current = current.parent;
        }
        return null;
    }

    private registerPortal(): void {
        if (!this.pairId) {
            return;
        }
        const portals = Portal.portalsByPairId[this.pairId] || [];
        if (portals.indexOf(this) < 0) {
            portals.push(this);
        }
        Portal.portalsByPairId[this.pairId] = portals;
    }

    private unregisterPortal(): void {
        if (!this.pairId || !Portal.portalsByPairId[this.pairId]) {
            return;
        }

        Portal.portalsByPairId[this.pairId] = Portal.portalsByPairId[this.pairId].filter(portal => portal !== this);
        if (Portal.portalsByPairId[this.pairId].length <= 0) {
            delete Portal.portalsByPairId[this.pairId];
        }
    }

    private getNodeWorldPosition(node: cc.Node): cc.Vec2 {
        return node.parent
            ? node.parent.convertToWorldSpaceAR(node.position)
            : cc.v2(node.x, node.y);
    }
}

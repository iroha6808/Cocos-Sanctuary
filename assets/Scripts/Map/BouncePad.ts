import EventCenter from "../Core/EventCenter";
import { GameEvent } from "../Core/Constants";

const { ccclass, property } = cc._decorator;

export enum BounceDirectionMode {
    LOCAL_UP = 0,
    LOCAL_RIGHT = 1
}

cc.Enum(BounceDirectionMode);

@ccclass
export default class BouncePad extends cc.Component {
    @property(cc.Float)
    public bounceSpeed: number = 720;

    @property({ type: cc.Enum(BounceDirectionMode) })
    public directionMode: BounceDirectionMode = BounceDirectionMode.LOCAL_UP;

    @property(cc.Boolean)
    public preserveTangentialVelocity: boolean = true;

    @property({ type: cc.Float, range: [0, 1, 0.05], slide: true })
    public tangentialVelocityScale: number = 0.35;

    @property(cc.Boolean)
    public affectPlayer: boolean = true;

    @property(cc.Boolean)
    public affectNpc: boolean = true;

    @property(cc.Float)
    public cooldown: number = 0.12;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    private lastBounceAtByActor: { [uuid: string]: number } = {};

    onBeginContact(
        contact: cc.PhysicsContact,
        selfCollider: cc.PhysicsCollider,
        otherCollider: cc.PhysicsCollider
    ): void {
        if (!otherCollider || !otherCollider.node) {
            return;
        }

        const actorNode = this.resolveActorNode(otherCollider.node);
        if (!actorNode || !this.canBounce(actorNode)) {
            return;
        }

        this.bounce(actorNode);
    }

    private bounce(actorNode: cc.Node): void {
        const rb = actorNode.getComponent(cc.RigidBody);
        if (!rb) {
            return;
        }

        const direction = this.getBounceDirection();
        const currentVelocity = rb.linearVelocity || cc.v2(0, 0);
        let nextVelocity = direction.mul(this.bounceSpeed);

        if (this.preserveTangentialVelocity) {
            const tangent = cc.v2(-direction.y, direction.x);
            const tangentSpeed = currentVelocity.dot(tangent) * this.tangentialVelocityScale;
            nextVelocity = nextVelocity.add(tangent.mul(tangentSpeed));
        }

        rb.linearVelocity = nextVelocity;
        rb.awake = true;
        this.lastBounceAtByActor[actorNode.uuid] = Date.now();

        EventCenter.emit(GameEvent.BOUNCE_PAD_TRIGGERED, {
            actorNode,
            padNode: this.node,
            direction,
            velocity: nextVelocity
        });

        if (this.debugLog) {
            cc.log(`[BouncePad] ${actorNode.name} velocity=(${nextVelocity.x.toFixed(1)}, ${nextVelocity.y.toFixed(1)}).`);
        }
    }

    private getBounceDirection(): cc.Vec2 {
        const origin = this.node.convertToWorldSpaceAR(cc.v2(0, 0));
        const localPoint = this.directionMode === BounceDirectionMode.LOCAL_RIGHT
            ? cc.v2(1, 0)
            : cc.v2(0, 1);
        const worldPoint = this.node.convertToWorldSpaceAR(localPoint);
        const direction = worldPoint.sub(origin);

        if (direction.magSqr() <= 0.0001) {
            return cc.v2(0, 1);
        }
        return direction.normalize();
    }

    private canBounce(actorNode: cc.Node): boolean {
        const lastBounceAt = this.lastBounceAtByActor[actorNode.uuid] || 0;
        return Date.now() - lastBounceAt >= this.cooldown * 1000;
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
}

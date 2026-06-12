import {
    describePhysicsTag,
    PhysicsTag,
    shouldDisablePhysicalContact
} from "./PhysicsTags";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PhysicsContactFilter extends cc.Component {

    @property(cc.Boolean)
    public debugLog: boolean = false;

    private loggedPairs: { [key: string]: boolean } = {};

    public static ensureForNode(
        node: cc.Node,
        tag: PhysicsTag,
        debugLog: boolean = false
    ): PhysicsContactFilter {
        if (!node || !cc.isValid(node)) {
            return null;
        }

        const colliders = node.getComponents(cc.PhysicsCollider);
        for (const collider of colliders) {
            if (!collider) {
                continue;
            }
            collider.tag = tag;
            if (collider.enabled) {
                collider.apply();
            }
        }

        const body = node.getComponent(cc.RigidBody);
        if (body) {
            body.enabledContactListener = true;
        }

        let filter = node.getComponent(PhysicsContactFilter);
        if (!filter) {
            filter = node.addComponent(PhysicsContactFilter);
        }
        filter.debugLog = filter.debugLog || debugLog;
        return filter;
    }

    onLoad(): void {
        const body = this.getComponent(cc.RigidBody);
        if (body) {
            body.enabledContactListener = true;
        }
    }

    onPreSolve(
        contact: cc.PhysicsContact,
        selfCollider: cc.PhysicsCollider,
        otherCollider: cc.PhysicsCollider
    ): void {
        if (!contact || !selfCollider || !otherCollider) {
            return;
        }

        if (!shouldDisablePhysicalContact(selfCollider.tag, otherCollider.tag)) {
            return;
        }

        (contact as any).setEnabled(false);
        this.logIgnoredPair(selfCollider.tag, otherCollider.tag);
    }

    private logIgnoredPair(tagA: number, tagB: number): void {
        if (!this.debugLog) {
            return;
        }

        const low = Math.min(tagA, tagB);
        const high = Math.max(tagA, tagB);
        const key = `${low}:${high}`;
        if (this.loggedPairs[key]) {
            return;
        }

        this.loggedPairs[key] = true;
        cc.log(
            `[PhysicsContactFilter] ignored ${describePhysicsTag(tagA)} <-> ` +
            `${describePhysicsTag(tagB)}`
        );
    }
}

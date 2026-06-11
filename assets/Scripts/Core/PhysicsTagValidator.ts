import CombatHitbox from "../Attack/CombatHitbox";
import CombatProjectile from "../Attack/CombatProjectile";
import DropItem from "../Entity/Resources/DropItem";
import NPC_AI from "../NPC/NPC_AI";
import PlayerController from "../Player/PlayerController";
import PhysicsContactFilter from "./PhysicsContactFilter";
import { describePhysicsTag, PhysicsTag } from "./PhysicsTags";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PhysicsTagValidator extends cc.Component {

    @property(cc.Boolean)
    public autoCorrect: boolean = true;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    @property(cc.Float)
    public scanInterval: number = 1;

    private knownAssignments: { [uuid: string]: number } = {};

    public static getOrCreate(host: cc.Node): PhysicsTagValidator {
        if (!host || !cc.isValid(host)) {
            return null;
        }

        return host.getComponent(PhysicsTagValidator) ||
            host.addComponent(PhysicsTagValidator);
    }

    onLoad(): void {
        this.validateNow();
        this.schedule(this.validateNow, Math.max(0.25, this.scanInterval));
    }

    onDestroy(): void {
        this.unschedule(this.validateNow);
    }

    public validateNow(): void {
        const scene = cc.director.getScene();
        if (!scene) {
            return;
        }

        for (const child of scene.children) {
            this.scanNode(child);
        }
    }

    private scanNode(node: cc.Node): void {
        if (!node || !cc.isValid(node)) {
            return;
        }

        const expectedTag = this.resolveExpectedTag(node);
        if (expectedTag !== PhysicsTag.DEFAULT) {
            this.validateNode(node, expectedTag);
        }

        const children = node.children.slice();
        for (const child of children) {
            this.scanNode(child);
        }
    }

    private resolveExpectedTag(node: cc.Node): PhysicsTag {
        if (node.getComponent(CombatHitbox)) {
            return PhysicsTag.ATTACK_HITBOX;
        }
        if (node.getComponent(CombatProjectile)) {
            return PhysicsTag.PROJECTILE;
        }
        if (node.getComponent(DropItem)) {
            return PhysicsTag.DROP_ITEM;
        }
        if (node.getComponent(PlayerController)) {
            return PhysicsTag.PLAYER_BODY;
        }
        if (node.getComponent(NPC_AI)) {
            return PhysicsTag.NPC_BODY;
        }

        const colliders = node.getComponents(cc.PhysicsCollider);
        if (colliders.length <= 0) {
            return PhysicsTag.DEFAULT;
        }

        if (colliders.some((collider) => collider.sensor)) {
            return PhysicsTag.TRIGGER;
        }

        const body = node.getComponent(cc.RigidBody);
        if ((body && body.type === cc.RigidBodyType.Static) || this.looksLikeTerrain(node.name)) {
            return PhysicsTag.TERRAIN;
        }

        return PhysicsTag.DEFAULT;
    }

    private validateNode(node: cc.Node, expectedTag: PhysicsTag): void {
        const colliders = node.getComponents(cc.PhysicsCollider);
        if (colliders.length <= 0) {
            return;
        }

        let needsCorrection = false;
        for (const collider of colliders) {
            if (collider.tag !== expectedTag) {
                needsCorrection = true;
                if (this.debugLog) {
                    cc.warn(
                        `[PhysicsTagValidator] ${node.name} expected ` +
                        `${describePhysicsTag(expectedTag)}, actual=${collider.tag}`
                    );
                }
            }
        }

        const body = node.getComponent(cc.RigidBody);
        if (body && !body.enabledContactListener) {
            needsCorrection = true;
            if (this.debugLog) {
                cc.warn(`[PhysicsTagValidator] ${node.name} contact listener was disabled.`);
            }
        }

        if (this.autoCorrect && needsCorrection) {
            PhysicsContactFilter.ensureForNode(node, expectedTag, this.debugLog);
        } else if (this.autoCorrect && !node.getComponent(PhysicsContactFilter)) {
            PhysicsContactFilter.ensureForNode(node, expectedTag, this.debugLog);
        }

        if (this.debugLog && this.knownAssignments[node.uuid] !== expectedTag) {
            this.knownAssignments[node.uuid] = expectedTag;
            cc.log(`[PhysicsTagValidator] ${node.name} => ${describePhysicsTag(expectedTag)}`);
        }
    }

    private looksLikeTerrain(nodeName: string): boolean {
        const normalized = (nodeName || "").toLowerCase();
        return normalized.indexOf("floor") >= 0 ||
            normalized.indexOf("ground") >= 0 ||
            normalized.indexOf("terrain") >= 0 ||
            normalized.indexOf("platform") >= 0 ||
            normalized.indexOf("rock") >= 0 ||
            normalized.indexOf("wall") >= 0;
    }
}

import GameManager from "../Core/GameManager";
import NPC_AI from "./NPC_AI";

const { ccclass, property } = cc._decorator;

@ccclass
export default class EnemyRespawner extends cc.Component {
    @property([cc.Prefab])
    public enemyPrefabs: cc.Prefab[] = [];

    @property(cc.Node)
    public playerNode: cc.Node = null;

    @property(cc.Node)
    public spawnParent: cc.Node = null;

    @property(cc.Float)
    public activationRange: number = 700;

    @property(cc.Float)
    public despawnRange: number = 1000;

    @property(cc.Float)
    public spawnRadius: number = 120;

    @property(cc.Float)
    public spawnCooldown: number = 3;

    @property(cc.Integer)
    public maxAlive: number = 3;

    @property(cc.Boolean)
    public despawnWhenFar: boolean = true;

    @property(cc.Boolean)
    public spawnOnEnterImmediately: boolean = true;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    private alive: cc.Node[] = [];
    private cooldownTimer: number = 0;
    private wasPlayerInRange: boolean = false;

    update(dt: number): void {
        if (GameManager.instance && GameManager.instance.isGamePaused()) {
            return;
        }

        this.cleanupAlive();
        const player = this.resolvePlayer();
        if (!player) {
            return;
        }

        const distance = this.getWorldPosition(player).sub(this.getWorldPosition(this.node)).mag();
        const inActivationRange = distance <= this.activationRange;
        if (!inActivationRange) {
            this.wasPlayerInRange = false;
            if (this.despawnWhenFar && distance >= this.despawnRange) {
                this.despawnAlive();
            }
            return;
        }

        if (!this.wasPlayerInRange && this.spawnOnEnterImmediately) {
            this.cooldownTimer = 0;
        }
        this.wasPlayerInRange = true;
        this.cooldownTimer -= dt;

        if (this.cooldownTimer <= 0 && this.alive.length < this.maxAlive) {
            this.spawnOne();
            this.cooldownTimer = this.spawnCooldown;
        }
    }

    public spawnOne(): cc.Node {
        const prefab = this.pickPrefab();
        const parent = this.spawnParent || this.node.parent;
        if (!prefab || !parent) {
            return null;
        }

        const node = cc.instantiate(prefab);
        node.parent = parent;
        const offset = this.randomOffset();
        const spawnWorld = this.getWorldPosition(this.node).add(offset);
        node.setPosition(parent.convertToNodeSpaceAR(spawnWorld));
        const ai = node.getComponent(NPC_AI);
        const player = this.resolvePlayer();
        if (ai && player) {
            ai.setTarget(player);
        }
        this.alive.push(node);
        return node;
    }

    private pickPrefab(): cc.Prefab {
        const prefabs = (this.enemyPrefabs || []).filter(prefab => !!prefab);
        if (prefabs.length <= 0) {
            return null;
        }
        return prefabs[Math.floor(Math.random() * prefabs.length)];
    }

    private cleanupAlive(): void {
        this.alive = this.alive.filter(node => !!node && cc.isValid(node));
    }

    private despawnAlive(): void {
        for (const node of this.alive) {
            if (node && cc.isValid(node)) {
                node.destroy();
            }
        }
        this.alive = [];
    }

    private randomOffset(): cc.Vec2 {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.spawnRadius;
        return cc.v2(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }

    private resolvePlayer(): cc.Node {
        if (this.playerNode && cc.isValid(this.playerNode)) {
            return this.playerNode;
        }
        if (GameManager.instance && GameManager.instance.playerNode && cc.isValid(GameManager.instance.playerNode)) {
            this.playerNode = GameManager.instance.playerNode;
            return this.playerNode;
        }
        return null;
    }

    private getWorldPosition(node: cc.Node): cc.Vec2 {
        return node.parent
            ? node.parent.convertToWorldSpaceAR(node.position)
            : cc.v2(node.x, node.y);
    }
}

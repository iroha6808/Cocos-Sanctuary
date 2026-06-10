import CombatProjectile from "./CombatProjectile";
import { CombatFaction } from "./CombatHitbox";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ProjectilePoolManager extends cc.Component {
    @property(cc.Prefab)
    public projectilePrefab: cc.Prefab = null;

    @property(cc.Node)
    public projectileParent: cc.Node = null;

    @property(cc.Integer)
    public prewarmCount: number = 8;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    private pool: cc.NodePool = null;
    private hasPrewarmed: boolean = false;

    onLoad(): void {
        this.pool = new cc.NodePool();
    }

    start(): void {
        this.prewarm();
    }

    onDestroy(): void {
        if (this.pool) {
            this.pool.clear();
        }
    }

    public configure(projectilePrefab: cc.Prefab, projectileParent?: cc.Node): void {
        if (projectilePrefab) {
            this.projectilePrefab = projectilePrefab;
        }
        if (projectileParent) {
            this.projectileParent = projectileParent;
        }
        this.prewarm();
    }

    public spawn(
        ownerNode: cc.Node,
        ownerFaction: CombatFaction,
        spawnWorldPosition: cc.Vec2,
        velocity: cc.Vec2,
        damage: number,
        knockbackX: number,
        knockbackY: number
    ): CombatProjectile {
        if (!this.projectilePrefab) {
            cc.warn("[ProjectilePoolManager] projectilePrefab is not assigned.");
            return null;
        }

        const parent = this.resolveParent(ownerNode);
        if (!parent) {
            cc.warn("[ProjectilePoolManager] Cannot resolve projectile parent.");
            return null;
        }

        this.prewarm();
        const projectileNode = this.pool && this.pool.size() > 0
            ? this.pool.get()
            : cc.instantiate(this.projectilePrefab);

        projectileNode.parent = parent;
        projectileNode.active = true;
        projectileNode.setPosition(parent.convertToNodeSpaceAR(spawnWorldPosition));

        const projectile = projectileNode.getComponent(CombatProjectile);
        if (!projectile) {
            cc.warn("[ProjectilePoolManager] projectile prefab requires CombatProjectile.");
            projectileNode.destroy();
            return null;
        }

        projectile.setPoolReturnHandler(this.recycleProjectile, this);
        const launched = projectile.launch(ownerNode, ownerFaction, velocity, damage, knockbackX, knockbackY);
        if (!launched) {
            this.recycleProjectile(projectileNode);
            return null;
        }
        return projectile;
    }

    public recycleProjectile = (projectileNode: cc.Node): void => {
        if (!projectileNode || !cc.isValid(projectileNode)) {
            return;
        }

        const projectile = projectileNode.getComponent(CombatProjectile);
        if (projectile) {
            projectile.prepareForPool();
        }

        projectileNode.active = false;
        if (this.pool) {
            this.pool.put(projectileNode);
        } else {
            projectileNode.destroy();
        }

        if (this.debugLog) {
            cc.log(`[ProjectilePoolManager] recycled ${projectileNode.name}, pool=${this.pool ? this.pool.size() : 0}.`);
        }
    };

    private prewarm(): void {
        if (this.hasPrewarmed || !this.pool || !this.projectilePrefab) {
            return;
        }

        const count = Math.max(0, this.prewarmCount || 0);
        for (let index = 0; index < count; index++) {
            const node = cc.instantiate(this.projectilePrefab);
            node.active = false;
            this.pool.put(node);
        }
        this.hasPrewarmed = true;
    }

    private resolveParent(ownerNode: cc.Node): cc.Node {
        if (this.projectileParent && cc.isValid(this.projectileParent)) {
            return this.projectileParent;
        }
        return ownerNode && ownerNode.parent ? ownerNode.parent : this.node.parent;
    }
}

import MerchantNPC from "./MerchantNPC";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MerchantSpawner extends cc.Component {

    @property(cc.Prefab)
    public merchantPrefab: cc.Prefab = null;

    @property(cc.Node)
    public playerNode: cc.Node = null;

    @property(cc.Node)
    public spawnParent: cc.Node = null;

    @property(cc.Float)
    public minSpawnDistance: number = 50;

    @property(cc.Float)
    public maxSpawnDistance: number = 300;

    @property(cc.Float)
    public spawnInterval: number = 20;

    @property(cc.Boolean)
    public spawnOnStart: boolean = false;

    @property(cc.Boolean)
    public debugLog: boolean = true;

    private currentMerchant: cc.Node = null;

    start() {
        this.resolveReferences();

        if (this.spawnOnStart) {
            this.spawnMerchant();
        }

        if (this.spawnInterval > 0) {
            this.schedule(this.spawnMerchant, this.spawnInterval);
        }
    }

    onDestroy() {
        this.unschedule(this.spawnMerchant);
    }

    public spawnMerchant(): cc.Node {
        this.resolveReferences();

        if (this.currentMerchant && cc.isValid(this.currentMerchant)) {
            return this.currentMerchant;
        }

        const existingMerchant = this.findExistingMerchant();
        if (existingMerchant) {
            this.currentMerchant = existingMerchant.node;
            this.log(`reuse existing merchant: ${existingMerchant.node.name}`);
            return this.currentMerchant;
        }

        if (!this.merchantPrefab) {
            cc.warn("[MerchantSpawner] merchantPrefab is not assigned.");
            return null;
        }

        if (!this.spawnParent) {
            cc.warn("[MerchantSpawner] spawnParent is not assigned.");
            return null;
        }

        const merchantNode = cc.instantiate(this.merchantPrefab);
        merchantNode.parent = this.spawnParent;
        merchantNode.setPosition(this.getRandomSpawnPositionNearPlayer());

        this.currentMerchant = merchantNode;
        this.log(`spawned ${merchantNode.name} at (${merchantNode.x.toFixed(1)}, ${merchantNode.y.toFixed(1)})`);
        return merchantNode;
    }

    public despawnMerchant(): void {
        const merchantNode = this.currentMerchant && cc.isValid(this.currentMerchant)
            ? this.currentMerchant
            : this.findExistingMerchantNode();

        if (!merchantNode) {
            return;
        }

        const merchant = merchantNode.getComponent(MerchantNPC);
        if (merchant) {
            merchant.leave();
        } else {
            merchantNode.destroy();
        }

        this.currentMerchant = null;
        this.log("despawned merchant.");
    }

    public getRandomSpawnPositionNearPlayer(): cc.Vec2 {
        this.resolveReferences();

        const parentNode = this.spawnParent || this.node;
        const playerWorldPos = this.getWorldPosition(this.playerNode || this.node);
        const minDistance = Math.max(0, Math.min(this.minSpawnDistance, this.maxSpawnDistance));
        const maxDistance = Math.max(minDistance, Math.max(this.minSpawnDistance, this.maxSpawnDistance));
        const direction = Math.random() < 0.5 ? -1 : 1;
        const distance = minDistance + Math.random() * (maxDistance - minDistance);
        const spawnWorldPos = cc.v2(playerWorldPos.x + direction * distance, playerWorldPos.y);

        return parentNode.convertToNodeSpaceAR(spawnWorldPos);
    }

    private resolveReferences(): void {
        if (!this.playerNode) {
            this.playerNode = cc.find("Canvas/Player");
        }

        if (!this.spawnParent) {
            this.spawnParent = cc.find("Canvas/NPC") || cc.find("Canvas/World Root") || cc.find("Canvas");
        }
    }

    private findExistingMerchant(): MerchantNPC {
        const root = this.spawnParent || cc.find("Canvas");
        return this.findMerchantInChildren(root);
    }

    private findExistingMerchantNode(): cc.Node {
        const merchant = this.findExistingMerchant();
        return merchant ? merchant.node : null;
    }

    private findMerchantInChildren(root: cc.Node): MerchantNPC {
        if (!root) {
            return null;
        }

        const merchant = root.getComponent(MerchantNPC);
        if (merchant && merchant.getState && merchant.node !== this.currentMerchant) {
            return merchant;
        }

        for (const child of root.children) {
            const result = this.findMerchantInChildren(child);
            if (result) {
                return result;
            }
        }

        return null;
    }

    private getWorldPosition(node: cc.Node): cc.Vec2 {
        if (!node) {
            return cc.v2(0, 0);
        }

        return node.parent
            ? node.parent.convertToWorldSpaceAR(node.position)
            : cc.v2(node.x, node.y);
    }

    private log(message: string): void {
        if (this.debugLog) {
            cc.log(`[MerchantSpawner] ${message}`);
        }
    }
}

import MerchantNPC from "./MerchantNPC";
import LandSpawnPositionResolver, {
    LandSpawnResult
} from "./LandSpawnPositionResolver";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MerchantSpawner extends cc.Component {

    @property(cc.Prefab)
    public merchantPrefab: cc.Prefab = null;

    @property(cc.Node)
    public playerNode: cc.Node = null;

    @property(cc.Node)
    public spawnParent: cc.Node = null;

    @property(LandSpawnPositionResolver)
    public positionResolver: LandSpawnPositionResolver = null;

    @property(cc.Float)
    public minSpawnDistance: number = 300;

    @property(cc.Float)
    public maxSpawnDistance: number = 700;

    @property(cc.Float)
    public spawnClearanceWidth: number = 64;

    @property(cc.Float)
    public spawnClearanceHeight: number = 96;

    @property(cc.Float)
    public spawnHeightOffset: number = 2;

    @property(cc.Integer)
    public maxPositionAttempts: number = 12;

    @property(cc.Boolean)
    public avoidCameraView: boolean = false;

    @property(cc.Float)
    public cameraPadding: number = 80;

    @property(cc.Float)
    public minimumNpcSpacing: number = 80;

    @property([cc.Integer])
    public groundGroupIndices: number[] = [0];

    @property(cc.Float)
    public spawnInterval: number = 120;

    @property(cc.Boolean)
    public spawnOnStart: boolean = true;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    @property(cc.Boolean)
    public debugDraw: boolean = false;

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

        const spawnPosition = this.findSpawnPositionNearPlayer();
        if (!spawnPosition) {
            this.log("spawn skipped: no valid land position.");
            return null;
        }

        const merchantNode = cc.instantiate(this.merchantPrefab);
        merchantNode.parent = this.spawnParent;
        merchantNode.setPosition(spawnPosition.localPosition);
        this.currentMerchant = merchantNode;
        this.log(
            `spawned ${merchantNode.name} on ${spawnPosition.groundNode.name} at ` +
            `(${spawnPosition.worldPosition.x.toFixed(1)}, ` +
            `${spawnPosition.worldPosition.y.toFixed(1)})`
        );
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
        const result = this.findSpawnPositionNearPlayer();
        return result ? result.localPosition : null;
    }

    public findSpawnPositionNearPlayer(): LandSpawnResult {
        this.resolveReferences();
        if (!this.positionResolver || !this.playerNode || !this.spawnParent) {
            return null;
        }

        this.positionResolver.spawnHeightOffset = this.spawnHeightOffset;
        this.positionResolver.maxPositionAttempts = this.maxPositionAttempts;
        this.positionResolver.groundGroupIndices = (this.groundGroupIndices || []).slice();
        this.positionResolver.debugLog = this.debugLog;
        this.positionResolver.debugDraw = this.debugDraw;

        return this.positionResolver.findLandPosition({
            playerNode: this.playerNode,
            spawnParent: this.spawnParent,
            minDistance: this.minSpawnDistance,
            maxDistance: this.maxSpawnDistance,
            clearanceWidth: this.spawnClearanceWidth,
            clearanceHeight: this.spawnClearanceHeight,
            occupiedWorldPositions: [],
            minimumSpacing: this.minimumNpcSpacing,
            avoidCameraView: this.avoidCameraView,
            cameraPadding: this.cameraPadding
        });
    }

    private resolveReferences(): void {
        if (!this.playerNode) {
            this.playerNode = cc.find("Canvas/Player");
        }

        if (!this.spawnParent) {
            this.spawnParent = cc.find("Canvas/NPC") || cc.find("Canvas/World Root") || cc.find("Canvas");
        }

        if (!this.positionResolver) {
            this.positionResolver = this.getComponent(LandSpawnPositionResolver)
                || this.addComponent(LandSpawnPositionResolver);
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

    private log(message: string): void {
        if (this.debugLog) {
            cc.log(`[MerchantSpawner] ${message}`);
        }
    }
}

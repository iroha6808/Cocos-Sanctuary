import { MonsterSpawnEntry } from "../Data/MonsterPool";
import LandSpawnPositionResolver, {
    LandSpawnResult
} from "./LandSpawnPositionResolver";

const { ccclass, property } = cc._decorator;

export interface MonsterSpawnPositionResult extends LandSpawnResult {}

@ccclass
export default class MonsterSpawnPositionResolver extends cc.Component {
    @property(cc.Float)
    public minSpawnDistance: number = 500;

    @property(cc.Float)
    public maxSpawnDistance: number = 900;

    @property(cc.Float)
    public raycastHeight: number = 500;

    @property(cc.Float)
    public raycastDepth: number = 1000;

    @property(cc.Float)
    public spawnHeightOffset: number = 2;

    @property(cc.Integer)
    public maxPositionAttempts: number = 12;

    @property(cc.Float)
    public minimumMonsterSpacing: number = 80;

    @property(cc.Boolean)
    public avoidCameraView: boolean = true;

    @property(cc.Float)
    public cameraPadding: number = 80;

    @property([cc.Integer])
    public groundGroupIndices: number[] = [0];

    @property(cc.Float)
    public supportProbeDepth: number = 28;

    @property(cc.Float)
    public supportInset: number = 4;

    @property(cc.Float)
    public maxSupportHeightDifference: number = 12;

    @property(cc.Boolean)
    public allowGroundGroupFallback: boolean = true;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    @property(cc.Boolean)
    public debugDraw: boolean = false;

    private landResolver: LandSpawnPositionResolver = null;

    public findSpawnPosition(
        playerNode: cc.Node,
        spawnParent: cc.Node,
        entry: MonsterSpawnEntry,
        occupiedWorldPositions: cc.Vec2[]
    ): MonsterSpawnPositionResult {
        if (!entry) {
            this.log("missing monster pool entry");
            return null;
        }

        const resolver = this.getLandResolver();
        if (!resolver) {
            this.log("missing LandSpawnPositionResolver");
            return null;
        }

        this.syncResolverSettings(resolver);
        return resolver.findLandPosition({
            playerNode,
            spawnParent,
            minDistance: this.minSpawnDistance,
            maxDistance: this.maxSpawnDistance,
            clearanceWidth: Math.max(8, entry.spawnClearanceWidth),
            clearanceHeight: Math.max(8, entry.spawnClearanceHeight),
            occupiedWorldPositions: occupiedWorldPositions || [],
            minimumSpacing: this.minimumMonsterSpacing,
            avoidCameraView: this.avoidCameraView,
            cameraPadding: this.cameraPadding
        });
    }

    public getLandResolver(): LandSpawnPositionResolver {
        if (!this.landResolver || !cc.isValid(this.landResolver)) {
            this.landResolver = this.getComponent(LandSpawnPositionResolver)
                || this.addComponent(LandSpawnPositionResolver);
        }
        return this.landResolver;
    }

    private syncResolverSettings(resolver: LandSpawnPositionResolver): void {
        resolver.raycastHeight = this.raycastHeight;
        resolver.raycastDepth = this.raycastDepth;
        resolver.spawnHeightOffset = this.spawnHeightOffset;
        resolver.maxPositionAttempts = this.maxPositionAttempts;
        resolver.groundGroupIndices = (this.groundGroupIndices || []).slice();
        resolver.supportProbeDepth = this.supportProbeDepth;
        resolver.supportInset = this.supportInset;
        resolver.maxSupportHeightDifference = this.maxSupportHeightDifference;
        resolver.allowGroundGroupFallback = this.allowGroundGroupFallback;
        resolver.debugLog = this.debugLog;
        resolver.debugDraw = this.debugDraw;
    }

    private log(message: string): void {
        if (this.debugLog) {
            cc.log(`[MonsterSpawnPositionResolver] ${message}`);
        }
    }
}

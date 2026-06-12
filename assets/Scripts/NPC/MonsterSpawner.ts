import {
    getEligibleMonsterEntries,
    MonsterAliveCounts,
    MonsterSpawnContext,
    MonsterSpawnEntry,
    pickWeightedMonsterEntry
} from "../Data/MonsterPool";
import { GameEvent } from "../Core/Constants";
import EventCenter from "../Core/EventCenter";
import NPC_AI from "./NPC_AI";
import MonsterSpawnPositionResolver from "./MonsterSpawnPositionResolver";
import SpawnedMonster from "./SpawnedMonster";

const { ccclass, property } = cc._decorator;

interface SpawnRecord {
    node: cc.Node;
    marker: SpawnedMonster;
    monsterId: string;
    spawnCost: number;
}

@ccclass
export default class MonsterSpawner extends cc.Component {
    private static readonly DEFAULT_MONSTERS = [
        {
            id: "slime",
            uuid: "5fc94d69-3068-45e8-9948-62a8a7113ceb",
            weight: 50,
            maxAlive: 4,
            spawnCost: 1,
            width: 48,
            height: 48
        },
        {
            id: "boar",
            uuid: "4d212252-f317-43dc-869b-176845549b7b",
            weight: 30,
            maxAlive: 3,
            spawnCost: 1,
            width: 64,
            height: 52
        },
        {
            id: "skeleton_mage",
            uuid: "d1a7c91c-ce7c-44d5-9c8a-52de8a941a74",
            weight: 20,
            maxAlive: 2,
            spawnCost: 2,
            width: 48,
            height: 80
        }
    ];

    @property(cc.Node)
    public playerNode: cc.Node = null;

    @property(cc.Node)
    public spawnParent: cc.Node = null;

    @property(MonsterSpawnPositionResolver)
    public positionResolver: MonsterSpawnPositionResolver = null;

    @property([MonsterSpawnEntry])
    public spawnEntries: MonsterSpawnEntry[] = [];

    @property(cc.Boolean)
    public autoLoadDefaultPool: boolean = true;

    @property(cc.Float)
    public spawnInterval: number = 4;

    @property(cc.Boolean)
    public spawnOnStart: boolean = true;

    @property(cc.Integer)
    public maxAliveTotal: number = 8;

    @property(cc.Integer)
    public maxSpawnBudget: number = 8;

    @property(cc.Float)
    public despawnDistance: number = 1400;

    @property(cc.Float)
    public cleanupInterval: number = 1;

    @property(cc.Boolean)
    public despawnWhenFar: boolean = true;

    @property(cc.Boolean)
    public debugLog: boolean = false;

    private records: SpawnRecord[] = [];
    private aliveCounts: MonsterAliveCounts = {};
    private usedBudget: number = 0;
    private spawnTimer: number = 0;
    private cleanupTimer: number = 0;
    private gameManager: any = null;
    private poolLoading: boolean = false;
    private poolReady: boolean = false;
    private playerDead: boolean = false;

    public static getOrCreate(host: cc.Node): MonsterSpawner {
        if (!host) {
            return null;
        }
        const resolver = host.getComponent(MonsterSpawnPositionResolver)
            || host.addComponent(MonsterSpawnPositionResolver);
        const spawner = host.getComponent(MonsterSpawner)
            || host.addComponent(MonsterSpawner);
        spawner.positionResolver = resolver;
        return spawner;
    }

    onLoad(): void {
        EventCenter.on(GameEvent.PLAYER_DIED, this.onPlayerDied, this);
    }

    start(): void {
        this.resolveReferences();
        this.spawnTimer = this.spawnOnStart ? 0 : Math.max(0.1, this.spawnInterval);
        this.cleanupTimer = Math.max(0.1, this.cleanupInterval);
        this.preparePool();
    }

    update(dt: number): void {
        if (this.gameManager && this.gameManager.isGamePaused()) {
            return;
        }

        this.resolveReferences();
        if (
            !this.poolReady
            || !this.playerNode
            || !this.spawnParent
            || !this.positionResolver
        ) {
            return;
        }

        this.cleanupTimer -= dt;
        if (this.cleanupTimer <= 0) {
            this.cleanupRecords();
            this.cleanupTimer = Math.max(0.1, this.cleanupInterval);
        }

        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.trySpawn();
            this.spawnTimer = Math.max(0.1, this.spawnInterval);
        }
    }

    onDestroy(): void {
        EventCenter.off(GameEvent.PLAYER_DIED, this.onPlayerDied, this);
        for (const record of this.records) {
            if (record.marker && cc.isValid(record.marker)) {
                record.marker.initialize(null, record.monsterId, record.spawnCost);
            }
        }
        this.records = [];
        this.aliveCounts = {};
        this.usedBudget = 0;
    }

    public trySpawn(): cc.Node {
        this.cleanupRecords();
        if (!this.canAttemptSpawn()) {
            return null;
        }

        const context = this.buildContext();
        const remainingBudget = Math.max(0, this.maxSpawnBudget - this.usedBudget);
        const eligible = getEligibleMonsterEntries(
            this.spawnEntries,
            context,
            this.aliveCounts,
            remainingBudget
        );
        const entry = pickWeightedMonsterEntry(eligible);
        if (!entry) {
            this.log("spawn skipped: no eligible monster entry");
            return null;
        }

        const occupiedPositions = this.records
            .filter(record => record.node && cc.isValid(record.node))
            .map(record => this.getWorldPosition(record.node));
        const position = this.positionResolver.findSpawnPosition(
            this.playerNode,
            this.spawnParent,
            entry,
            occupiedPositions
        );
        if (!position) {
            this.log(`spawn skipped: no valid position for ${entry.id}`);
            return null;
        }

        const monsterNode = cc.instantiate(entry.prefab);
        monsterNode.parent = this.spawnParent;
        monsterNode.setPosition(position.localPosition);

        const ai = monsterNode.getComponent(NPC_AI)
            || monsterNode.getComponentInChildren(NPC_AI);
        if (!ai) {
            cc.warn(`[MonsterSpawner] ${entry.id} prefab has no NPC_AI component.`);
            monsterNode.destroy();
            return null;
        }
        ai.setTarget(this.playerNode);

        const marker = monsterNode.getComponent(SpawnedMonster)
            || monsterNode.addComponent(SpawnedMonster);
        marker.initialize(this, entry.id, Math.max(0, entry.spawnCost));

        this.records.push({
            node: monsterNode,
            marker,
            monsterId: entry.id,
            spawnCost: Math.max(0, entry.spawnCost)
        });
        this.aliveCounts[entry.id] = (this.aliveCounts[entry.id] || 0) + 1;
        this.usedBudget += Math.max(0, entry.spawnCost);
        this.log(
            `spawned ${entry.id} at (${position.worldPosition.x.toFixed(1)}, `
            + `${position.worldPosition.y.toFixed(1)}), alive=${this.records.length}, `
            + `budget=${this.usedBudget}/${this.maxSpawnBudget}`
        );
        return monsterNode;
    }

    public releaseSpawnedMonster(marker: SpawnedMonster): void {
        const index = this.records.findIndex(record => record.marker === marker);
        if (index < 0) {
            return;
        }

        const record = this.records[index];
        this.records.splice(index, 1);
        this.aliveCounts[record.monsterId] = Math.max(
            0,
            (this.aliveCounts[record.monsterId] || 0) - 1
        );
        this.usedBudget = Math.max(0, this.usedBudget - record.spawnCost);
        this.log(
            `released ${record.monsterId}, alive=${this.records.length}, `
            + `budget=${this.usedBudget}/${this.maxSpawnBudget}`
        );
    }

    public getAliveCount(monsterId?: string): number {
        return monsterId
            ? (this.aliveCounts[monsterId] || 0)
            : this.records.length;
    }

    private canAttemptSpawn(): boolean {
        if (this.playerDead || !this.playerNode || !cc.isValid(this.playerNode)) {
            return false;
        }
        if (this.maxAliveTotal > 0 && this.records.length >= this.maxAliveTotal) {
            this.log("spawn skipped: global alive limit reached");
            return false;
        }
        if (this.maxSpawnBudget > 0 && this.usedBudget >= this.maxSpawnBudget) {
            this.log("spawn skipped: spawn budget exhausted");
            return false;
        }
        return true;
    }

    private onPlayerDied(): void {
        this.playerDead = true;
    }

    private cleanupRecords(): void {
        const playerWorld = this.playerNode && cc.isValid(this.playerNode)
            ? this.getWorldPosition(this.playerNode)
            : null;
        const snapshot = this.records.slice();

        for (const record of snapshot) {
            if (!record.node || !cc.isValid(record.node)) {
                this.releaseSpawnedMonster(record.marker);
                continue;
            }
            if (
                this.despawnWhenFar
                && playerWorld
                && this.getWorldPosition(record.node).sub(playerWorld).mag()
                    >= Math.max(0, this.despawnDistance)
            ) {
                this.log(`despawning distant ${record.monsterId}`);
                record.marker.despawn();
            }
        }
    }

    private resolveReferences(): void {
        if (!this.gameManager) {
            const coreControllers = cc.find("Canvas/Core Controllers");
            this.gameManager = coreControllers
                ? coreControllers.getComponent("GameManager")
                : null;
        }
        if (!this.playerNode || !cc.isValid(this.playerNode)) {
            this.playerNode = this.gameManager && this.gameManager.playerNode
                ? this.gameManager.playerNode
                : cc.find("Canvas/Player");
        }
        if (!this.spawnParent || !cc.isValid(this.spawnParent)) {
            const npcRoot = cc.find("Canvas/NPC") || cc.find("Canvas/World Root") || cc.find("Canvas");
            if (npcRoot) {
                this.spawnParent = npcRoot.getChildByName("Runtime Monsters");
                if (!this.spawnParent) {
                    this.spawnParent = new cc.Node("Runtime Monsters");
                    npcRoot.addChild(this.spawnParent);
                }
            }
        }
        if (!this.positionResolver) {
            this.positionResolver = this.getComponent(MonsterSpawnPositionResolver);
        }
    }

    private preparePool(): void {
        if (this.spawnEntries && this.spawnEntries.some(entry => !!entry && !!entry.prefab)) {
            this.poolReady = true;
            this.validateEntries();
            return;
        }
        if (!this.autoLoadDefaultPool) {
            this.poolReady = true;
            this.validateEntries();
            return;
        }
        if (this.poolLoading) {
            return;
        }

        this.poolLoading = true;
        let remaining = MonsterSpawner.DEFAULT_MONSTERS.length;
        const loadedEntries: MonsterSpawnEntry[] = [];

        for (const config of MonsterSpawner.DEFAULT_MONSTERS) {
            cc.assetManager.loadAny(config.uuid, (error: Error, asset: cc.Asset) => {
                if (error || !(asset instanceof cc.Prefab)) {
                    cc.warn(
                        `[MonsterSpawner] Cannot load default ${config.id} prefab: `
                        + `${error ? error.message : "asset is not a prefab"}`
                    );
                } else {
                    const entry = new MonsterSpawnEntry();
                    entry.id = config.id;
                    entry.prefab = asset as cc.Prefab;
                    entry.weight = config.weight;
                    entry.maxAlive = config.maxAlive;
                    entry.spawnCost = config.spawnCost;
                    entry.spawnClearanceWidth = config.width;
                    entry.spawnClearanceHeight = config.height;
                    loadedEntries.push(entry);
                }

                remaining--;
                if (remaining <= 0) {
                    this.spawnEntries = loadedEntries;
                    this.poolLoading = false;
                    this.poolReady = true;
                    this.validateEntries();
                    this.log(`default pool ready: ${loadedEntries.length} entries`);
                }
            });
        }
    }

    private buildContext(): MonsterSpawnContext {
        return {
            gameStage: 0,
            region: "",
            timeOfDay: "",
            weather: ""
        };
    }

    private validateEntries(): void {
        const ids: { [id: string]: boolean } = {};
        for (const entry of this.spawnEntries || []) {
            if (!entry || !entry.id) {
                continue;
            }
            if (ids[entry.id]) {
                cc.warn(`[MonsterSpawner] Duplicate monster id: ${entry.id}`);
            }
            ids[entry.id] = true;
        }
    }

    private getWorldPosition(node: cc.Node): cc.Vec2 {
        return node.parent
            ? node.parent.convertToWorldSpaceAR(cc.v2(node.x, node.y))
            : cc.v2(node.x, node.y);
    }

    private log(message: string): void {
        if (this.debugLog) {
            cc.log(`[MonsterSpawner] ${message}`);
        }
    }
}

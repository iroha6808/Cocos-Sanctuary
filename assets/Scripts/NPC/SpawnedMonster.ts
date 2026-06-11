const { ccclass } = cc._decorator;

@ccclass
export default class SpawnedMonster extends cc.Component {
    public monsterId: string = "";
    public spawnCost: number = 0;

    private owner: any = null;
    private released: boolean = false;
    private despawning: boolean = false;

    public initialize(owner: any, monsterId: string, spawnCost: number): void {
        this.owner = owner;
        this.monsterId = monsterId;
        this.spawnCost = Math.max(0, spawnCost);
        this.released = false;
        this.despawning = false;
    }

    public despawn(): void {
        if (this.despawning || !this.node || !cc.isValid(this.node)) {
            return;
        }
        this.despawning = true;
        this.release();
        this.node.destroy();
    }

    public isDespawning(): boolean {
        return this.despawning;
    }

    onDestroy(): void {
        this.release();
        this.owner = null;
    }

    private release(): void {
        if (this.released) {
            return;
        }
        this.released = true;
        if (this.owner && this.owner.releaseSpawnedMonster) {
            this.owner.releaseSpawnedMonster(this);
        }
    }
}


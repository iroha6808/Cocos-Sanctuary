const { ccclass, property } = cc._decorator;
import ResourceObject from '../ResourceObject';

@ccclass('DropEntry')
export class DropEntry {
    @property(cc.Prefab)
    prefab: cc.Prefab = null!;

    @property({ tooltip: '掉落權重（越高越容易掉）' })
    weight: number = 1;
}

@ccclass
export default class OreRock extends ResourceObject {

    @property({ type: [DropEntry], tooltip: '掉落表（可設多種，weight 控制機率）' })
    dropTable: DropEntry[] = [];

    @property({ tooltip: '是否移除岩石' })
    deplete: boolean = false;

    protected onDrop() {
        const pos = this.getWorldPos();

        for (let i = 0; i < this.dropAmount; i++) {
            const entry = this.pickRandom();
            if (!entry) continue;
            const offsetX = (Math.random() - 0.5) * 40;
            this.spawnPrefab(entry.prefab, pos.x + offsetX, pos.y + 40);
        }

        cc.log(`[OreRock] 掉落 ${this.dropAmount} 個礦石`);
        this.onDepleted();
    }

    protected onDepleted() {
        cc.log('[OreRock] 礦石耗盡，移除節點');
        if (this.deplete) this.node.destroy();
    }

    private pickRandom(): DropEntry | null {
        if (this.dropTable.length === 0) {
            cc.warn('[OreRock] dropTable 是空的');
            return null;
        }
        const total = this.dropTable.reduce((sum, e) => sum + e.weight, 0);
        let rand = Math.random() * total;
        for (const entry of this.dropTable) {
            rand -= entry.weight;
            if (rand <= 0) return entry;
        }
        return this.dropTable[this.dropTable.length - 1];
    }
}
const { ccclass, property } = cc._decorator;
import ResourceObject from '../ResourceObject';

@ccclass
export default class AppleTree extends ResourceObject {

    @property(cc.Prefab)
    applePrefab: cc.Prefab = null!;

    @property({ tooltip: '樹最多能容納幾顆蘋果' })
    maxApples: number = 10;

    @property({ tooltip: '每幾秒回復一顆蘋果' })
    regenInterval: number = 60;

    private currentApples: number = 0;
    private regenTimer: number = 0;

    onLoad() {
        super.onLoad();
        this.currentApples = this.maxApples;
        cc.log(`[AppleTree] 初始化，蘋果 ${this.currentApples}/${this.maxApples}`);
    }

    update(dt: number) {
        if (this.currentApples >= this.maxApples) return;

        this.regenTimer += dt;
        if (this.regenTimer >= this.regenInterval) {
            this.regenTimer = 0;
            this.currentApples++;
            cc.log(`[AppleTree] 蘋果回復，目前 ${this.currentApples}/${this.maxApples}`);
        }
    }

    protected canInteract(): boolean {
        if (this.currentApples <= 0) {
            cc.log('[AppleTree] 沒有蘋果，無法互動');
            return false;
        }
        return true;
    }

    protected onDrop() {
        if (this.currentApples <= 0) return;

        this.currentApples--;
        this.regenTimer = 0;

        const pos = this.getWorldPos();
        for (let i = 0; i < this.dropAmount; i++) {
            this.spawnPrefab(this.applePrefab, pos.x, pos.y + 80);
        }

        cc.log(`[AppleTree] 掉落蘋果 x${this.dropAmount}，剩餘 ${this.currentApples}/${this.maxApples}`);

        if (this.currentApples <= 0) this.onDepleted();
    }

    protected onDepleted() {
        cc.log('[AppleTree] 蘋果全部掉完，等待回復');
        this.changeToDepletedSprite(); // 父類的工具方法
    }
}
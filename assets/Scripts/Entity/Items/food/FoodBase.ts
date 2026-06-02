const { ccclass, property } = cc._decorator;

@ccclass
export default class FoodBase extends cc.Component {

    @property foodName: string = '';
    @property hpRestore: number = 0;
    @property staminaRestore: number = 0;

    // 由 Firebase 地圖渲染時呼叫，傳入初始資料
    init(data: { name: string; hp: number; stamina: number }) {
        this.foodName = data.name;
        this.hpRestore = data.hp;
        this.staminaRestore = data.stamina;
    }

    // 採集：把 node 從地圖移除，回傳食物資料給玩家
    collect(): { name: string; hp: number; stamina: number } {
        const data = {
            name: this.foodName,
            hp: this.hpRestore,
            stamina: this.staminaRestore
        };
        this.node.destroy();
        return data;
    }

    // 吃掉：直接套用效果（你可以換成呼叫 PlayerStats）
    eat(player: cc.Node) {
        const stats = player.getComponent('Player'); // 換成你實際的元件名
        if (stats) {
            stats.restoreHp(this.hpRestore);
            stats.restoreStamina(this.staminaRestore);
        }
        this.node.destroy();
    }

    // 丟掉：放回玩家腳下
    drop(position: cc.Vec2) {
        this.node.setPosition(position);
    }

    // 未來背包用
    addToInventory() {
        // TODO
    }
}
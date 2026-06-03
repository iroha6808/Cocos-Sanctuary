import EventCenter from "./EventCenter";
import { GameEvent } from "./Constants";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    public static instance: GameManager = null;

    @property(cc.Node)
    playerNode: cc.Node = null; // 在編輯器裡把 Player Prefab 生成的節點拖進來

    @property(cc.Boolean)
    showPhysicsDebugDraw: boolean = false;

    onLoad() {
        // 單例模式 (Singleton)，方便其他腳本直接抓取 GameManager.instance
        if (GameManager.instance === null) {
            GameManager.instance = this;
        } else {
            this.node.destroy();
            return;
        }

        // 註冊全域事件
        EventCenter.on(GameEvent.PLAYER_DIED, this.onGameOver, this);

        // 啟用物理引擎
        const physicsManager = cc.director.getPhysicsManager();
        physicsManager.enabled = true;
        physicsManager.debugDrawFlags = this.showPhysicsDebugDraw ? 1 : 0;
    }

    start() {
        console.log("遊戲初始化完成，準備進入 Cocos Sanctuary! - GameManager.ts:28");
        // TODO: 在這裡呼叫 MapManager 生成初始地圖
    }

    onGameOver() {
        console.log("玩家死亡，結算分數... - GameManager.ts:33");
        // TODO: 呼叫 UIManager 顯示結算畫面
    }

    onDestroy() {
        EventCenter.off(GameEvent.PLAYER_DIED, this.onGameOver, this);
    }
}

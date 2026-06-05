# Cocos Sanctuary Note

## 目錄

- [Git 規則](#git-規則)
- [專案結構](#專案結構)
- [Canvas 層級規劃](#canvas-層級規劃)
- [Code Trace：已實作功能](#code-trace已實作功能)
- [主要事件流程](#主要事件流程)
- [Cocos Inspector 設定](#cocos-inspector-設定)
- [目前注意事項](#目前注意事項)

## Git 規則

Master/main 要確定沒問題的版本再放上去。

Develop 是平常開發的主分支。

要寫功能就自己再拉分支出來寫，寫完 merge 到 develop，最後沒問題再 merge 回 main/master。

建議流程：

```text
main/master  穩定版
develop      日常整合開發版
feature/*    個別功能分支
```

```text
feature/*
  -> merge 到 develop
  -> 測試確認沒問題
  -> merge 到 main/master
```

## 專案結構

```text
assets/
  ├── Scenes/           # 僅存放主入口與核心場景，盡量少動
  ├── Prefabs/          # 所有的遊戲物件，例如 Player、NPC、Items、Tiles
  ├── Scripts/          # 程式碼
  │   ├── Core/         # 核心邏輯，例如 GameManager、EventCenter
  │   ├── Player/       # 玩家控制、進化邏輯
  │   ├── Entity/       # NPC 基類與三種行為 AI
  │   ├── Map/          # 地圖生成、區塊管理，例如 Land、Sea、Underground
  │   ├── UI/           # 排行榜、道具欄、血條
  │   └── Utils/        # 工具類，例如 Physics、Math
  ├── Resources/        # 需要動態加載的資源
  └── Textures/         # 靜圖、貼圖集 Atlas
```

目前 `assets/Scripts/` 實際已有：

- `Attack/`
- `Core/`
- `Data/`
- `Entity/`
- `Map/`
- `NPC/`
- `Player/`
- `UI/`
- `Utils/`

`Map/` 和 `Utils/` 目前仍以測試腳本為主；主要已實作功能集中在 `Core/`、`Player/`、`NPC/`、`Attack/`、`Data/`、`Entity/Resources/`、`Entity/Items/food/`、`UI/`。

## Canvas 層級規劃

```text
Canvas
 ├── Main Camera
 │
 ├── [Core_Controllers]    # 系統大腦區，不可見
 │    └── GameManager      # 掛載 GameManager.ts
 │
 ├── [World_Root]          # 遊戲世界區，所有有座標的東西都在這
 │    ├── Map_Layer        # 地圖層：NTHU 校園、海洋、地下 TileMap
 │    ├── Item_Layer       # 掉落物層：椰子、礦石等動態生成物
 │    ├── Entity_Layer     # 實體層：玩家、NPC
 │    └── Bullet_Layer     # 投射物層：弓箭、遠程攻擊子彈
 │
 └── [UI_Root]             # 介面區，永遠在世界畫面上層
      ├── HUD_Layer        # 常駐介面：血條、氧氣條、道具欄，掛載 UIManager.ts
      ├── PopUp_Layer      # 彈出介面：排行榜、升級進化提示
      └── Screen_Layer     # 全螢幕介面：死亡結算畫面
```

## Code Trace：已實作功能

以下是依照目前 `assets/Scripts/` 程式碼追蹤出的功能狀態。

### 操作與測試鍵

來源：`assets/Scripts/Player/PlayerController.ts`

| 操作 | 功能 |
| --- | --- |
| `A` / `D` | 左右移動，使用 RigidBody `linearVelocity`。 |
| `Space` | 跳躍，僅在垂直速度接近 0 時觸發。 |
| 滑鼠左鍵 | 玩家攻擊，播放 `PlayerAttack`，啟用 `CombatHitbox`。 |
| 滑鼠右鍵 | 測試扣血：玩家受到 20 damage。 |
| 滑鼠滾輪 | 對話選項 / 商店商品上下選擇。 |
| `B` | 開關背包 UI；打開時停止水平速度。 |
| `F` | 商人互動鍵：靠近商人時顯示對話，對話中確認選項，商店開啟時關閉流程。 |
| `T` | 測試用：直接加入 `coconut x10` 到背包，作為商人交易貨幣。 |
| 商店開啟時 `Up` / `Down` | 選擇上一個 / 下一個商店商品。 |
| 商店開啟時 `Left` / `Right` | 減少 / 增加購買數量。 |
| 商店開啟時 `Enter` | 購買目前選取商品。 |

### Core 系統

- `Constants.ts`：已定義 `PLAYER_HP_CHANGED`、`PLAYER_EXP_CHANGED`、`PLAYER_DIED`、`NPC_MOCKED`、`NPC_DIED`、`SPAWN_ITEM`。
- `EventCenter.ts`：已改成 default export，事件資料會保存原 callback、target、實際 handler；`off(eventName, callback, target)` 可正確移除特定監聽，也支援清除單一事件或全部事件。
- `BaseEntity.ts`：提供 `type`、`maxHp`、`currentHp`、`takeDamage()`、`onDamaged()`、`die()` 基底。
- `GameManager.ts`：Singleton、啟用物理、可切換 physics debug draw、監聽 `PLAYER_DIED`，目前 `onGameOver()` 還是 TODO。

### Player

- 玩家類型設為 `EntityType.PLAYER`。
- 啟用 Cocos Physics，並取得 `RigidBody` 控制移動。
- 支援左右移動、跳躍、左右翻面。
- 支援 `PlayerIdle`、`PlayerRun`、`PlayerAttack`、`PlayerHurt`、`PlayerDie` 動畫切換。
- 攻擊時會啟用 `AttackHitbox` 子節點上的 `CombatHitbox`。
- 受傷時發送 `PLAYER_HP_CHANGED`，死亡動畫結束後發送 `PLAYER_DIED` 並載入 `GameOver` 場景。
- 背包或商人 UI 開啟時，玩家移動 / 攻擊流程會暫停。
- 可掃描場景中的 `MerchantNPC`，靠近時透過 `DialogueUIController` 顯示 `Press F to Talk`。

### CombatHitbox

- `CombatHitbox.ts` 實作短時間開啟的 sensor hitbox。
- 可設定 `ownerFaction`、是否忽略同陣營、可命中的目標類型。
- 支援 Player / Peace NPC / Neutral NPC / Hostile NPC faction 判斷。
- 避免重複命中同一個目標。
- 若目標有 `receiveAttack()`，優先呼叫；否則呼叫 `BaseEntity.takeDamage()`。

### Inventory / Items

- `InventoryManager.ts`：背包 singleton，支援 `addItem()`、`removeItem()`、`getItemCount()`、`hasItem()`、`getItems()`。
- 背包最大格數目前為 `45`。
- 背包變更時發送 `cc.systemEvent.emit("INVENTORY_CHANGED")`。
- `InventoryUIController.ts`：監聽 `INVENTORY_CHANGED`，將道具名稱與數量顯示到 grid slot 的 `Label`。
- `ItemData.ts`：目前定義 `coconut`、`potion`、`apple`、`ore`、`wood`。
- `CollectibleItem.ts`：碰到 PlayerController 時可加入背包並 destroy 自己。

### Merchant / Dialogue / Shop

- `MerchantNPC.ts`：商人會強制使用 Peace NPC、Wander 移動、無攻擊。
- 商人狀態包含 `Wandering`、`Talking`、`Trading`、`Leaving`。
- `canInteract()` 會透過 NPC_AI 的互動距離判斷玩家是否可對話。
- `buy()` 以 `coconut` 作為交易貨幣，會檢查庫存、價格、玩家持有數量，再扣 coconut 並加入購買道具。
- `MerchantPool.ts`：提供預設商店庫存，包含 `potion`、`apple`、`ore`。
- `DialogueUIController.ts`：支援 Prompt、Options、選項高亮、滾輪切換、取得選取 index。
- `MerchantShopUIController.ts`：支援開關商店、顯示 coconut 數量、商品列表、價格、庫存、玩家持有數、購買數量、購買按鈕狀態。

### NPC AI

- `NPC_AI.ts` 繼承 `BaseEntity`。
- 支援 `NPCAttackType.NONE / MELEE`。
- 支援 `NPCMoveMode.NONE / CHASE_TARGET / WANDER`。
- Peace NPC 不會主動行動或攻擊。
- Neutral NPC 預設不攻擊，被 `onMocked()` 或受傷後會 enraged。
- Hostile / enraged Neutral 可偵測、追蹤、攻擊玩家。
- 支援自動尋找 `targetNodeName`，預設找 `Player`。
- 支援互動距離、談話 / 交易時暫停移動。
- 支援 Wander：隨機 idle / 左右移動。
- 支援卡住時自動跳躍。
- 支援方向動畫：`idle_front/right/back`、`move_*`、`attack_*`、`damaged_*`，死亡使用 `death`。
- 支援 NPC HP bar 更新、死亡隱藏血條、發送 `NPC_DIED`。

### Resource / Drop / Food

- `ResourceObject.ts`：支援 `TREE`、`ORE` 兩類資源。
- 資源有耐久度、互動距離、掉落數量、drop prefab。
- 滑鼠左鍵點擊資源且玩家距離夠近時會扣耐久。
- 耐久歸零後，Tree 會換成 depleted sprite，Ore 會 destroy。
- 資源耗盡時會生成 drop prefab，Tree 掉 `Apple`，Ore 掉 `Ore`。
- `DropItem.ts`：掉落物會先飛出，碰到 ground / Ground / tempFloor 後停下；玩家靠近後吸附，達到收集距離後 destroy。
- `FoodBase.ts`：食物掉落物可飛出、吸附玩家、收集時加入 `InventoryManager`。
- `coconut.ts`：椰子有 OnTree / Falling / OnGround / Held 狀態，支援掉落、顯示互動提示、撿起、吃掉、丟出。

### UI

- `UIManager.ts`：監聽 `PLAYER_HP_CHANGED` 更新 HP progress bar，監聽 `PLAYER_EXP_CHANGED` 更新 EXP label。
- `InventoryUIController.ts`：背包 grid UI。
- `DialogueUIController.ts`：商人提示與對話選項 UI。
- `MerchantShopUIController.ts`：商店 UI 與購買流程。

## 主要事件流程

```text
PlayerController.takeDamage()
  -> PlayerController.onDamaged()
  -> EventCenter.emit(PLAYER_HP_CHANGED, currentHp, maxHp)
  -> UIManager.onHpUpdated()
  -> hpBar.progress 更新
```

```text
PlayerController.gainExp()
  -> EventCenter.emit(PLAYER_EXP_CHANGED, exp)
  -> UIManager.onExpUpdated()
  -> expLabel.string 更新
```

```text
PlayerController.die()
  -> 播放 PlayerDie
  -> 動畫結束
  -> EventCenter.emit(PLAYER_DIED)
  -> GameManager.onGameOver()
  -> cc.director.loadScene("GameOver")
```

```text
CombatHitbox.onBeginContact()
  -> findTarget()
  -> receiveAttack() 或 takeDamage()
  -> NPC / Player 扣血與播放受傷動畫
```

```text
MerchantNPC.buy()
  -> 檢查商店庫存
  -> 檢查玩家 coconut 數量
  -> InventoryManager.removeItem("coconut", cost)
  -> InventoryManager.addItem(商品)
  -> INVENTORY_CHANGED
  -> InventoryUIController / MerchantShopUIController refresh
```

## 目前注意事項

- `BaseEntity.takeDamage()` 仍是基底版本，沒有 clamp HP；`NPC_AI` 自己有 override 並 clamp，Player 目前靠動畫狀態控制死亡流程。
- `PlayerController` 目前有 `T` 測試鍵直接增加 coconut，正式版應移除或包成 debug 開關。
- `PlayerController` 滑鼠右鍵目前是測試扣血，正式版應改成實際道具 / 互動邏輯。
- `GameManager.onGameOver()` 目前只有 log；真正結算 UI 還沒接。
- `DropItem.ts` 收集後只 destroy，沒有加入背包；`FoodBase.ts` 和 `CollectibleItem.ts` 有加入背包。
- `ResourceObject.findPlayer()` 目前固定找 `Canvas/Player`，場景節點路徑如果不同要調整。
- `coconut.ts` 的 `eat()` 會找 `PlayerStats`，但目前玩家主腳本是 `PlayerController`；要接回血需再統一玩家 stats API。

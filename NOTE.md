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
  │   ├── Scene/        # 場景專用腳本，例如 MenuScene
  │   ├── UI/           # 排行榜、道具欄、血條
  │   └── Utils/        # 工具類，例如 Physics、Math
  ├── resources/        # 需要動態加載的資源
  └── Textures/         # 靜圖、貼圖集 Atlas
```

目前 `assets/Scripts/` 實際已有：

- `Attack/`
- `Core/`
- `Data/`
- `Entity/`
- `Input/`
- `Map/`
- `NPC/`
- `Player/`
- `Scene/`
- `UI/`
- `Utils/`

`Utils/` 目前仍以測試腳本為主；主要已實作功能集中在 `Core/`、`Player/`、`NPC/`、`Attack/`、`Data/`、`Entity/Resources/`、`Entity/Resources/food/`、`Map/`、`Scene/`、`UI/`。

素材新增重點：

- `assets/Textures/Buttons/`：商店 / UI 可用按鈕圖。
- `assets/Textures/effects/fire effects/`：BurningCoconutProjectile 使用的火焰特效圖與 `fire_effect.anim`。
- `assets/Textures/npcs/`：Slime 與 Skeleton Mage 角色素材 / 動畫。
- `assets/resources/100 FOOD ASSETS/`：水果、堅果、蔬菜、花、菇類 icon 圖；注意這是小寫 `resources`，可供 `cc.resources.load()` 使用。
- `assets/resources/Purple Planet - Platformer Tileset/`：地圖 / 礦物 / tile 相關素材，包含 png 與來源向量檔。

## Canvas 層級規劃

```text
Canvas
 ├── Main Camera
 │    └── CameraFollow / follow Player
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
          └── MerchantShopPanel  # 建議放這裡或 Main Camera 子節點，避免世界座標跑出畫面
```

## Code Trace：已實作功能

以下是依照目前 `assets/Scripts/` 程式碼追蹤出的功能狀態。

### 操作與測試鍵

Game 場景輸入入口集中在 `assets/Scripts/Input/InputManager.ts`。它把 key / mouse / wheel 轉成 `InputAction`，再依 `InputContext` stack 分派給 Pause、商店、對話、合成、背包或 Gameplay。

| 操作 | 功能 | 實作位置 |
| --- | --- | --- |
| `A` / `D` | 左右移動，使用 RigidBody `linearVelocity`。 | `InputBindings.getActionForKey()` -> `InputManager` -> `PlayerController.setMoveInput()` / `update()` |
| `Space` | 跳躍；水域中改成上游。 | `InputAction.Jump` -> `PlayerController.jump()` / `getOceanVerticalInput()` |
| 滑鼠左鍵 | Gameplay 時攻擊；Pause / UI context 會吃掉。 | `InputManager.onMouseDown()` -> `InputAction.Attack` -> `PlayerController.attack()` |
| `B` | 開關背包 UI；背包開啟時 push `Inventory` context。 | `PlayerController.toggleInventory()` / `handleInventoryInput()` |
| `F` | Gameplay 時互動；對話中確認；商店中購買。 | `PlayerController.handleGameplayInput()` / `handleDialogueInput()` / `handleMerchantShopInput()` |
| `Esc` | 依最上層 context：關商店 / 關合成 / 關背包 / Pause Resume。 | `InputAction.Cancel`、`GameManager.handleGameplayInput()`、`handlePausedInput()` |
| `R` | Game / GameOver 時重玩；Pause 中也可重玩。 | `InputAction.Retry`、`GameManager.handleGameplayInput()`、`GameOverScene.onKeyDown()` |
| `M` | 切換靜音 / 取消靜音。 | `InputAction.ToggleMute`、`AudioManager.toggleMute()` |
| `C` | 開關合成工作臺 UI；合成開啟時 push `Crafting` context。 | `PlayerController.toggleCrafting()`、`CraftingUIController.handleInput()` |
| `Enter` | 選擇對話選項；商店開啟時購買目前選取商品。 | `InputAction.Confirm`、`handleDialogueInput()`、`MerchantShopUIController.handleInput()` |
| `Up` / `Down`、`W` / `S`、滑鼠滾輪 | Gameplay 水中上下；UI context 中改成對話 / 商店上下選擇。 | `InputManager.onMouseWheel()`、`PlayerController` context handlers |
| 水域中 `W` / `Up` / `Space` | 上游。 | `PlayerController.getOceanVerticalInput()`、`updateOceanMovement()` |
| 水域中 `S` / `Down` | 下潛。 | `PlayerController.getOceanVerticalInput()`、`updateOceanMovement()` |
| 商店開啟時 `Left` / `Right` | 減少 / 增加購買數量。 | `MerchantShopUIController.handleInput()` |
| `T` | 測試用：加入 `coconut x10` 到背包，作為商人交易貨幣。 | `InputAction.DebugAddCoconut` -> `PlayerController.debugAddCoconut()` |
| `Y` | 測試用：加入 `coconut`、`ore`、`apple` 各 10 個，方便測合成與交易。 | `InputAction.DebugAddCraftItems` -> `PlayerController.debugAddCraftItems()` |

### Core 系統

- `Constants.ts`：已定義 HP / EXP / Score、Pause、Save、Leaderboard、Combat hit、Player / NPC death、Item collected、Merchant purchased 等事件。
- `EventCenter.ts`：已改成 default export，事件資料會保存原 callback、target、實際 handler；`off(eventName, callback, target)` 可正確移除特定監聽，也支援清除單一事件或全部事件。
- `BaseEntity.ts`：提供 `type`、`maxHp`、`currentHp`、clamp 後的 `takeDamage()`、`heal()`、`onDamaged()`、`die()` 基底。
- `SaveService.ts`：localStorage 假 Firebase 後端，支援 register / login / logout / saveGame / loadGame / submitScore / getLeaderboard。
- `AudioManager.ts`：支援 scene BGM 與 attack / hit / collect / buy / heal / skill 六種 SFX。
- `EffectsManager.ts`：用 runtime `cc.ParticleSystem` 產生 hit / collect / heal / fire / water 五種粒子特效。
- `InputManager.ts`：統一監聽 Game 場景 key / mouse / wheel，依 `InputContext` stack 分派 `InputAction`。
- `CameraRig.ts`：runtime 掛到 Main Camera，使用距離指數函數調整跟隨速度，搭配 look-ahead / shake / impulse / zoom kick 做較貼身的橡皮筋運鏡。
- `HitFeelManager.ts`：監聽 `COMBAT_HIT_CONFIRMED`，命中時觸發短 hit stop、隨機方向的小幅鏡頭回饋與目標閃白。
- `GameManager.ts`：Singleton、啟用物理、Score / EXP、Pause / Resume、Retry、回主畫面、存讀檔、死亡結算與排行榜提交；Pause 會同時停 scheduler 與 physics，場景切換時會清掉 static instance，避免第二輪按鍵失效。

### Player

- 玩家類型設為 `EntityType.PLAYER`。
- 啟用 Cocos Physics，並取得 `RigidBody` 控制移動。
- 支援左右移動、跳躍、左右翻面。
- 支援 `PlayerIdle`、`PlayerRun`、`PlayerAttack`、`PlayerHurt`、`PlayerDie` 動畫切換。
- 攻擊時會啟用 `AttackHitbox` 子節點上的 `CombatHitbox`。
- 攻擊、受傷、進入水域會觸發 `AudioManager` / `EffectsManager` feedback。
- 不直接監聽 keyboard；Gameplay context 只呼叫玩家能力方法，Dialogue / Merchant / Inventory context 由 PlayerController 協調流程。
- 受傷時發送 `PLAYER_HP_CHANGED`，死亡動畫結束後發送 `PLAYER_DIED`，讓 `GameManager` 結算後載入 `GameOver` 場景。
- 背包或商人 UI 開啟時，玩家移動 / 攻擊流程會暫停。
- 可掃描場景中的 `MerchantNPC`，靠近時透過 `DialogueUIController` 顯示 `Press F to Talk`。
- 進入 `OceanArea` 後切換水中狀態：降低 gravityScale、水平速度改用 `oceanMoveSpeed`，垂直方向改用 `oceanVerticalSpeed`。
- 死亡載入 `GameOver` 前有 `gameOverTransitionPending`，避免重複切場景。
- Main Camera 目前會跟隨玩家移動到水域；商人生成依玩家世界座標，所以玩家在水域時商人會生成在附近。

### CombatHitbox

- `CombatHitbox.ts` 實作短時間開啟的 sensor hitbox。
- 可設定 `ownerFaction`、是否忽略同陣營、可命中的目標類型。
- 支援 Player / Peace NPC / Neutral NPC / Hostile NPC faction 判斷。
- 避免重複命中同一個目標。
- 確認命中後發送 `COMBAT_HIT_CONFIRMED`，讓 `HitFeelManager` 做 hit stop / shake / flash。
- 若目標有 `receiveAttack()`，優先呼叫；否則呼叫 `BaseEntity.takeDamage()`。

### CombatProjectile

- `CombatProjectile.ts` 實作遠程攻擊投射物。
- `launch(owner, faction, velocity, damage, knockbackX, knockbackY)` 由 `NPC_AI` 呼叫。
- 支援陣營過濾、忽略 owner hierarchy、同一目標只命中一次。
- 命中目標時發送 `COMBAT_HIT_CONFIRMED` 並優先呼叫 `receiveAttack()`；命中實體地形或生命週期結束後 destroy。
- `visualNode` 可跟隨速度方向旋轉；若 prefab 有 `CoconutSprite` / `FireEffect`，會自動整理成 `VisualRoot`。

### Inventory / Items

- `InventoryManager.ts`：背包 singleton，支援 `addItem()`、`removeItem()`、`getItemCount()`、`hasItem()`、`getItems()`。
- `InventoryManager.ts`：新增 `getSaveSnapshot()`、`setItemsFromSave()`、`clear()`，可供 `SaveService` 存讀檔。
- `addItem()` 現在簽名是 `addItem(id, count)`，會從 `ItemData.ts` 找道具名稱與描述。
- 背包最大格數目前為 `40`。
- 背包變更時發送 `cc.systemEvent.emit("INVENTORY_CHANGED")`。
- `InventoryUIController.ts`：監聽 `INVENTORY_CHANGED`，將道具數量顯示到 grid slot 的 `Label`，並支援 coconut / apple / ore icon。
- `InventoryUIController.ts`：右鍵格子可開 action menu，支援 Use / Delete；目前 Use 只是扣道具，尚未套用回血效果。
- `ItemData.ts`：目前定義 `coconut`、`potion`、`apple`、`ore`、`wood`，以及多種水果 / 堅果資料與 icon / HP / stamina / rotten time。
- `CollectibleItem.ts`：碰到 PlayerController 時可加入背包並 destroy 自己。

### Merchant / Dialogue / Shop

- `MerchantNPC.ts`：商人會強制使用 Peace NPC、Wander 移動、無攻擊。
- 商人狀態包含 `Wandering`、`Talking`、`Trading`、`Leaving`。
- `canInteract()` 會透過 NPC_AI 的互動距離判斷玩家是否可對話。
- `buy()` 以 `coconut` 作為交易貨幣，會檢查庫存、價格、玩家持有數量，再扣 coconut 並加入購買道具。
- `MerchantNPC.buy()` 已改成單一 `InventoryManager.transact()`，避免購買成功後重複加商品；成功時發送 `MERCHANT_PURCHASED` 並播放 buy SFX。
- `MerchantPool.ts`：提供預設商店庫存，包含 `potion`、`apple`、`ore`；隨機池另含 `wood`。
- `MerchantSpawner.ts`：可開場或定時生成 TravelingMerchant，會重用既有商人，避免重複生成。
- `MerchantSpawner.ts`：生成位置跟玩家世界座標有關，Camera 跟到 OceanArea 後商人也可能出現在水域附近。
- `NPCDialogue.ts`：統一 `Trade`、`Chat`、`Leave` 對話選項 ID 與資料格式。
- `DialogueUIController.ts`：支援 Prompt、Options、選項高亮、滾輪切換、取得選取 index，並用 anchorTarget + clamp 讓對話留在鏡頭可見範圍。
- `MerchantShopUIController.ts`：支援開關商店、顯示 coconut 數量、商品列表、價格、庫存、玩家持有數、購買數量、購買按鈕狀態；目前 root 仍偏世界固定座標。

### NPC AI

- `NPC_AI.ts` 繼承 `BaseEntity`。
- 支援 `NPCAttackType.NONE / MELEE / RANGED`。
- 支援 `NPCMoveMode.NONE / CHASE_TARGET / WANDER`。
- Peace NPC 不會主動行動或攻擊。
- Neutral NPC 預設不攻擊，被 `onMocked()` 或受傷後會 enraged。
- Hostile / enraged Neutral 可偵測、追蹤、攻擊玩家。
- 支援自動尋找 `targetNodeName`，預設找 `Player`。
- 支援互動距離、談話 / 交易時暫停移動。
- 支援 Wander：隨機 idle / 左右移動。
- 支援卡住時自動跳躍。
- 支援遠程 projectile prefab、生成點、parent、釋放延遲、瞄準模式、飛行時間、速度與擊退。
- 支援 NPC drop table：死亡後可依機率生成 prefab 並設定 `DropItem.itemName` / `itemAmount`。
- 支援方向動畫：`idle_front/right/back`、`move_*`、`attack_*`、`damaged_*`，死亡使用 `death`。
- 支援 NPC HP bar 更新、死亡隱藏血條、發送 `NPC_DIED`。
- NPC 目前功能重點：Dynamic RigidBody、hurtbox / attack hitbox、HP bar、jump / stuck 越障、受傷 / 死亡動畫與近遠程攻擊。

### Resource / Drop / Food

- `ResourceObject.ts`：資源基底，處理滑鼠左鍵互動、互動距離、每幾下觸發一次掉落、共用 prefab spawn 工具。
- `AppleTree.ts`：蘋果樹 / 灌木子類，支援 `maxApples`、`regenInterval`、蘋果掉落與 depleted 外觀。
- `OreRock.ts`：礦石子類，支援 weighted drop table，掉落後 destroy。
- `DropItem.ts`：掉落物會先飛出，碰到 ground / Ground / tempFloor 後停下；玩家靠近後吸附，收集成功會加入背包、發送 `ITEM_COLLECTED`、播放 collect SFX / particle 並 destroy。
- `FoodBase.ts`：位於 `Entity/Resources/food/`，繼承 `DropItem`，食物掉落物可飛出、吸附玩家、收集時加入 `InventoryManager`。
- `FoodBase.eat()` 會先找 `PlayerStats`，沒有時改用 `PlayerController.heal()`，並發送 HP 更新與 heal feedback。
- 水果 / 堅果腳本已大量補齊：apple、avacado、blueberries、cherry、coconut、durian、grapes、greenapple、kiwi、mulberry、orange、peach、pear、pineapple、plum、redberries、strawberry、watermelonslice、acorn、cashew、chestnut、coffeebean、guazi、peanuts、pistachio。
- `coconut.ts`：目前是 `FoodBase` 子類，`itemName = "coconut"`，同時作為商人交易測試貨幣。

### Map / Scene

- `OceanArea.ts`：掛在水域 sensor collider 上；玩家進入時呼叫 `enterOceanArea()`，離開時呼叫 `exitOceanArea()`。
- `MenuScene.ts`：選單場景用腳本，支援開始遊戲、讀取存檔進遊戲、註冊、登入、登出、設定面板、排行榜、靜音與 fade。
- `GameOverScene.ts`：結算場景腳本，讀取 `SaveService.getLastRun()`，顯示玩家、Score、EXP，支援 Retry、Main Menu、Submit Score。

### UI

- `UIManager.ts`：監聽 `PLAYER_HP_CHANGED`、`PLAYER_EXP_CHANGED`、`SCORE_CHANGED` 更新 HP / EXP / Score HUD。
- `InventoryUIController.ts`：背包 grid UI。
- `DialogueUIController.ts`：商人提示與對話選項 UI；已能跟隨商人並 clamp 到 Canvas 可見區域。
- `MerchantShopUIController.ts`：商店 UI 與購買流程；應改成掛在 Screen UI Root / Main Camera 底下，或在 `open()` 時依 camera/screen 座標重新定位。

## 主要事件流程

```text
NPC_AI RANGED
  -> startAttack()
  -> schedule releaseRangedProjectile()
  -> instantiate projectile prefab
  -> CombatProjectile.launch()
  -> receiveAttack() / terrain hit / lifetime destroy
```

```text
OceanArea.onBeginContact()
  -> find PlayerController
  -> PlayerController.enterOceanArea()
  -> ocean movement update
  -> OceanArea.onEndContact()
  -> PlayerController.exitOceanArea()
```

```text
DropItem.collect()
  -> InventoryManager.addItem(itemId, amount)
  -> EventCenter.emit(ITEM_COLLECTED, itemId, amount)
  -> GameManager.addScore()
  -> AudioManager / EffectsManager collect feedback
  -> INVENTORY_CHANGED
  -> InventoryUIController.refreshUI()
  -> node.destroy()
```

```text
MerchantSpawner.spawnMerchant()
  -> resolve Canvas/Player and Canvas/NPC
  -> use player world position
  -> reuse existing MerchantNPC if found
  -> instantiate TravelingMerchant prefab
  -> MerchantNPC rolls stock
```

```text
Merchant dialogue / shop UI
  -> DialogueUIController.showOptions(anchorTarget=merchant)
  -> clamp dialogue to visible Canvas area
  -> MerchantShopUIController.open()
  -> should show under Screen UI Root / Main Camera
```

```text
PlayerController.takeDamage()
  -> PlayerController.onDamaged()
  -> AudioManager / EffectsManager hit feedback
  -> EventCenter.emit(PLAYER_HP_CHANGED, currentHp, maxHp)
  -> UIManager.onHpUpdated()
  -> hpBar.progress 更新
```

```text
GameManager.addExp()
  -> EventCenter.emit(PLAYER_EXP_CHANGED, exp)
  -> UIManager.onExpUpdated()
  -> expLabel.string 更新
```

```text
GameManager.addScore()
  -> EventCenter.emit(SCORE_CHANGED, score)
  -> UIManager.onScoreUpdated()
  -> scoreLabel.string 更新
```

```text
PlayerController.die()
  -> 播放 PlayerDie
  -> 動畫結束
  -> EventCenter.emit(PLAYER_DIED)
  -> GameManager.onGameOver()
  -> SaveService.setLastRun()
  -> 若已登入，saveGame() + submitScore()
  -> cc.director.loadScene("GameOver")
```

```text
CombatHitbox.onBeginContact()
  -> findTarget()
  -> receiveAttack() 或 takeDamage()
  -> AudioManager / EffectsManager hit feedback
  -> NPC / Player 扣血與播放受傷動畫
```

```text
MerchantNPC.buy()
  -> 檢查商店庫存
  -> 檢查玩家 coconut 數量
  -> InventoryManager.transact(扣 coconut, 加商品)
  -> EventCenter.emit(MERCHANT_PURCHASED)
  -> GameManager.addScore()
  -> INVENTORY_CHANGED
  -> InventoryUIController / MerchantShopUIController refresh
```

```text
Menu / save / leaderboard
  -> MenuScene.register() / login() / logout()
  -> SaveService localStorage users
  -> MenuScene.loadSavedGame()
  -> SaveService.requestLoadOnNextGame()
  -> GameManager.loadCurrentUserSave()
  -> InventoryManager.setItemsFromSave()
  -> SAVE_LOADED / SCORE_CHANGED / PLAYER_EXP_CHANGED
```

```text
GameOverScene
  -> SaveService.getLastRun()
  -> show username / score / exp
  -> retry() load Game
  -> goToMainMenu() load MenuScene
  -> submitScore() update leaderboard
```

## Cocos Inspector 設定

- `GameManager.ts`：接 `playerNode`、`pausePanel`、`fadeOverlay`；Pause panel 按鈕綁 `resumeGame()`、`restartGame()`、`backToMenu()`、`saveCurrentGame()`。
- `UIManager.ts`：接 `hpBar`、`expLabel`、`scoreLabel`。
- `MenuScene.ts`：接 main / login / settings / leaderboard panels、username / password EditBox、status / current user / leaderboard labels、fadeOverlay。
- `GameOverScene.ts`：接 title / username / score / exp / status labels、fadeOverlay；按鈕綁 `retry()`、`goToMainMenu()`、`submitScore()`。
- `AudioManager.ts`：接 `sceneBgm` 與 attack / hit / collect / buy / heal / skill 六個 SFX clip。
- `EffectsManager.ts`：接 `effectRoot` 與 `particleSpriteFrame`。
- `MerchantShopPanel` 仍建議移到 Screen UI Root 或 Main Camera 子節點，避免 OceanArea 時跑出鏡頭。

## 目前注意事項

- `BaseEntity.takeDamage()` 已 clamp HP，並提供 `heal()`；Player / FoodBase 仍需實機測試回血 UI。
- `PlayerController` 目前仍有 `T` 測試鍵，正式版應移除或包成 debug 開關。
- `GameManager.onGameOver()` 已寫入 last run / save / leaderboard；GameOver 畫面仍需手動接 `GameOverScene` labels/buttons。
- `ResourceObject.findPlayer()` 目前固定找 `Canvas/Player`，場景節點路徑如果不同要調整。
- Menu / Pause / GameOver / Audio / Effects 都是腳本已補，Cocos Editor 節點與 Inspector 欄位需照 `PLAN.md` 手動設定。
- 遠程攻擊是否能打到玩家，取決於 SkeletonMage 的 `projectilePrefab`、`projectileSpawnNode`、`projectileParent`、collider sensor 與 contact listener。
- OceanArea 需要 `PhysicsBoxCollider` sensor，且 Player collider / rigidbody 要能觸發 contact。
- MerchantShop UI 目前仍固定在原本 Background / 世界座標；在 OceanArea 交易時會跑到鏡頭外，需改掛 Screen UI Root / Main Camera 或在 `open()` 時轉成 camera/screen 座標。
- Dialogue UI 已跟著商人並 clamp 到鏡頭可見範圍；商店 UI 尚未同步這個做法。
- `ItemData.iconPath` 目前多數已改為 resources 相對路徑，但仍要實測大小寫與檔名，例如 `greenapple`、`coffeebean`、`guazi` / `gauzi.ts`。

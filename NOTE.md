# Cocos Sanctuary Note

> 更新日期：2026-06-11

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
- `Camera/`
- `Data/`
- `Entity/`
- `Input/`
- `Map/`
- `NPC/`
- `Player/`
- `Scene/`
- `UI/`
- `Vehicle/`
- `Utils/`

`Utils/` 目前仍以測試腳本為主；主要已實作功能集中在 `Core/`、`Player/`、`NPC/`、`Attack/`、`Data/`、`Entity/Resources/`、`Entity/Resources/food/`、`Map/`、`Scene/`、`UI/`。

素材新增重點：

- `assets/Textures/Buttons/`：商店 / UI 可用按鈕圖。
- `assets/Textures/effects/fire effects/`：BurningCoconutProjectile 使用的火焰特效圖與 `fire_effect.anim`。
- `assets/Textures/npcs/`：Slime 與 Skeleton Mage 角色素材 / 動畫。
- `assets/resources/npcs/sprites/characters/merchant/`：TravelingMerchant 新商人 sprite，包含 `Idle1/idle_rigjt.anim` 與 `Speak1/talk_right.anim`。
- `assets/resources/100 FOOD ASSETS/`：水果、堅果、蔬菜、花、菇類 icon 圖；注意這是小寫 `resources`，可供 `cc.resources.load()` 使用。
- `assets/resources/smallore/`：礦物掉落物 icon，例如 ambersphere、amethyst、coallump、rawgold、voidnugget。
- `assets/resources/potions/`：blue / red / yellow potion 圖與合併圖。
- `assets/resources/Purple Planet - Platformer Tileset/`：地圖 / 礦物 / tile 相關素材，包含 png 與來源向量檔。
- `assets/Prefabs/Map/` 與 `assets/Prefabs/Resources/Rocksets/`：Rockleft / Rockright / Rockplatform3 / 4 / 5 地形 prefab。
- `assets/Prefabs/Resources/potions/`：Blue / Red / Yellow Potion prefab。

## Canvas 層級規劃

目前 `assets/Scenes/Game.fire` 讀到的 Canvas 層級：

```text
Canvas
├── Main Camera
│   └── Background
├── Core Controllers
├── World Root
├── UI Root
│   ├── ExpLabel
│   ├── HpBar
│   ├── FloatingDialogueRoot
│   │   ├── PromptBubble / PromptLabel
│   │   └── DialogueBubble / DialogueLabel / OptionTrade / OptionChat / OptionLeave
│   ├── MerchantShopPanel
│   └── CraftingUIHost / CraftingUIRoot
├── Player
│   ├── Sprite_Body
│   └── AttackHitbox
├── Orerock
├── applebush
├── Meteorite Chunk
├── NPC
│   ├── Slime
│   ├── Boar
│   └── SkeletonMage
├── coconuts
└── platform
    ├── auto generate
    │   └── AutoRock_* runtime nodes
    └── Rockleft / Rockright / Rockplatform3 / 4 / 5 copies
```

## Code Trace：已實作功能

以下是依照目前 `assets/Scripts/` 程式碼追蹤出的功能狀態。

### 操作與測試鍵

Game 場景全域輸入仍由 `assets/Scripts/Input/InputManager.ts` 定義 action / context；`a05605d` 之後 `PlayerController.ts` 也保留部分 gameplay key / mouse / wheel 直接處理。正式整理時要確認兩邊責任不要重疊。

| 操作 | 功能 | 實作位置 |
| --- | --- | --- |
| `A` / `D` | 左右移動，使用 RigidBody `linearVelocity`。 | `PlayerController.onKeyDown()` / `onKeyUp()` -> `applyMoveKey()` -> `update()` |
| `Space` | 跳躍；水域中改成 boost / 上游邏輯。 | `PlayerController.applyMoveKey()` -> `jump()` / `boostInOcean()` / `getOceanVerticalInput()` |
| 滑鼠左鍵 | Gameplay 時近戰攻擊；Pause / UI 時會被玩家狀態檢查擋掉。 | `PlayerController.setupMouseAttackInput()` -> `handleMouseAttack()` -> `attack()` |
| 滑鼠右鍵 | 玩家槍射擊；Pause / UI / 背包 / 商店 / 合成開啟時不射擊。 | `PlayerGun.ts` -> `ProjectilePoolManager.spawn()` -> `CombatProjectile.launch()` |
| `1` | 切到 Gun 模式。 | `PlayerToolController.onKeyDown()` -> `setMode(PlayerToolMode.Gun)` |
| `2` | 切到 Jetpack 模式。 | `PlayerToolController.onKeyDown()` -> `setMode(PlayerToolMode.Jetpack)` |
| `3` | 切到 Grapple 模式。 | `PlayerToolController.onKeyDown()` -> `setMode(PlayerToolMode.Grapple)` |
| Jetpack 模式 `Space` | 原本跳躍起手保留，按住時消耗 fuel 持續向上推進。 | `PlayerController.applyMoveKey()` + `PlayerToolController.updateJetpack()` |
| Grapple 模式滑鼠右鍵 | Raycast 鉤非 sensor 實體地形，按住拉向鉤點，放開或超距解除。 | `PlayerToolController.tryAttachGrapple()` / `updateGrapple()` |
| `B` | 開關背包 UI；背包開啟時 push `Inventory` context。 | `PlayerController.toggleInventory()` / `handleInventoryInput()` |
| `F` | Gameplay 時互動；優先商人，沒有商人才檢查車 / 船；載具中按 `F` 下車 / 下船。 | `PlayerController.tryInteractWithMerchant()`、`VehicleController.handleVehicleInput()` |
| `Esc` | 依最上層 context：關商店 / 關合成 / 關背包 / Pause Resume。 | `InputAction.Cancel`、`GameManager.handleGameplayInput()`、`handlePausedInput()` |
| `M` | 切換靜音 / 取消靜音。 | `InputAction.ToggleMute`、`AudioManager.toggleMute()` |
| `+` / `-` | 調整 Main Camera zoom；`+` 放大、`-` 拉遠，Pause 中也可用。 | `InputAction.CameraZoomIn/Out`、`GameManager.adjustCameraZoom()`、`CameraRig.adjustBaseZoom()` |
| `G` | 觸發自動地圖逐塊生成；生成期間鏡頭拉到整個生成範圍，結束後回到玩家。 | `InputAction.GenerateMap`、`GameManager.beginAutoMapGeneration()`、`AutoMapGenerator.beginTimedGeneration()` |
| `C` | 開關合成工作臺 UI；合成開啟時 push `Crafting` context。 | `PlayerController.toggleCrafting()`、`CraftingUIController.handleInput()` |
| `Enter` | 選擇對話選項；商店開啟時購買目前選取商品。 | `InputAction.Confirm`、`handleDialogueInput()`、`MerchantShopUIController.handleInput()` |
| `Up` / `Down`、`W` / `S`、滑鼠滾輪 | Gameplay 水中上下；UI context 中改成對話 / 商店上下選擇。 | `InputManager.onMouseWheel()`、`PlayerController` context handlers |
| 水域中 `W` / `Up` / `Space` | 上游。 | `PlayerController.getOceanVerticalInput()`、`updateOceanMovement()` |
| 水域中 `S` / `Down` | 下潛。 | `PlayerController.getOceanVerticalInput()`、`updateOceanMovement()` |
| 空中 `S` / `Down` | 快速下墜。 | `PlayerController.tryFastFall()` |
| 水域中 `Space` | 水中 boost，受 cooldown 限制。 | `PlayerController.boostInOcean()` |
| 車 / 船中 `A/D/W/S/Space/F` | 載具控制；車用 A/D + Space 煞車，船用 A/D/W/S + Space 小加速，F 離開。 | `VehicleController` + `CarController` / `BoatController` |
| 商店開啟時 `Left` / `Right` | 減少 / 增加購買數量。 | `MerchantShopUIController.handleInput()` |
| `T` | 測試用：加入 `coconut x10` 到背包，作為商人交易貨幣。 | `InputAction.DebugAddCoconut` -> `PlayerController.debugAddCoconut()` |
| `Y` | 測試用：加入 `coconut`、`ore`、`apple` 各 10 個，方便測合成與交易。 | `InputAction.DebugAddCraftItems` -> `PlayerController.debugAddCraftItems()` |

### Core 系統

- `Constants.ts`：已定義 HP / EXP / Score、Pause、Save、Leaderboard、Combat hit、Player / NPC death、Item collected、Merchant purchased 等事件。
- `EventCenter.ts`：已改成 default export，事件資料會保存原 callback、target、實際 handler；`off(eventName, callback, target)` 可正確移除特定監聽，也支援清除單一事件或全部事件。
- `BaseEntity.ts`：提供 `type`、`maxHp`、`currentHp`、clamp 後的 `takeDamage()`、`heal()`、`onDamaged()`、`die()` 基底。
- `SaveService.ts`：localStorage 假 Firebase 後端，支援 register / login / logout / saveGame / loadGame / submitScore / getLeaderboard；使用者資料會記錄 `createdAt`、`lastLoginAt`、`lastLogoutAt`、`loginCount`。
- `SaveService.ts`：fake multiplayer realtime snapshot，支援 `upsertRealtimePlayerState()`、`getRealtimePlayers()`、`clearStaleRealtimePlayers()`；每筆 realtime player 會帶 `clientId`、`sessionId`、`displayName`、position、HP、Score、EXP、背包格數 / 總數與 `status`。
- `SaveService.ts`：`getBackendSnapshot()` 可一次取出 current user、client/session、user summaries、save summaries、leaderboard、realtime players、current map、last run 與目前專案 localStorage keys，方便之後接 debug UI 或替換 Firebase。
- `AudioManager.ts`：支援 land / water BGM 雙 channel crossfade；監聽 `PLAYER_WATER_STATE_CHANGED`，水中淡到 `waterBgm`，未拖 `waterBgm` 時維持 `sceneBgm`。SFX 仍有 attack / hit / collect / buy / heal / skill 六種。
- `ThemeManager.ts`：主題 / 色調切換雛形，可註冊 `tintTargets`、可選 `tintOverlay`，並提供 `applyTheme(themeName, duration)`；若開 `autoApplyOceanTheme`，會跟水域狀態切 default / ocean tint。
- `EffectsManager.ts`：用 runtime `cc.ParticleSystem` 產生 hit / collect / heal / fire / water 五種粒子特效。
- `InputManager.ts`：統一監聽 Game 場景 key / mouse / wheel，依 `InputContext` stack 分派 `InputAction`；新增 `Vehicle` context，載具中優先吃 A/D/W/S/Space/F。
- `CameraRig.ts`：手動掛到 Main Camera，跟隨速度使用 `distance * distanceSpeedK * (1 - exp(-distance / distanceResponseScale))`，再用 `minFollowSpeed/maxFollowSpeed` 夾住手感；搭配 look-ahead / shake / impulse / zoom kick 做較貼身的橡皮筋運鏡。另提供 `frameWorldRect()` / `returnToTarget()`，供自動地圖生成時暫時拉遠看完整生成範圍。
- `CameraFollow.ts`：舊版簡單 smooth follow，已不再由 PlayerController runtime 補掛；正式展示以 `CameraRig.ts` 為主。
- `HitFeelManager.ts`：監聽 `COMBAT_HIT_CONFIRMED`，命中時觸發短 hit stop、隨機方向的小幅鏡頭回饋與目標閃白。
- `RealtimeStateReporter.ts`：每 0.25 秒把玩家 `username`、`clientId`、`sessionId`、scene、position、HP、Score、EXP、背包摘要 / 統計與 online / paused 狀態寫入 `SaveService` localStorage，之後可換成 Firebase realtime 資料流。
- `DamageNumberManager.ts`：監聽 `COMBAT_HIT_CONFIRMED`，顯示上飄傷害數字並播放 damage spark；GameManager 會 runtime 補一個。
- `GameManager.ts`：Singleton、啟用物理、Score / EXP、Pause / Resume、Retry、回主畫面、存讀檔、死亡結算與排行榜提交；Pause 會同時停 scheduler 與 physics，並顯示 `pausePanel`。Retry / 回主畫面可透過 `fadeOverlay` 做 0.25 秒黑幕淡出，場景切換時會清掉 static instance，避免第二輪按鍵失效。
- 原則：能在 Inspector 掛節點就不要寫死 `cc.find()` 路徑；目前 `GameManager.cameraRig`、`GameManager.playerNode`、`CameraRig.target` 都採手動綁定，避免改場景層級後壞掉。

### Player

- 玩家類型設為 `EntityType.PLAYER`。
- 啟用 Cocos Physics，並取得 `RigidBody` 控制移動。
- 支援左右移動、跳躍、左右翻面。
- 支援空中 fast fall、水中 boost、水中緩慢下沉、drag / control 參數。
- 支援 `PlayerIdle`、`PlayerRun`、`PlayerAttack`、`PlayerHurt`、`PlayerDie` 動畫切換。
- 攻擊時會啟用 `AttackHitbox` 子節點上的 `CombatHitbox`。
- 攻擊、受傷、進入水域會觸發 `AudioManager` / `EffectsManager` feedback。
- `a05605d` 後 Gameplay key / mouse / wheel 有部分回到 PlayerController 直接處理；Dialogue / Merchant / Inventory / Crafting 仍由 PlayerController 協調流程。
- 受傷時發送 `PLAYER_HP_CHANGED`，死亡動畫結束後發送 `PLAYER_DIED`，讓 `GameManager` 結算後載入 `GameOver` 場景。
- `PlayerGun.ts`：可掛在 Player 或 Player 子節點，監聽滑鼠右鍵，從 muzzle 對滑鼠世界座標發射玩家子彈；左鍵近戰不變。
- `PlayerGun.ts`：會使用 `ProjectilePoolManager`，缺 manager 時 runtime 補在 Player 上；缺 projectile prefab 時只 warn。
- `PlayerToolMode.ts`：定義 `Gun / Jetpack / Grapple` 三種工具模式。
- `PlayerToolController.ts`：集中處理 `1/2/3`、Jetpack fuel、Grapple raycast / pull、工具 label / fuel bar 事件。
- `PlayerToolController.ts` 會呼叫 `PlayerGun.setDirectRightMouseInput(false)`，避免工具模式右鍵和 PlayerGun 自己的右鍵監聽重複射擊。
- 背包或商人 UI 開啟時，玩家移動 / 攻擊流程會暫停。
- 可掃描場景中的 `MerchantNPC` 與 `VehicleInteractable`，靠近時透過 `DialogueUIController` 顯示 `Press F to Talk` / 車船 prompt；商人優先於載具。
- `setExternalControlLocked(true, "vehicle")` 會擋玩家移動、攻擊、背包、合成與工具模式輸入；車船上載具時會用這個鎖。
- 進入 `OceanArea` 後切換水中狀態：降低 gravityScale、水平速度改用 `oceanMoveSpeed`，垂直方向改用 `oceanVerticalSpeed`，沒有輸入時會以 `oceanSinkSpeed` 慢慢下沉。
- 死亡載入 `GameOver` 前有 `gameOverTransitionPending`，避免重複切場景。
- Main Camera 目前會跟隨玩家移動到水域；商人生成依玩家世界座標，所以玩家在水域時商人會生成在附近。
- PlayerController 已停止 runtime setup `CameraFollow`；Main Camera 跟隨統一由手動掛載的 `CameraRig.ts` 控制，避免雙重位移。

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
- 命中目標時發送 `COMBAT_HIT_CONFIRMED` 並優先呼叫 `receiveAttack()`；命中實體地形或生命週期結束後預設 destroy。
- `setPoolReturnHandler()` 可讓玩家槍子彈在命中 / 撞地 / lifetime 結束時回到 `cc.NodePool`，不 destroy。
- `visualNode` 可跟隨速度方向旋轉；若 prefab 有 `CoconutSprite` / `FireEffect`，會自動整理成 `VisualRoot`。

### Player Gun / Projectile Pool

- `ProjectilePoolManager.ts`：玩家槍專用 `cc.NodePool`，支援 `projectilePrefab`、`projectileParent`、`prewarmCount`。
- `spawn()` 會從 pool 取子彈或 instantiate fallback，設定 world position 後呼叫 `CombatProjectile.launch()`。
- `recycleProjectile()` 會呼叫 `CombatProjectile.prepareForPool()`，重設 velocity、collider、hitTargets，再 `pool.put(node)`。
- 目前第一版只套玩家右鍵槍，不改 NPC ranged projectile / 掉落物。

### Inventory / Items

- `InventoryManager.ts`：背包 singleton，支援 `addItem()`、`removeItem()`、`getItemCount()`、`hasItem()`、`getItems()`。
- `InventoryManager.ts`：新增 `getSaveSnapshot()`、`setItemsFromSave()`、`clear()`，可供 `SaveService` 存讀檔。
- `addItem()` 現在簽名是 `addItem(id, count)`，會從 `ItemData.ts` 找道具名稱與描述。
- 背包最大格數目前為 `40`。
- 背包變更時發送 `cc.systemEvent.emit("INVENTORY_CHANGED")`。
- `InventoryUIController.ts`：監聽 `INVENTORY_CHANGED`，將道具數量顯示到 grid slot 的 `Label`，並支援 coconut / apple / ore icon。
- `InventoryUIController.ts`：新增 `mainCameraNode`、`followMainCamera`、`clampToCameraView` 等欄位，背包開啟時可跟隨 Main Camera 並限制在鏡頭可見範圍。
- `InventoryUIController.ts`：右鍵格子可開 action menu，支援 Use / Delete；目前 Use 只是扣道具，尚未套用回血效果。
- `ItemData.ts`：目前定義 `coconut`、`potion`、`apple`、`ore`、`wood`、多種水果 / 堅果，以及 smallore 礦物資料與 icon path。
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
- `MerchantShopUIController.ts`：支援開關商店、顯示 coconut 數量、商品列表、價格、庫存、玩家持有數、購買數量、購買按鈕狀態；新增跟 Main Camera 與 clamp 邏輯，OceanArea 交易時應保持在鏡頭可見範圍。

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
- 可選掛 `NPCPathAgent.ts`：有 `PathGraph` 時先沿 waypoint 追玩家；找不到 graph / path 時 fallback 原本直接追擊。
- `NPCPathAgent` 碰到帶 `Portal` 的 waypoint 會嘗試傳送，讓敵人能走 portal link 後繼續追玩家。
- `MiniBossAI.ts`：傳送法師展示 Boss，依 HP ratio 進 phase 2，定時 teleport 到手動拖的 points，定時 summon minion prefab，Boss 死亡後發送 `BOSS_DEFEATED`。
- `BossArenaController.ts`：掛在 arena sensor，玩家進入後啟動 Boss；Boss 死亡後可關 gate、開 reward、加 clear score。
- `EnemyRespawner.ts`：玩家距離刷新。玩家進 activation range 才生成，離 despawn range 可清掉，維持 `maxAlive`。
- 支援方向動畫：`idle_front/right/back`、`move_*`、`attack_*`、`damaged_*`，死亡使用 `death`。
- 支援 NPC HP bar 更新、死亡隱藏血條、發送 `NPC_DIED`。
- NPC 目前功能重點：Dynamic RigidBody、hurtbox / attack hitbox、HP bar、jump / stuck 越障、受傷 / 死亡動畫與近遠程攻擊。

### Resource / Drop / Food

- `ResourceObject.ts`：資源基底，處理滑鼠左鍵互動、互動距離、每幾下觸發一次掉落、共用 prefab spawn 工具。
- `AppleTree.ts`：蘋果樹 / 灌木子類，支援 `maxApples`、`regenInterval`、蘋果掉落與 depleted 外觀。
- `OreRock.ts`：礦石子類，支援 weighted drop table，掉落後 destroy。
- `Orebase.ts`：礦物掉落基底，繼承 `DropItem`，支援落地、提示、撿起、加入背包、`ITEM_COLLECTED`、collect 音效 / 特效。
- `Oredrops/*.ts`：smallore 礦物子類，包含 ambersphere、amethyst、calcitecluster、citrinegeode、coallump、cobaltore、coppercluster、firestone、fossilizedshell、icecrystal、ironore、jadeorb、lapislazuli、manapearl、meteoritechunk、mossagate、radslimechunk、rawgold、rosequartz、rubycrystal、silverbar、starmetalshard、tealprism、voidnugget。
- `DropItem.ts`：掉落物會先飛出，碰到 ground / Ground / tempFloor 後停下；玩家靠近後吸附，收集成功會加入背包、發送 `ITEM_COLLECTED`、播放 collect SFX / particle 並 destroy。
- `FoodBase.ts`：位於 `Entity/Resources/food/`，繼承 `DropItem`，食物掉落物可飛出、吸附玩家、收集時加入 `InventoryManager`。
- `FoodBase.eat()` 會先找 `PlayerStats`，沒有時改用 `PlayerController.heal()`，並發送 HP 更新與 heal feedback。
- 水果 / 堅果腳本已大量補齊：apple、avacado、blueberries、cherry、coconut、durian、grapes、greenapple、kiwi、mulberry、orange、peach、pear、pineapple、plum、redberries、strawberry、watermelonslice、acorn、cashew、chestnut、coffeebean、guazi、peanuts、pistachio。
- `coconut.ts`：目前是 `FoodBase` 子類，`itemName = "coconut"`，同時作為商人交易測試貨幣。

### Map / Scene

- `AutoMapGenerator.ts`：掛在 `Canvas/platform/auto generate`，用 Inspector 拖入 `assets/Prefabs/Map/` 的 Rockleft、Rockright、Rockplatform3、Rockplatform4、Rockplatform5；`manualTriggerOnly` 預設開啟，所以開場 / 讀檔只套參數不生成，按 `G` 才開始逐塊生成。
- AutoMapGenerator 預設直接在 local `x = -5000 ~ 0`、`y = -2000 ~ 0` 生成，無整體偏移；只清除 `AutoRock_` 開頭的 runtime 節點，不碰手動擺的 rock。
- 生成策略：先拼出 `FlatRun / RampUp / RampDown / Hill / Valley` 平台組合，再把整組放進地圖；pattern 內部接近連通，pattern 之間保留跳躍距離。
- `beginTimedGeneration()` 會預先算出 placements，呼叫 `CameraRig.frameWorldRect()` 用 `cameraFrameDuration = 1.6` 秒看完整生成範圍，等 `startAfterCameraDelay = 0.5` 秒後，每 `generationStepInterval = 0.25` 秒 spawn 一塊地形、觸發小幅 camera shake，並 emit `MAP_GENERATION_PROGRESS(current, total)`；生成中重按 `G` 預設不重入。
- 逐塊生成完成後會先等 `returnAfterGenerationDelay = 1.0` 秒，再呼叫 `CameraRig.returnToTarget()` 回到玩家；期間玩家仍可移動。
- AutoMapGenerator 每次生成後會把 `seed`、範圍、pattern 數、斜坡數、rock 數與主要參數寫入 `SaveService.currentMap` 並 emit `MAP_GENERATION_UPDATED`；存檔只保存這份 map state，不保存 runtime 生成出的所有節點。
- 讀檔觸發 `SAVE_LOADED` 時，AutoMapGenerator 只套用 `saveData.mapState` 的 seed / range / settings 並更新 current map；不會立刻生成，等玩家按 `G` 後才用同一組參數生成。
- `minPatternCount/maxPatternCount` 控制平台組數，`slopePatternChance` 控制斜坡組比例，`minSlopePatternCount` 保證至少幾組含 Rockleft / Rockright；`scatterCount` 只補少量散點。
- Rock offset：Rockplatform3/4/5 用頂面當地面，左接點 local `x = -384`；Rockleft 是左下到右上，Rockright 是左上到右下，斜坡用 bounding box 避免互相卡住。
- `OceanArea.ts`：掛在水域 sensor collider 上；目前用 collider bounds 每幀判斷玩家是否在水域內，進入時呼叫 `enterOceanArea()`，離開時呼叫 `exitOceanArea()`。
- `OceanArea.ts`：進出水域時會 emit `PLAYER_WATER_STATE_CHANGED(isInWater, oceanNode)`，給 `AudioManager` crossfade BGM 與 `ThemeManager` 可選色調切換使用。
- `OceanLayerOrder.ts`：固定 OceanArea 子節點 zIndex / active / opacity，避免水域視覺層被蓋掉。
- `OceanPrefabBuilder.ts`：可在 onLoad 清除舊 `GeneratedContent`，避免 ocean prefab 舊生成內容殘留。
- `Portal.ts`：同場景成對傳送。兩個 portal 設同一個 `pairId`，玩家 / NPC 碰到 sensor 後傳到另一端 `exitOffset`，並用 cooldown 避免來回抖動。
- `BouncePad.ts`：sensor 觸發後依節點 local up 或 local right 反彈 Player / NPC；預設 local up，所以旋轉節點就能改方向。
- `PathNode.ts`：手動 waypoint，可用 `neighbors` 連線；若節點旁有 portal，可拖 `Portal` 當 link。
- `PathGraph.ts`：收集子節點 `PathNode`，用簡單 A* 找 waypoint path，portal pair 會視為鄰接節點。
- `MenuScene.ts`：選單場景用腳本，支援開始遊戲、讀取存檔進遊戲、註冊、登入、登出、設定面板、排行榜、靜音與 fade。

### Vehicle

- `VehicleInteractable.ts`：車 / 船共用靠近互動元件，提供 `interactionDistance`、`promptText`、`canInteract(player)`。
- `VehicleController.ts`：處理上下載具、push `InputContext.Vehicle`、鎖住 PlayerController、把 Player 節點同步到 `seatNode`，離開時放到 `exitOffsetX/Y`。
- `CarController.ts`：繼承 `VehicleController`，上車後 A/D 加速、Space 煞車。
- `BoatController.ts`：繼承 `VehicleController`，上船後 A/D 左右、W/S 柔和上下、Space 小加速。
- 載具中 Player 節點仍跟著 seat 移動，所以 `CameraRig.target = Player` 時鏡頭會跟著車 / 船；Player 可隱藏且 collider 可暫時關閉，離開載具後還原。
- `GameOverScene.ts`：結算場景腳本，讀取 `SaveService.getLastRun()`，顯示玩家、Score、EXP，支援 Retry、Main Menu、Submit Score。

### UI

- `UIManager.ts`：監聽 `PLAYER_HP_CHANGED`、`PLAYER_EXP_CHANGED`、`SCORE_CHANGED` 更新 HP / EXP / Score HUD。
- `InventoryUIController.ts`：背包 grid UI。
- `DialogueUIController.ts`：商人提示與對話選項 UI；已能跟隨商人並 clamp 到 Main Camera 可見區域。
- `CraftingUIController.ts`：合成 UI 新增跟 Main Camera / clamp 邏輯，並可配合 InventoryUI 一起定位。
- `MerchantShopUIController.ts`：商店 UI 與購買流程；已新增跟 Main Camera / clamp 邏輯，需實測 OceanArea 交易。

## 主要事件流程

```text
NPC_AI RANGED
  -> startAttack()
  -> schedule releaseRangedProjectile()
  -> instantiate projectile prefab
  -> CombatProjectile.launch()
  -> receiveAttack() / terrain hit / lifetime destroy or recycle
```

```text
OceanArea.onBeginContact()
  -> bounds / trigger detect player
  -> PlayerController.enterOceanArea()
  -> EventCenter.emit(PLAYER_WATER_STATE_CHANGED, true)
  -> AudioManager.crossFadeToBgm(WATER)
  -> ocean movement update
  -> bounds detect exit
  -> PlayerController.exitOceanArea()
  -> EventCenter.emit(PLAYER_WATER_STATE_CHANGED, false)
  -> AudioManager.crossFadeToBgm(LAND)
```

```text
Player F
  -> find nearest MerchantNPC first
  -> if no merchant, find nearest VehicleInteractable
  -> VehicleController.tryMount(player)
  -> PlayerController.setExternalControlLocked(true, "vehicle")
  -> InputManager.pushContext(Vehicle)
  -> CarController / BoatController consumes movement input
  -> F again -> VehicleController.dismount()
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
Orebase.collect()
  -> InventoryManager.addItem(smallore item id, 1)
  -> EventCenter.emit(ITEM_COLLECTED)
  -> AudioManager / EffectsManager collect feedback
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
  -> clamp dialogue to Main Camera visible area
  -> MerchantShopUIController.open()
  -> follow Main Camera and clamp panel to camera bounds
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
PlayerGun right click
  -> PlayerGun.fireAtWorldPosition()
  -> ProjectilePoolManager.spawn()
  -> CombatProjectile.launch()
  -> hit / terrain / lifetime
  -> CombatProjectile.finish()
  -> ProjectilePoolManager.recycleProjectile()
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

```text
Player tool mode
  -> 1 / 2 / 3 set PlayerToolMode
  -> Gun: right click -> PlayerGun.fireAtWorldPosition()
  -> Jetpack: hold Space -> consume fuel -> upward velocity
  -> Grapple: right click raycast terrain -> pull player -> release detach
```

```text
Damage numbers
  -> CombatHitbox / CombatProjectile emit COMBAT_HIT_CONFIRMED
  -> DamageNumberManager.showDamage()
  -> runtime Label floats upward
  -> EffectsManager DAMAGE_SPARK
```

```text
Boss arena
  -> BossArenaController sensor detects Player
  -> MiniBossAI.activateBoss()
  -> phase check by hp ratio
  -> teleport / summon minions
  -> NPC_DIED on boss
  -> BOSS_DEFEATED
  -> gate off / reward on / score reward
```

```text
EnemyRespawner
  -> check player distance
  -> enter activation range
  -> instantiate enemy prefab under spawnParent
  -> set NPC_AI targetPlayer
  -> leave despawn range
  -> optional despawn alive enemies
```

```text
Realtime fake multiplayer snapshot
  -> RealtimeStateReporter.update()
  -> read Player position / HP, GameManager score / exp, Inventory snapshot
  -> attach SaveService clientId / sessionId plus inventory counts / player status
  -> SaveService.upsertRealtimePlayerState()
  -> EventCenter.emit(REALTIME_STATE_UPDATED)
```

```text
Fake backend debug snapshot
  -> SaveService.getBackendSnapshot()
  -> users: username / createdAt / lastLoginAt / lastLogoutAt / loginCount / hasSave
  -> saves: score / exp / HP / inventorySlotCount / inventoryTotalCount / mapSeed / updatedAt
  -> realtimePlayers: clientId / sessionId / scene / position / HP / score / exp / status
  -> currentMap: seed / bounds / patternCount / slopePatternCount / rockCount
  -> leaderboard / lastRun / storageKeys
```

```text
Auto map save/load
  -> AutoMapGenerator.regenerate()
  -> SaveService.setCurrentMapGenerationState(seed + generator settings + counts)
  -> GameManager.createSaveData() attaches SaveService.getCurrentMapGenerationState()
  -> SaveService.saveGame()
  -> load save
  -> EventCenter.emit(SAVE_LOADED, saveData)
  -> AutoMapGenerator.applyMapGenerationState(saveData.mapState)
  -> wait for G
  -> generate same seed / range / settings
```

```text
Auto map timed generation
  -> G key
  -> InputAction.GenerateMap
  -> GameManager.beginAutoMapGeneration()
  -> AutoMapGenerator.beginTimedGeneration()
  -> CameraRig.frameWorldRect(generation range)
  -> wait cameraFrameDuration + startAfterCameraDelay
  -> spawn one AutoRock_* every generationStepInterval
  -> CameraRig.addShake(spawnShakeDuration, spawnShakeAmplitude)
  -> EventCenter.emit(MAP_GENERATION_PROGRESS, current, total)
  -> SaveService.setCurrentMapGenerationState()
  -> EventCenter.emit(MAP_GENERATION_UPDATED, state)
  -> wait returnAfterGenerationDelay
  -> CameraRig.returnToTarget()
```

```text
Portal / enemy pathing
  -> NPC_AI.update()
  -> NPCPathAgent.getSteeringDirection()
  -> PathGraph.findPath()
  -> PathNode.neighbors plus Portal paired node
  -> NPC_AI.moveTowardTarget()
  -> Portal.teleportActor() when close to portal waypoint
```

## Cocos Inspector 設定

- `GameManager.ts`：接 `playerNode`、`cameraRig`、`autoMapGenerator`、`pausePanel`、`fadeOverlay`；`cameraRig` 拖 Main Camera 上的 `CameraRig.ts` component，`autoMapGenerator` 拖 `Canvas/platform/auto generate` 上的 AutoMapGenerator。Pause panel 按鈕綁 `resumeGame()`、`restartGame()`、`backToMenu()`、`saveCurrentGame()`。
- `CameraRig.ts`：掛在 Main Camera；`target` 可直接拖 Player，或由 `GameManager.playerNode` 在 onLoad 指派。不要依賴 `Canvas/Player`、`Canvas/Main Camera` 這種路徑查找。`+/-` 會調整 `baseZoom`，可用 `minZoomRatio/maxZoomRatio/zoomStep` 限制縮放範圍；`overviewPadding` / `overviewMinZoomRatio` 控制自動生成 overview 拉遠程度。overview 期間也會套用 `addShake()`，所以地圖逐塊生成可看到震動。
- `CameraFollow.ts`：legacy 備用腳本，預設 `useXLimit/useYLimit` 關閉；目前不建議掛在 Main Camera，避免和 `CameraRig.ts` 同時控制相機。
- `PlayerController.ts`：接 `craftingUI`，並確認 `inventoryUI`、`dialogueUI`、`merchantShopUI` 仍有綁定。
- `UIManager.ts`：接 `hpBar`、`expLabel`、`scoreLabel`。
- `MenuScene.ts`：接 main / login / settings / leaderboard panels、username / password EditBox、status / current user / leaderboard labels、fadeOverlay。
- `GameOverScene.ts`：接 title / username / score / exp / status labels、fadeOverlay；按鈕綁 `retry()`、`goToMainMenu()`、`submitScore()`。
- `AudioManager.ts`：接 `sceneBgm`、可選 `waterBgm` 與 attack / hit / collect / buy / heal / skill 六個 SFX clip；`bgmFadeDuration` 控制水域 BGM 淡入淡出。
- `ThemeManager.ts`：可選掛在 Game 或 UI Root；接 `tintOverlay` / `tintTargets`，`autoApplyOceanTheme` 勾起來後會跟 OceanArea 切 ocean tint。
- `EffectsManager.ts`：接 `effectRoot` 與 `particleSpriteFrame`。
- `PlayerGun.ts`：掛在 Player 或 Player 子節點；接 `projectilePrefab`，可接 `muzzleNode` 與 `projectileParent`。子彈 prefab 必須有 `CombatProjectile`、`RigidBody`、`PhysicsCollider` sensor。
- `ProjectilePoolManager.ts`：可掛在 Player 或 Bullet_Layer；接同一個 projectile prefab，`prewarmCount` 建議 8-16。
- `PlayerToolController.ts`：掛 Player；接 `playerGun`，可選接 `toolLabel`、`jetpackFuelBar`、`jetpackFlameRoot`、`grappleLineRoot`。
- 車節點：掛 `VehicleInteractable.ts` + `CarController.ts`，接 `seatNode`，設定 `promptText = Press F to Drive`，並調 `exitOffsetX/Y`。
- 船節點：掛 `VehicleInteractable.ts` + `BoatController.ts`，接 `seatNode`，設定 `promptText = Press F to Board`，並調速度 / boost 參數。
- `DamageNumberManager.ts`：可掛 GameManager 或 UI Root；`numberRoot` 建議拖 UI Root，沒掛時 GameManager runtime 補。
- `MiniBossAI.ts`：Boss prefab 同節點建議已有 `NPC_AI`；接 `npcAI`、`targetPlayer`、`teleportPoints`、`minionPrefabs`、`minionParent`。
- `BossArenaController.ts`：掛 arena sensor；接 `boss` / `bossNode`、`playerNode`，可選接 `gateNode`、`clearRewardNode`。
- `EnemyRespawner.ts`：掛刷怪點；接 `enemyPrefabs`、`playerNode`、`spawnParent`，調 activation / despawn range。
- `Portal.ts`：兩個 Portal 節點設同一個 `pairId`，PhysicsCollider 要是 sensor；`exitOffset` 控制傳出後離 portal 多遠。
- `BouncePad.ts`：節點掛 sensor collider，旋轉節點即可改變 local up 反彈方向；常用 `bounceSpeed` 約 600-900。
- `PathGraph.ts`：建議放 `World Root/PathGraph`；PathNode 子節點用 `neighbors` 手動連線，入口 / 出口節點可拖 `Portal`。
- `NPCPathAgent.ts`：掛在需要升級尋路的 NPC 上，`pathGraph` 可拖 PathGraph；不拖會找 `PathGraph.instance`。
- `RealtimeStateReporter.ts`：可掛 GameManager 節點並拖 `playerNode`；若沒掛，`GameManager` 會 runtime 補一個。`debugLog` 可看每次寫入的位置；完整假後端資料可在程式中呼叫 `SaveService.getBackendSnapshot()` 檢查。
- `DialogueUIController`、`InventoryUIController`、`MerchantShopUIController`、`CraftingUIController` 若要跟鏡頭，接 `mainCameraNode`，或確認 fallback 能找到 Main Camera。
- DropOre prefab 需掛對應 `Orebase` 子類，item id 要對上 `ItemData.ts` 的 smallore key。

## 目前注意事項

- `BaseEntity.takeDamage()` 已 clamp HP，並提供 `heal()`；Player / FoodBase 仍需實機測試回血 UI。
- `PlayerController` 目前仍有 `T` 測試鍵，正式版應移除或包成 debug 開關。
- `R` 快捷鍵已移除；重玩只保留 Pause / GameOver UI button 呼叫 `restartGame()` / `retry()`。
- 右鍵槍目前用 browser canvas / Canvas mouse event 監聽；如果 Cocos 預覽器右鍵選單干擾，`PlayerGun` 會嘗試 prevent context menu。
- 若 Player 同時掛 `PlayerToolController` 和 `PlayerGun`，`PlayerToolController` 會關掉 PlayerGun 的直接右鍵輸入，由工具模式統一分派。
- Jetpack 模式按 Space 會和原本跳躍共存：按下瞬間仍可能先跳，持續按住才由 Jetpack 加速上升。
- Grapple 第一版只鉤非 sensor 實體地形；不鉤敵人、掉落物、sensor trigger 或 UI。
- Boss 本身仍依賴 `NPC_AI` 的受傷 / 死亡 / 遠程攻擊；`MiniBossAI` 負責 phase、傳送與召喚。
- `PathGraph` 是手動 waypoint，不是 tilemap grid A*；PathNode 沒連好時 NPC 會 fallback 原本直接追擊。
- Portal 只傳 Player / NPC，不傳 projectile；如果要子彈也能過傳送門，要另外接 `CombatProjectile` actor 判斷。
- `RealtimeStateReporter` 是 localStorage 假多人資料，不會真的顯示其他玩家；目前只準備資料介面。`clientId` 代表同一瀏覽器 / 裝置，`sessionId` 代表本次執行，之後可用來判斷同帳號多開或過期玩家。
- `GameManager.onGameOver()` 已寫入 last run / save / leaderboard；GameOver 畫面仍需手動接 `GameOverScene` labels/buttons。
- `ResourceObject.findPlayer()` 目前固定找 `Canvas/Player`，場景節點路徑如果不同要調整。
- Menu / Pause / GameOver / Audio / Effects 都是腳本已補，Cocos Editor 節點與 Inspector 欄位需照 `PLAN.md` 手動設定。
- 遠程攻擊是否能打到玩家，取決於 SkeletonMage 的 `projectilePrefab`、`projectileSpawnNode`、`projectileParent`、collider sensor 與 contact listener。
- OceanArea 需要 `PhysicsBoxCollider` sensor，且 Player collider / rigidbody 要能觸發 contact。
- Camera follow 以 `CameraRig` 為主；`CameraFollow` 保留為 legacy 備用，不應再自動或手動掛到 Main Camera。
- MerchantShop / Inventory / Crafting / Dialogue UI 已有跟 Main Camera / clamp 邏輯，但仍需在 OceanArea 實測。
- `ItemData.iconPath` 目前多數已改為 resources 相對路徑，但仍要實測大小寫與檔名，例如 `greenApple`、`coffeebean`、`guazi` / `gauzi.ts`、smallore keys。

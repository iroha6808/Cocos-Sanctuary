# Cocos Sanctuary 專案架構

> 更新日期：2026-06-11
> 引擎：Cocos Creator 2.4.8
> 目前重點：Final Project 流程 / 技術配分、玩家 / NPC 戰鬥、旅行商人動畫、水域控制、車船互動、potions、Rocksets、資源掉落、背包與 UI。

## 目錄

- [目錄總覽](#目錄總覽)
- [目前 Scene 建議結構](#目前-scene-建議結構)
- [Core](#core)
- [Attack](#attack)
- [Player](#player)
- [NPC](#npc)
- [Data](#data)
- [Entity / Resources / Food](#entity--resources--food)
- [Map / Scene](#map--scene)
- [UI](#ui)
- [Vehicle](#vehicle)
- [Prefab / Inspector 重點](#prefab--inspector-重點)
- [主要流程](#主要流程)
- [後續 TODO](#後續-todo)

## 目錄總覽

```text
assets/
  Scenes/
    Game.fire
    MenuScene.fire
    GameOver.fire

  Prefabs/
    Player.prefab
    Map/
      OceanArea.prefab
    NPCs/
      Slime.prefab
      SkeletonMage.prefab
      TravelingMerchant.prefab
    Projectiles/
      BurningCoconutProjectile.prefab
    Resources/
      Rocksets/
        Rockleft.prefab ... Rockright.prefab
      DropOre/
        Amber Sphere.prefab ... Raw Gold.prefab
      potions/
        Blue Potion.prefab
        Red Potion.prefab
        Yellow Potion.prefab
      Tree.prefab
      Ore.prefab
      FruitDrop.prefab
      OreDrop.prefab
      coconut.prefab
      Trees/
        applebush.prefab
      fruits/
        apple.prefab ... watermelonslice.prefab
      nuts/
        acorn.prefab ... pistachio.prefab

  Scripts/
    Attack/
      CombatHitbox.ts
      CombatProjectile.ts
      ProjectilePoolManager.ts
    Camera/
      CameraFollow.ts
    Core/
      AudioManager.ts
      BaseEntity.ts
      CameraRig.ts
      Constants.ts
      DamageNumberManager.ts
      EffectsManager.ts
      EventCenter.ts
      GameManager.ts
      HitFeelManager.ts
      RealtimeStateReporter.ts
      SaveService.ts
      ThemeManager.ts
    Data/
      ItemData.ts
      MerchantPool.ts
    Entity/
      Resources/
        ResourceObject.ts
        DropItem.ts
        Ore/
          orerock.ts
          orebase.ts
          Oredrops/
            ambersphere.ts ... voidnugget.ts
        TreesAndBushes/
          appletree.ts
        food/
          FoodBase.ts
          potions/
            bluepotion.ts
            redpotion.ts
            yellowpotion.ts
          fruits/
            apple.ts
            avacado.ts
            blueberries.ts
            cherry.ts
            coconut.ts
            durian.ts ... watermelonslice.ts
          nuts/
            acorn.ts
            cashew.ts ... pistachio.ts
    Map/
      AutoMapGenerator.ts
      NewScript - 001.ts
      BouncePad.ts
      OceanArea.ts
      OceanLayerOrder.ts
      OceanPrefabBuilder.ts
      PathGraph.ts
      PathNode.ts
      Portal.ts
    NPC/
      NPC_AI.ts
      NPCPathAgent.ts
      MiniBossAI.ts
      BossArenaController.ts
      EnemyRespawner.ts
      MerchantNPC.ts
      MerchantSpawner.ts
      NPCDialogue.ts
    Player/
      PlayerGun.ts
      PlayerToolController.ts
      PlayerToolMode.ts
      PlayerController.ts
      InventoryManager.ts
      CollectibleItem.ts
    UI/
      UIManager.ts
      InventoryUIController.ts
      DialogueUIController.ts
      MerchantShopUIController.ts
    Vehicle/
      BoatController.ts
      CarController.ts
      VehicleController.ts
      VehicleInteractable.ts
    Utils/
      NewScript - 002.ts
    Scene/
      GameOverScene.ts
      MenuScene.ts

  Textures/
    Buttons/
    effects/fire effects/
    npcs/sprites/characters/

  resources/
    npcs/
      sprites/
        characters/
          merchant/
            Idle1/
              1.png ... 4.png
              idle_rigjt.anim
            Speak1/
              1.png ... 4.png
              talk_right.anim
    potions/
      bluepotion.png
      redpotion.png
      yellowpotion.png
      potions.png
    100 FOOD ASSETS/
      Assets/food/food/
        fruits1/
        fruits2/
        nuts/
    Purple Planet - Platformer Tileset/
    smallore/
      ambersphere.png ... voidnugget.png

local plans/
  merchant.todo
  step_1.md ... step_6.md
  note.md
```

## 目前 Game.fire Canvas 結構

```text
Canvas
  Main Camera
    Background
  Core Controllers
  World Root
  UI Root
    ExpLabel
    HpBar
      bar
    FloatingDialogueRoot
      PromptBubble / PromptLabel
      DialogueBubble / DialogueLabel / OptionTrade / OptionChat / OptionLeave
    MerchantShopPanel
      CurrencyLabel
      ItemList
        Item0
        Item1
        Item2
      ItemNameLabel
      DescriptionLabel
      PriceLabel
      StockLabel
      PlayerOwnedLabel
      BuyAmountLabel
      BuyButton
      AmountMinusButton
      AmountPlusButton
    CraftingUIHost
      CraftingUIRoot
  Player
    Sprite_Body
    AttackHitbox
  Orerock
  applebush
  Meteorite Chunk
  NPC
    Slime
    Boar
    SkeletonMage
  coconuts
  platform
    auto generate
      AutoRock_* runtime nodes
    Rockleft / Rockright / Rockplatform3 / 4 / 5 copies
```

建議新增但目前需手動放置的節點：`AudioManager`、`EffectsManager`、`DamageNumberManager`、`MerchantSpawner`、`RealtimeStateReporter`、`Car`、`Boat`、`PathGraph`、`Portal`、`BouncePad`。

## Core

- `BaseEntity.ts`
  - 所有可受傷 entity 的基底。
  - 提供 `type`、`maxHp`、`currentHp`、`takeDamage()`、`heal()`、`onDamaged()`、`die()`。
- `Constants.ts`
  - `EntityType`：`PLAYER`、`NPC_PEACE`、`NPC_NEUTRAL`、`NPC_HOSTILE`。
  - `GameEvent`：玩家 HP/EXP、Score、Pause、Save、Leaderboard、死亡、NPC 死亡、撿取、交易等事件名稱。
- `EventCenter.ts`
  - 全域事件中心，提供 `on()`、`emit()`、`off()`、`clear()`。
- `SaveService.ts`
  - localStorage 假後端，提供註冊、登入、登出、每帳號存讀檔、排行榜、最後一局結果。
  - fake multiplayer realtime snapshot：`upsertRealtimePlayerState()`、`getRealtimePlayers()`、`clearStaleRealtimePlayers()`。
- `AudioManager.ts`
  - land / water BGM 雙 channel crossfade；監聽 `PLAYER_WATER_STATE_CHANGED`。
  - 六種 SFX：attack、hit、collect、buy、heal、skill。
- `ThemeManager.ts`
  - 主題 / 色調切換雛形，可註冊 tint targets、控制 overlay tint，替後續 biome / 主題換色準備。
- `EffectsManager.ts`
  - runtime particle 特效：hit、collect、heal、fire、water、gun muzzle、damage spark、boss teleport、boss summon、jetpack flame、grapple attach。
- `DamageNumberManager.ts`
  - 監聽 `COMBAT_HIT_CONFIRMED`，用 pooled runtime Label 顯示上飄傷害數字。
  - GameManager 會 runtime 補一個；也可手動掛到 UI Root 並指定 `numberRoot`。
- `CameraRig.ts`
  - Main Camera runtime 依距離指數函數加速跟隨玩家，支援 look-ahead、shake、impulse、zoom kick、`+/-` 手動 zoom。
- `CameraFollow.ts`
  - 簡單 smooth follow，支援 X/Y 跟隨、offset、bounds；和 `CameraRig` 二選一使用。
- `HitFeelManager.ts`
  - 監聽 `COMBAT_HIT_CONFIRMED`，做中等 hit stop、隨機方向小幅鏡頭打擊回饋與 sprite 閃白。
- `RealtimeStateReporter.ts`
  - 定期把玩家名稱、場景、位置、HP、Score、EXP、背包摘要寫入 `SaveService` localStorage。
  - 目前是多人功能資料介面，不會顯示其他玩家。
- `GameManager.ts`
  - 遊戲初始化、PhysicsManager、CameraRig / HitFeelManager runtime 建立、Score / EXP、Pause / Resume、Retry、回主畫面、存讀檔、死亡結算。
  - `pausePanel` 是暫停 UI 容器；`fadeOverlay` 是 Retry / Main Menu 切場景前的淡出黑幕。

## Attack

- `CombatHitbox.ts`
  - 玩家與 NPC 共用的近戰 hitbox。
  - 透過 `ownerFaction`、`canHitPlayer`、`canHitPeaceNpc`、`canHitNeutralNpc`、`canHitHostileNpc` 判斷陣營與可攻擊對象。
  - 啟用時設定位置與傷害，時間到自動關閉。
  - `activate()` 可覆寫 active duration；duration <= 0 時可保持開啟直到手動關閉。
  - 命中後優先呼叫目標的 `receiveAttack()`，沒有則呼叫 `takeDamage()`。
  - 命中時呼叫 `AudioManager` / `EffectsManager` 播放 hit feedback，並 emit `COMBAT_HIT_CONFIRMED`。
  - 已避免向上搜尋 parent 時對 Scene 呼叫 `getComponent()`。
- `CombatProjectile.ts`
  - 遠程攻擊共用投射物，使用 Dynamic RigidBody 與 sensor collider。
  - 接收 owner、陣營、初速度、傷害與擊退，沿用 `CombatHitInfo` 傳遞受傷資料。
  - 排除攻擊者與同陣營、每個目標只命中一次，命中實體、地形或超時後預設銷毀；玩家槍子彈可回 pool。
  - 發射與命中時呼叫音效 / fire particle，命中時 emit `COMBAT_HIT_CONFIRMED`。
  - 可被 `ProjectilePoolManager` 設定 return handler，玩家槍子彈命中 / 撞地 / lifetime 結束後回 pool。
  - `VisualRoot` 會依速度方向旋轉；若 prefab 只有 `CoconutSprite` 與 `FireEffect`，載入時會自動建立視覺根節點。
- `ProjectilePoolManager.ts`
  - 玩家槍專用 `cc.NodePool`。
  - 支援 prefab、parent、prewarm count；目前不改 NPC projectile / drops。

## Player

- `PlayerController.ts`
  - A/D 移動、Space 跳躍、滑鼠左鍵攻擊。
  - `a05605d` 後部分 gameplay key / mouse / wheel 由 PlayerController 直接處理；全域 action / pause 仍要和 `InputManager` 對齊。
  - B 開關背包。
  - T 測試用：加入 `coconut x10`。
  - F 旅行商人互動：靠近 prompt、對話選項、開商店、關商店。
  - 若附近沒有商人，F 會檢查 `VehicleInteractable`，可上車 / 上船。
  - 滾輪切換對話選項或商店商品；商店中可用方向鍵與 Enter 測購買。
  - 進入 OceanArea 後降低重力，W / Up / Space 上游，S / Down 下潛，Space 可水中 boost，離開後還原重力。
  - 空中 S / Down 可 fast fall；斜坡 / 平台跳躍用 `isGrounded()` 修正。
  - 攻擊、受傷、水域進入會呼叫 `AudioManager` / `EffectsManager`。
  - 持有 `DialogueUIController` 與 `MerchantShopUIController` reference。
- `PlayerGun.ts`
  - 掛 Player 或 Player 子節點，滑鼠右鍵發射玩家子彈。
  - 缺 `ProjectilePoolManager` 時會 runtime 補在 Player 上；缺 projectile prefab 時只 warn。
- `PlayerToolMode.ts`
  - 定義 Gun / Jetpack / Grapple 三種工具模式。
- `PlayerToolController.ts`
  - 掛 Player，使用 `1/2/3` 切工具模式。
  - Gun 模式右鍵呼叫 `PlayerGun`；Jetpack 模式 Space 消耗 fuel 上升；Grapple 模式右鍵 raycast 非 sensor 地形並拉玩家。
  - 可接 tool label、fuel bar、jetpack flame root、grapple line root。
- `Input/`
  - `InputAction.ts` 定義抽象操作，例如 MoveLeft、Attack、Cancel、CameraZoomIn、CameraZoomOut。
  - `InputBindings.ts` 集中 keyCode -> action 對應與 Esc/M/`+/-` fallback；R 快捷鍵已移除。
  - `InputContext.ts` 定義 Gameplay、Inventory、Crafting、Dialogue、MerchantShop、Vehicle、Paused。
  - `InputManager.ts` 統一監聽 Game 場景輸入，依 context stack 由上往下分派。
- `InventoryManager.ts`
  - 背包 singleton。
  - `addItem()`、`removeItem()`、`getItemCount()`、`hasItem()`、`getItems()`。
  - `getSaveSnapshot()`、`setItemsFromSave()`、`clear()` 支援存讀檔。
  - `addItem()` 目前簽名是 `(id, count)`，會從 `ItemData` 補名稱與描述。
  - 變動時發出 `INVENTORY_CHANGED`。
- `CollectibleItem.ts`
  - 簡易拾取物件邏輯。

## NPC

- `NPC_AI.ts`
  - NPC 共同行為基底。
  - 支援 `NONE`、`CHASE_TARGET`、`WANDER` 移動模式。
  - 支援 `NONE`、`MELEE`、`RANGED` 攻擊模式。
  - 遠程模式可設定 projectile prefab、生成點、世界 parent、釋放延遲、飛行時間、瞄準高度與擊退。
  - 遠程瞄準支援固定飛行時間與可直接調整的水平速度模式。
  - 受傷、死亡、停用或銷毀會取消尚未釋放的投射物。
  - 左右翻面會保留 `Sprite_Body` 原始縮放，只改變 X 軸正負號。
  - 支援受傷、死亡、血條、動畫狀態、跳躍越障。
  - 若同節點掛 `NPCPathAgent`，CHASE_TARGET 會先用 waypoint path；找不到 path 時 fallback 原本直接追擊。
  - 提供商人需要的 `pauseMovement()`、`resumeMovement()`、`stopMovement()`、`beginTalk()`、`endTalk()`、`beginTrading()`、`endTrading()`、`isPlayerInInteractRange()`。
- `NPCPathAgent.ts`
  - 依 `PathGraph` 回傳 waypoint steering direction。
  - 支援走到 portal waypoint 後呼叫 `Portal.teleportActor()`，讓敵人能走傳送門 link。
- `MiniBossAI.ts`
  - 傳送法師 Mini Boss 控制層，搭配同節點 `NPC_AI`。
  - 依 HP ratio 切 phase 2，定時瞬移到 teleport points，定時召喚 minion prefab。
- `BossArenaController.ts`
  - Arena sensor 控制器，玩家進入後啟動 Boss；Boss defeated 後可關 gate、顯示 reward、加分。
- `EnemyRespawner.ts`
  - 玩家距離型刷怪點，靠近才生成，離遠可 despawn，維持 `maxAlive`。
- `MerchantNPC.ts`
  - 旅行商人專屬狀態：`Wandering`、`Talking`、`Trading`、`Leaving`。
  - 設定自身為 `NPC_PEACE`、`WANDER`、不攻擊。
  - 透過 `MerchantPool` 產生固定或隨機商品。
  - 使用 `coconut` 作為目前貨幣。
  - 支援 `maxLifeTime` 與 `noTradeDespawnTime` 自動離開。
  - 購買成功後以單一 `InventoryManager.transact()` 扣 coconut 並加入商品，發送 `MERCHANT_PURCHASED`。
- `MerchantSpawner.ts`
  - 週期性或開場生成旅行商人。
  - 可指定 `merchantPrefab`、`playerNode`、`spawnParent`、生成距離、生成間隔。
  - 若場上已有旅行商人，會重用現有商人，不重複生成。
  - 生成位置依玩家世界座標計算；玩家在 OceanArea 時商人會生成在水域附近。
- `TravelingMerchant.prefab`
  - `8b456ff` 後已接新商人 sprite 與 `cc.Animation`。
  - animation clips 來源為 `resources/npcs/sprites/characters/merchant/Idle1/idle_rigjt.anim` 與 `Speak1/talk_right.anim`。

## Data

- `ItemData.ts`
  - 所有 item 的基本資料。
  - 目前包含：`coconut`、`potion`、`apple`、`ore`、`wood`，多個水果 / 堅果資料，以及 smallore 礦物資料。
  - 食物資料可記錄 `iconPath`、`hpRestore`、`staminaRestore`、`rottenTime`。
  - `iconPath` 目前大多使用 `assets/resources` 下的相對路徑；仍需逐項實測大小寫與檔名。
- `MerchantPool.ts`
  - 旅行商人商品池。
  - `getDefaultMerchantStock()` 回傳固定商品。
  - `rollMerchantStock(count, context?)` 使用 weight 隨機抽商品，商品不重複，stock 取 min/max 區間。
  - `MerchantRollContext` 預留遊戲階段、天氣、商人特質調整權重。

## Entity / Resources / Food

- `ResourceObject.ts`
  - 資源基底，處理滑鼠點擊、互動距離、每幾下掉落一次、共用 spawn prefab 工具。
- `Ore/orerock.ts`
  - 礦石資源子類，支援 weighted drop table，掉落後移除節點。
- `Ore/orebase.ts`
  - 礦物掉落物基底，繼承 `DropItem`，可落地、顯示互動提示、加入背包、發送 `ITEM_COLLECTED`、播放 collect 音效 / 特效。
- `Ore/Oredrops/*.ts`
  - smallore 子類，對應 `ItemData` 裡的 ambersphere、amethyst、calcitecluster、citrinegeode、coallump、cobaltore、coppercluster、firestone、fossilizedshell、icecrystal、ironore、jadeorb、lapislazuli、manapearl、meteoritechunk、mossagate、radslimechunk、rawgold、rosequartz、rubycrystal、silverbar、starmetalshard、tealprism、voidnugget。
- `TreesAndBushes/appletree.ts`
  - 蘋果樹 / 蘋果灌木子類，支援蘋果數量、掉落與回復 timer。
- `DropItem.ts`
  - 掉落物發射、落地、吸附玩家、收集並加入背包，發送 `ITEM_COLLECTED` 並播放 collect 音效 / 特效。
- `FoodBase.ts`
  - 食物基底，處理 falling / ground / collect 類行為。
  - 食物收集進背包；吃掉時優先找 `PlayerStats`，沒有則使用 `PlayerController.heal()`。
- `food/potions/*.ts`
  - Blue / Red / Yellow Potion 食物類腳本，搭配 `assets/Prefabs/Resources/potions/` prefab 與 `assets/resources/potions/` 圖。
- `fruits/*.ts`、`nuts/*.ts`
  - 從 `ItemData` 套用食物名稱、描述、回血、體力與腐敗時間。
- `coconut.ts`
  - 椰子目前是 `FoodBase` 子類，同時作為商人交易測試貨幣。

## Map / Scene

- `Map/AutoMapGenerator.ts`
  - 掛在 `Canvas/platform/auto generate`，用 `assets/Prefabs/Map/` 的 Rock prefabs 生成跳躍平台。
  - 預設直接在 local `x = -5000 ~ 0`、`y = -2000 ~ 0` 生成，無整體偏移；只清 `AutoRock_` prefix 節點。
  - 使用 seeded random、拼接式 pattern、AABB separation、平台頂面 / 斜坡地面線 offset，讓部分地形連通且避免不同組互相卡住。
- `Map/OceanArea.ts`
  - 掛在水域 sensor collider 上，目前用 collider bounds 偵測 Player 進出。
  - 進入時呼叫 `PlayerController.enterOceanArea()`，離開時呼叫 `exitOceanArea()`。
  - 進出時 emit `PLAYER_WATER_STATE_CHANGED`，供水域 BGM crossfade 與 ThemeManager 使用。
- `Map/OceanLayerOrder.ts`
  - 固定 SkyVisual / WaterVisual / SeaFloor / OceanTrigger / GeneratedContent 層級、active、opacity。
- `Map/OceanPrefabBuilder.ts`
  - 可在 onLoad 清掉舊 `GeneratedContent`，避免 prefab 生成內容殘留。
- `Map/Portal.ts`
  - 同場景成對傳送，兩個 portal 用同一個 `pairId`。
  - 支援 Player / NPC、`exitOffset`、cooldown，避免傳送後來回抖動。
- `Map/BouncePad.ts`
  - sensor 觸發後依節點 local up / local right 反彈 Player / NPC。
  - 預設 local up；旋轉彈跳板即可改朝上、斜上或水平彈出。
- `Map/PathNode.ts`
  - 手動 waypoint，可在 Inspector 設 `neighbors`。
  - 若是 portal 入口 / 出口附近節點，可拖 `Portal` 形成 link。
- `Map/PathGraph.ts`
  - 收集子節點 `PathNode`，用簡單 A* 找路。
  - path missing 時由 `NPC_AI` fallback 直接追擊。
- `Scene/MenuScene.ts`
  - 選單場景用腳本，支援開始遊戲、讀檔進遊戲、註冊、登入、登出、設定、排行榜、靜音與 fade。
- `Scene/GameOverScene.ts`
  - 死亡結算場景腳本，讀取最後一局結果，顯示玩家、Score、EXP，支援 Retry、Main Menu、Submit Score。

## UI

- `UIManager.ts`
  - 監聽玩家 HP / EXP / Score 事件，更新 HUD。
- `InventoryUIController.ts`
  - 監聽 `INVENTORY_CHANGED`，刷新背包格子文字。
  - 顯示 coconut / apple / ore icon。
  - 支援右鍵 action menu、使用、刪除、selection frame。
  - 可跟 Main Camera 並 clamp 到鏡頭可見範圍。
- `DialogueUIController.ts`
  - 控制商人 prompt 與選項 UI。
  - `showPrompt()`、`showOptions()`、`selectNext()`、`selectPrev()`、`hide()`。
  - 使用 anchorTarget + Main Camera bounds clamp，讓商人對話維持在鏡頭可見範圍。
- `MerchantShopUIController.ts`
  - 顯示商店商品、價格、庫存、玩家持有數、購買數量、貨幣數。
  - `open()`、`close()`、`refresh()`、`selectItem()`、`increaseAmount()`、`decreaseAmount()`、`buySelected()`。
  - 可跟 Main Camera 並 clamp 到鏡頭可見範圍，修正 OceanArea 交易 UI 跑出畫面問題。
- `CraftingUIController.ts`
  - 合成 UI 可跟 Main Camera / clamp；開啟合成時可同步調整 InventoryUI 位置。

## Vehicle

- `VehicleInteractable.ts`
  - 車 / 船共用互動距離與 prompt，供 PlayerController 掃描最近可互動載具。
- `VehicleController.ts`
  - 共用上下載具流程：鎖 PlayerController、push `InputContext.Vehicle`、同步 Player 到 `seatNode`、離開時放到 `exitOffsetX/Y`。
- `CarController.ts`
  - 地面車控制：A/D 加速、Space 煞車。
- `BoatController.ts`
  - 船控制：A/D 左右、W/S 柔和上下、Space 小加速。

## Prefab / Inspector 重點

- Player
  - `PlayerController.inventoryUI`
  - `PlayerController.attackHitbox`
  - `PlayerController.dialogueUI`
  - `PlayerController.merchantShopUI`
  - `AttackHitbox`：`CombatHitbox` + PhysicsCollider，sensor。
- Slime
  - `NPC_AI`
  - `RigidBody` + body collider
  - `AttackHitbox`：`CombatHitbox` + PhysicsCollider，sensor。
- TravelingMerchant
  - `NPC_AI`
    - Type：`NPC_PEACE`
    - Move Mode：`WANDER`
    - Attack Type：`NONE`
  - `MerchantNPC`
    - `Use Random Stock`
    - `Stock Item Count`
    - `Max Life Time`
    - `No Trade Despawn Time`
  - `cc.Animation`
    - default clip：商人 idle
    - clips：idle / talk
  - `RigidBody` + body collider。
- MerchantSpawner
  - `merchantPrefab`：`assets/Prefabs/NPCs/TravelingMerchant.prefab`
  - `playerNode`：`Canvas/Player`
  - `spawnParent`：`Canvas/NPC`
  - `minSpawnDistance` / `maxSpawnDistance`
  - `spawnInterval`
  - `spawnOnStart`
- SkeletonMage
  - `NPC_AI`
    - Attack Type：`RANGED`
    - `projectilePrefab`：`assets/Prefabs/Projectiles/BurningCoconutProjectile.prefab`
    - `projectileSpawnNode`：投射物生成點
    - `projectileParent`：世界 / projectile root
  - 建議使用 Skeleton_Mage 動畫：idle / move / attack / damaged / death。
- BurningCoconutProjectile
  - `CombatProjectile`
  - `RigidBody` + PhysicsCollider，collider 為 sensor。
  - 可接 `VisualRoot`，或由 `CoconutSprite` / `FireEffect` 自動建立視覺根節點。
- PlayerGun / player projectile
  - Player 或子節點掛 `PlayerGun`
  - `projectilePrefab` 拖玩家子彈 prefab
  - `muzzleNode` 可拖槍口節點；`projectileParent` 建議拖 Bullet_Layer
  - 子彈 prefab 需要 `CombatProjectile`、`RigidBody`、`PhysicsCollider` sensor
  - 可選掛 `ProjectilePoolManager`，`prewarmCount` 建議 8-16
- PlayerToolController
  - Player 掛 `PlayerToolController`
  - `playerGun` 拖同節點或子節點的 PlayerGun
  - 可選接 `toolLabel`、`jetpackFuelBar`、`jetpackFlameRoot`、`grappleLineRoot`
  - 操作：`1` Gun、`2` Jetpack、`3` Grapple；Jetpack 用 Space 上升
- Car / Boat
  - 車：掛 `VehicleInteractable` + `CarController` + RigidBody / collider，`promptText` 建議 `Press F to Drive`
  - 船：掛 `VehicleInteractable` + `BoatController` + RigidBody / collider，`promptText` 建議 `Press F to Board`
  - `seatNode` 拖座位點；`exitOffsetX/Y` 控制下車 / 下船位置
- Audio / Theme
  - `AudioManager.sceneBgm` 拖陸地 BGM，`waterBgm` 可選拖水域 BGM，`bgmFadeDuration` 控制淡入淡出
  - `ThemeManager` 可選接 `tintOverlay`、`tintTargets`，勾 `autoApplyOceanTheme` 後進出水域會切 default / ocean tint
- DamageNumberManager
  - 可掛 GameManager 或 UI Root；不掛時 GameManager runtime 補
  - `numberRoot` 建議拖 UI Root 或 HUD Layer
- MiniBoss
  - Boss prefab 掛 `NPC_AI` + `MiniBossAI`
  - `MiniBossAI.npcAI` 拖同節點 NPC_AI
  - `teleportPoints` 拖 arena 內手動放的點
  - `minionPrefabs` 拖小怪 prefab，`minionParent` 拖 NPC root
- BossArenaController
  - Arena trigger 節點掛 `BossArenaController` + sensor collider
  - 接 `boss` / `bossNode`、`playerNode`
  - 可選接 `gateNode`、`clearRewardNode`
- EnemyRespawner
  - 刷怪點掛 `EnemyRespawner`
  - 接 `enemyPrefabs`、`playerNode`、`spawnParent`
  - 調 `activationRange`、`despawnRange`、`maxAlive`、`spawnCooldown`
- Portal
  - Portal 節點需要 `Portal.ts` + sensor collider
  - 成對 Portal 設同一個 `pairId`
  - Player / NPC collider 要能觸發 contact listener
- BouncePad
  - BouncePad 節點需要 `BouncePad.ts` + sensor collider
  - 旋轉節點決定反彈方向，`bounceSpeed` 決定力道
- PathGraph / PathNode
  - World Root 下建立 PathGraph root，掛 `PathGraph.ts`
  - 子節點掛 `PathNode.ts`，用 `neighbors` 手動連線
  - portal 入口 / 出口附近 PathNode 可拖對應 Portal component
  - 需要尋路的 NPC 掛 `NPCPathAgent.ts`
- OceanArea
  - `PhysicsBoxCollider` 設為 sensor。
  - 掛 `OceanArea.ts`，需讓 Player collider 能觸發 contact callback。
  - Ocean root 可掛 `OceanLayerOrder.ts`；需要清舊生成內容時掛 `OceanPrefabBuilder.ts`。
- DropOre
  - prefab 掛對應 `Oredrops/*.ts` 子類或 `Orebase.ts`，並確認 item id 對上 `ItemData` smallore key。
- Potions
  - `Blue Potion` / `Red Potion` / `Yellow Potion` prefab 建議掛對應 potion script，確認 item id 與 `ItemData` 一致。
- Rocksets
  - Rockleft / Rockright / Rockplatform3 / 4 / 5 prefab 放入場景後需確認 collider、spacing、layer。
  - `Canvas/platform/auto generate` 掛 `AutoMapGenerator.ts`，拖入 `assets/Prefabs/Map/` 五個 Rock prefab。
  - AutoMapGenerator 預設 local 範圍 `(-5000,-2000)` 到 `(0,0)`，無整體偏移；使用 FlatRun / RampUp / RampDown / Hill / Valley pattern 拼接平台，`slopePatternChance` 可提高斜坡組比例。
- UI Root
  - `UIManager.expLabel`、`UIManager.scoreLabel`、`UIManager.hpBar`
  - `DialogueUIController` prompt / panel / option labels
  - `MerchantShopUIController` root / labels / itemListRoot / buyButton
  - `DialogueUIController` / `InventoryUIController` / `MerchantShopUIController` / `CraftingUIController` 可接 `mainCameraNode`，讓 panel 跟鏡頭並 clamp。
- Flow / final grading
  - `GameManager.pausePanel`：Esc 暫停時顯示的 UI 容器，可放 Resume / Retry / Main Menu / Save 按鈕。
  - `GameManager.fadeOverlay`：全螢幕黑色 UI 節點，供 Retry / Main Menu 切場景前淡出；未綁時會直接切場景。
  - `MenuScene` main / login / settings / leaderboard panels、EditBox、status / user / leaderboard labels
  - `GameOverScene` title / username / score / exp / status labels、retry / menu / submit buttons
  - `AudioManager` land / water BGM + six SFX clips
  - `EffectsManager.effectRoot` + `particleSpriteFrame`

## 主要流程

```text
NPC_AI ranged attack
  -> startAttack()
  -> schedule releaseRangedProjectile()
  -> instantiate BurningCoconutProjectile
  -> CombatProjectile.launch(owner, faction, velocity, damage, knockback)
  -> contact target / terrain or lifetime
  -> projectile destroy()
```

```text
OceanArea contact
  -> PlayerController.enterOceanArea()
  -> PLAYER_WATER_STATE_CHANGED(true)
  -> AudioManager crossfade to waterBgm
  -> lower gravity and use ocean movement / sink / boost
  -> PlayerController.exitOceanArea()
  -> PLAYER_WATER_STATE_CHANGED(false)
  -> AudioManager crossfade to sceneBgm
  -> restore original gravity
```

```text
ResourceObject / NPC_AI
  -> instantiate drop prefab
  -> DropItem / Orebase launch or enablePhysics()
  -> stop on ground
  -> player enter attract range
  -> InventoryManager.addItem(id, count)
  -> EventCenter.emit(ITEM_COLLECTED)
  -> GameManager.addScore()
  -> INVENTORY_CHANGED
  -> InventoryUIController.refreshUI()
```

```text
Camera-bound UI
  -> open Inventory / Crafting / Dialogue / MerchantShop
  -> resolve Main Camera
  -> place panel near camera world position
  -> clamp visible content inside camera bounds
```

```text
Player F
  -> find nearest MerchantNPC
  -> MerchantNPC.beginInteraction()
  -> NPC_AI.beginTalk()
  -> DialogueUIController.showOptions()
  -> dialogue clamped to camera-visible Canvas area
  -> MerchantNPC.openTrade()
  -> MerchantShopUIController.open()
  -> shop should render in Screen UI Root / camera space
  -> MerchantNPC.buy()
  -> InventoryManager.removeItem("coconut")
  -> InventoryManager.addItem(item)
  -> EventCenter.emit(MERCHANT_PURCHASED)
  -> GameManager.addScore()
```

```text
Player F near vehicle
  -> find nearest VehicleInteractable after merchant check
  -> VehicleController.tryMount()
  -> PlayerController external control lock
  -> InputContext.Vehicle handles A/D/W/S/Space/F
  -> F again dismounts at exit offset
```

```text
MerchantSpawner
  -> spawnMerchant()
  -> instantiate TravelingMerchant prefab near player
  -> MerchantNPC rolls stock
  -> lifetime/no-trade timeout
  -> MerchantNPC.leave()
```

```text
Player / NPC attack
  -> CombatHitbox.activate()
  -> CombatHitbox.onBeginContact()
  -> target.receiveAttack() or target.takeDamage()
  -> AudioManager / EffectsManager feedback
```

```text
Final Project flow
  -> MenuScene register/login/load/start
  -> GameManager pause/resume/save/retry/menu
  -> PLAYER_DIED
  -> SaveService.setLastRun()
  -> optional SaveService.submitScore()
  -> PlayerController load GameOver
  -> GameOverScene retry/menu/submit score
```

```text
Score / save / leaderboard
  -> NPC_DIED / ITEM_COLLECTED / MERCHANT_PURCHASED
  -> GameManager addScore/addExp
  -> SCORE_CHANGED / PLAYER_EXP_CHANGED
  -> UIManager updates HUD
  -> SaveService save/load localStorage
```

## 後續 TODO

1. 將 `local plans/` 作為後續 step 文件來源。
2. 手動完成 Menu / Pause / GameOver / Audio / Effects 的 Inspector 綁定。
3. 實測 SkeletonMage、OceanArea、DropOre、存讀檔、排行榜、音效與五種粒子特效。
4. 確認 Main Camera 只啟用 `CameraRig` 或 `CameraFollow` 其中一套。
5. 實測商店 / 背包 / 合成 / 對話 UI 在 OceanArea 不會跑出鏡頭。
6. 實測車 / 船 seat、exit offset、collider、玩家上下載具與水域 BGM crossfade。
7. Map / Resource / Food 腳本仍有 placeholder、固定路徑、命名大小寫與素材來源檔，後續需要整理。

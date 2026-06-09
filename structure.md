# Cocos Sanctuary 專案架構

> 更新日期：2026-06-07
> 引擎：Cocos Creator 2.4.8
> 目前重點：玩家 / NPC 近遠程戰鬥、旅行商人、水域控制、資源掉落、食物資料與背包。

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
    Core/
      BaseEntity.ts
      Constants.ts
      EventCenter.ts
      GameManager.ts
    Data/
      ItemData.ts
      MerchantPool.ts
    Entity/
      Resources/
        ResourceObject.ts
        DropItem.ts
        Ore/
          orerock.ts
        TreesAndBushes/
          appletree.ts
        food/
          FoodBase.ts
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
      NewScript - 001.ts
      OceanArea.ts
    NPC/
      NPC_AI.ts
      MerchantNPC.ts
      MerchantSpawner.ts
      NPCDialogue.ts
    Player/
      PlayerController.ts
      InventoryManager.ts
      CollectibleItem.ts
    UI/
      UIManager.ts
      InventoryUIController.ts
      DialogueUIController.ts
      MerchantShopUIController.ts
    Utils/
      NewScript - 002.ts
    Scene/
      MenuScene.ts

  Textures/
    Buttons/
    effects/fire effects/
    npcs/sprites/characters/

  resources/
    100 FOOD ASSETS/
      Assets/food/food/
        fruits1/
        fruits2/
        nuts/
    Purple Planet - Platformer Tileset/

local plans/
  merchant.todo
  step_1.md ... step_6.md
  note.md
```

## 目前 Scene 建議結構

```text
Canvas
  Main Camera
    CameraFollow                  # 目前會跟玩家移動到水域
  Background
  tempFloor
  Title
  Core Controllers
    GameManager
    MerchantSpawner                # 建議掛在這裡或 NPC root 上
  World Root
    OceanArea                      # PhysicsBoxCollider sensor + OceanArea
  UI Root
    Screen UI Root                # 建議固定跟 Main Camera / 螢幕座標
    ExpLabel
    HpBar
      bar
    MerchantPrompt
      Label
    DialoguePanel
      DialogueLabel
      OptionTrade
      OptionChat
      OptionLeave
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
  Player
  Ore
  Tree
  NPC
    TravelingMerchant              # 可手動放，也可由 MerchantSpawner 生成
    SkeletonMage                   # 遠程 NPC prefab
  coconuts
  InventoryUI
    GridContainer
```

## Core

- `BaseEntity.ts`
  - 所有可受傷 entity 的基底。
  - 提供 `type`、`maxHp`、`currentHp`、`takeDamage()`、`onDamaged()`、`die()`。
- `Constants.ts`
  - `EntityType`：`PLAYER`、`NPC_PEACE`、`NPC_NEUTRAL`、`NPC_HOSTILE`。
  - `GameEvent`：玩家 HP/EXP、死亡、NPC 死亡、生成物件等事件名稱。
- `EventCenter.ts`
  - 全域事件中心，提供 `on()`、`emit()`、`off()`、`clear()`。
- `GameManager.ts`
  - 遊戲初始化、PhysicsManager、physics debug draw、玩家死亡流程。

## Attack

- `CombatHitbox.ts`
  - 玩家與 NPC 共用的近戰 hitbox。
  - 透過 `ownerFaction`、`canHitPlayer`、`canHitPeaceNpc`、`canHitNeutralNpc`、`canHitHostileNpc` 判斷陣營與可攻擊對象。
  - 啟用時設定位置與傷害，時間到自動關閉。
  - 命中後優先呼叫目標的 `receiveAttack()`，沒有則呼叫 `takeDamage()`。
  - 已避免向上搜尋 parent 時對 Scene 呼叫 `getComponent()`。
- `CombatProjectile.ts`
  - 遠程攻擊共用投射物，使用 Dynamic RigidBody 與 sensor collider。
  - 接收 owner、陣營、初速度、傷害與擊退，沿用 `CombatHitInfo` 傳遞受傷資料。
  - 排除攻擊者與同陣營、每個目標只命中一次，命中實體、地形或超時後銷毀。
  - `VisualRoot` 會依速度方向旋轉；若 prefab 只有 `CoconutSprite` 與 `FireEffect`，載入時會自動建立視覺根節點。

## Player

- `PlayerController.ts`
  - A/D 移動、Space 跳躍、滑鼠左鍵攻擊。
  - B 開關背包。
  - T 測試用：加入 `coconut x10`。
  - F 旅行商人互動：靠近 prompt、對話選項、開商店、關商店。
  - 滾輪切換對話選項或商店商品；商店中可用方向鍵與 Enter 測購買。
  - 進入 OceanArea 後降低重力，W / Up / Space 上游，S / Down 下潛，離開後還原重力。
  - 持有 `DialogueUIController` 與 `MerchantShopUIController` reference。
- `InventoryManager.ts`
  - 背包 singleton。
  - `addItem()`、`removeItem()`、`getItemCount()`、`hasItem()`、`getItems()`。
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
  - 提供商人需要的 `pauseMovement()`、`resumeMovement()`、`stopMovement()`、`beginTalk()`、`endTalk()`、`beginTrading()`、`endTrading()`、`isPlayerInInteractRange()`。
- `MerchantNPC.ts`
  - 旅行商人專屬狀態：`Wandering`、`Talking`、`Trading`、`Leaving`。
  - 設定自身為 `NPC_PEACE`、`WANDER`、不攻擊。
  - 透過 `MerchantPool` 產生固定或隨機商品。
  - 使用 `coconut` 作為目前貨幣。
  - 支援 `maxLifeTime` 與 `noTradeDespawnTime` 自動離開。
  - 購買成功後使用 `InventoryManager.addItem(itemId, amount)` 加入玩家背包。
- `MerchantSpawner.ts`
  - 週期性或開場生成旅行商人。
  - 可指定 `merchantPrefab`、`playerNode`、`spawnParent`、生成距離、生成間隔。
  - 若場上已有旅行商人，會重用現有商人，不重複生成。
  - 生成位置依玩家世界座標計算；玩家在 OceanArea 時商人會生成在水域附近。

## Data

- `ItemData.ts`
  - 所有 item 的基本資料。
  - 目前包含：`coconut`、`potion`、`apple`、`ore`、`wood`，以及多個水果 / 堅果資料。
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
- `TreesAndBushes/appletree.ts`
  - 蘋果樹 / 蘋果灌木子類，支援蘋果數量、掉落與回復 timer。
- `DropItem.ts`
  - 掉落物發射、落地、吸附玩家、收集並加入背包。
- `FoodBase.ts`
  - 食物基底，處理 falling / ground / collect 類行為。
  - 食物收集進背包；吃掉時目前仍找 `PlayerStats`，尚未接 `PlayerController`。
- `fruits/*.ts`、`nuts/*.ts`
  - 從 `ItemData` 套用食物名稱、描述、回血、體力與腐敗時間。
- `coconut.ts`
  - 椰子目前是 `FoodBase` 子類，同時作為商人交易測試貨幣。

## Map / Scene

- `Map/OceanArea.ts`
  - 掛在水域 sensor collider 上，偵測 Player 進出。
  - 進入時呼叫 `PlayerController.enterOceanArea()`，離開時呼叫 `exitOceanArea()`。
- `Scene/MenuScene.ts`
  - 選單場景用腳本，`goToGameScene()` 載入 `gameScene`，預設 `Game`。

## UI

- `UIManager.ts`
  - 監聽玩家 HP / EXP 事件，更新 HUD。
- `InventoryUIController.ts`
  - 監聽 `INVENTORY_CHANGED`，刷新背包格子文字。
  - 顯示 coconut / apple / ore icon。
  - 支援右鍵 action menu、使用、刪除、selection frame。
- `DialogueUIController.ts`
  - 控制商人 prompt 與選項 UI。
  - `showPrompt()`、`showOptions()`、`selectNext()`、`selectPrev()`、`hide()`。
  - 使用 anchorTarget + clamp，讓商人對話維持在鏡頭可見範圍。
- `MerchantShopUIController.ts`
  - 顯示商店商品、價格、庫存、玩家持有數、購買數量、貨幣數。
  - `open()`、`close()`、`refresh()`、`selectItem()`、`increaseAmount()`、`decreaseAmount()`、`buySelected()`。
  - 目前仍偏固定世界座標；OceanArea 交易時可能跑出畫面，應改掛 Screen UI Root / Main Camera。

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
- OceanArea
  - `PhysicsBoxCollider` 設為 sensor。
  - 掛 `OceanArea.ts`，需讓 Player collider 能觸發 contact callback。
- UI Root
  - `UIManager.expLabel`、`UIManager.hpBar`
  - `DialogueUIController` prompt / panel / option labels
  - `MerchantShopUIController` root / labels / itemListRoot / buyButton
  - `MerchantShopPanel` 建議放在 Screen UI Root 或 Main Camera 子節點，避免 Camera 移動後跑出畫面。

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
  -> lower gravity and use ocean movement
  -> PlayerController.exitOceanArea()
  -> restore original gravity
```

```text
ResourceObject / NPC_AI
  -> instantiate drop prefab
  -> DropItem.launch()
  -> DropItem stop on ground
  -> player enter attract range
  -> InventoryManager.addItem(id, count)
  -> INVENTORY_CHANGED
  -> InventoryUIController.refreshUI()
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
```

## 後續 TODO

1. 將 `local plans/` 作為後續 step 文件來源。
2. 實測 SkeletonMage / BurningCoconutProjectile 的陣營、傷害、擊退、動畫與銷毀流程。
3. 實測 OceanArea 進出水域後重力還原與游泳控制。
4. 把商店 UI 做成正式 prefab，減少手動拖 node。
5. Map / Resource / Food 腳本仍有 placeholder、固定路徑、命名大小寫與素材來源檔，後續需要整理。

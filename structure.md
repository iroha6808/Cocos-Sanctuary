# Cocos Sanctuary 專案架構

> 更新日期：2026-06-05  
> 引擎：Cocos Creator 2.4.8  
> 目前重點：玩家、NPC 戰鬥判定、旅行商人互動/商店、基礎資源採集與背包。

## 目錄總覽

```text
assets/
  Scenes/
    Game.fire
    MenuScene.fire
    GameOver.fire

  Prefabs/
    Player.prefab
    NPCs/
      Slime.prefab
      TravelingMerchant.prefab
    Resources/
      Tree.prefab
      Ore.prefab
      FruitDrop.prefab
      OreDrop.prefab
      coconut.prefab

  Scripts/
    Attack/
      CombatHitbox.ts
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
        food/
          FoodBase.ts
          fruits/
            coconut.ts
    Map/
      NewScript - 001.ts
    NPC/
      NPC_AI.ts
      MerchantNPC.ts
      MerchantSpawner.ts
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

local plans/
  merchant.todo
  step_1.md ... step_6.md
  note.md
```

## 目前 Scene 建議結構

```text
Canvas
  Main Camera
  Background
  tempFloor
  Title
  Core Controllers
    GameManager
    MerchantSpawner                # 建議掛在這裡或 NPC root 上
  World Root
  UI Root
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

## Player

- `PlayerController.ts`
  - A/D 移動、Space 跳躍、滑鼠左鍵攻擊。
  - B 開關背包。
  - T 測試用：加入 `coconut x10`。
  - F 旅行商人互動：靠近 prompt、對話選項、開商店、關商店。
  - 滾輪切換對話選項或商店商品；商店中可用方向鍵與 Enter 測購買。
  - 持有 `DialogueUIController` 與 `MerchantShopUIController` reference。
- `InventoryManager.ts`
  - 背包 singleton。
  - `addItem()`、`removeItem()`、`getItemCount()`、`hasItem()`、`getItems()`。
  - 變動時發出 `INVENTORY_CHANGED`。
- `CollectibleItem.ts`
  - 簡易拾取物件邏輯。

## NPC

- `NPC_AI.ts`
  - NPC 共同行為基底。
  - 支援 `NONE`、`CHASE_TARGET`、`WANDER` 移動模式。
  - 支援 `NONE`、`MELEE` 攻擊模式。
  - 支援受傷、死亡、血條、動畫狀態、跳躍越障。
  - 提供商人需要的 `pauseMovement()`、`resumeMovement()`、`stopMovement()`、`beginTalk()`、`endTalk()`、`beginTrading()`、`endTrading()`、`isPlayerInInteractRange()`。
- `MerchantNPC.ts`
  - 旅行商人專屬狀態：`Wandering`、`Talking`、`Trading`、`Leaving`。
  - 設定自身為 `NPC_PEACE`、`WANDER`、不攻擊。
  - 透過 `MerchantPool` 產生固定或隨機商品。
  - 使用 `coconut` 作為目前貨幣。
  - 支援 `maxLifeTime` 與 `noTradeDespawnTime` 自動離開。
- `MerchantSpawner.ts`
  - 週期性或開場生成旅行商人。
  - 可指定 `merchantPrefab`、`playerNode`、`spawnParent`、生成距離、生成間隔。
  - 若場上已有旅行商人，會重用現有商人，不重複生成。

## Data

- `ItemData.ts`
  - 所有 item 的基本資料。
  - 目前包含：`coconut`、`potion`、`apple`、`ore`、`wood`。
- `MerchantPool.ts`
  - 旅行商人商品池。
  - `getDefaultMerchantStock()` 回傳固定商品。
  - `rollMerchantStock(count, context?)` 使用 weight 隨機抽商品，商品不重複，stock 取 min/max 區間。
  - `MerchantRollContext` 預留遊戲階段、天氣、商人特質調整權重。

## Entity / Resources / Food

- `ResourceObject.ts`
  - Tree / Ore 的採集、距離判定、耐久與掉落。
- `DropItem.ts`
  - 掉落物拾取與加入背包。
- `FoodBase.ts`
  - 食物基底，處理 falling / ground / collect 類行為。
- `coconut.ts`
  - 椰子狀態與互動，後續可整理成正式貨幣或食物資料。

## UI

- `UIManager.ts`
  - 監聽玩家 HP / EXP 事件，更新 HUD。
- `InventoryUIController.ts`
  - 監聽 `INVENTORY_CHANGED`，刷新背包格子文字。
- `DialogueUIController.ts`
  - 控制商人 prompt 與選項 UI。
  - `showPrompt()`、`showOptions()`、`selectNext()`、`selectPrev()`、`hide()`。
- `MerchantShopUIController.ts`
  - 顯示商店商品、價格、庫存、玩家持有數、購買數量、貨幣數。
  - `open()`、`close()`、`refresh()`、`selectItem()`、`increaseAmount()`、`decreaseAmount()`、`buySelected()`。

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
- UI Root
  - `UIManager.expLabel`、`UIManager.hpBar`
  - `DialogueUIController` prompt / panel / option labels
  - `MerchantShopUIController` root / labels / itemListRoot / buyButton

## 主要流程

```text
Player F
  -> find nearest MerchantNPC
  -> MerchantNPC.beginInteraction()
  -> NPC_AI.beginTalk()
  -> DialogueUIController.showOptions()
  -> MerchantNPC.openTrade()
  -> MerchantShopUIController.open()
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
2. 把商店 UI 做成正式 prefab，減少手動拖 node。
3. MerchantSpawner 之後可接 MapManager，生成在地面安全點。
4. MerchantNPC 可加入更多對話與根據 context 產生商品。
5. Map / Resource / Food 腳本仍有 placeholder 與舊式路徑，後續需要整理。

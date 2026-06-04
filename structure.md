# Cocos Sanctuary 專案架構

> 更新日期：2026-06-04  
> 目的：整理目前專案實際架構、模組責任、跨模組依賴，以及 Cocos Editor 需要對齊的節點 / Inspector 設定。

## 目錄

- [專案概況](#專案概況)
- [主要資產結構](#主要資產結構)
- [建議場景節點層級](#建議場景節點層級)
- [Core](#core)
- [Attack](#attack)
- [Player](#player)
- [NPC](#npc)
- [Data](#data)
- [Entity / Resources / Items](#entity--resources--items)
- [UI](#ui)
- [Map / Utils](#map--utils)
- [目前跨模組流程](#目前跨模組流程)
- [Inspector 對齊重點](#inspector-對齊重點)
- [目前風險與注意事項](#目前風險與注意事項)

## 專案概況

- 引擎：Cocos Creator 2.4.8
- 類型：2D 橫向平台 / 探索 / Terraria-like 生存採集
- 核心玩法：玩家移動、攻擊、背包、資源採集、NPC 戰鬥、商人對話與交易

## 主要資產結構

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

  Animations/
    PlayerAnimations/
      PlayerIdle.anim
      PlayerRun.anim
      PlayerJump.anim
      PlayerAttack.anim
      PlayerHurt.anim
      PlayerDie.anim

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
      Items/
        food/
          FoodBase.ts
          fruits/
            coconut.ts
    Map/
      NewScript - 001.ts
    NPC/
      NPC_AI.ts
      MerchantNPC.ts
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

  Textures/
    Inventory/
    mystic_woods_free_2.2/
    100 FOOD ASSETS/
    100 Retro Magic Sound Effects/
    2D Cute Domestic Animal Pack V.1/
    Animals/
    GUI - The Stone/
    Platformer Tileset - Pixelart Snow Mountain/
    Desert Pixel Art Environment/
    Purple Planet - Platformer Tileset/
    Rainforest - Platformer Tileset/
    Traps and Tileset/
    Unique Toon Projectiles Vol. 1/
```

## 建議場景節點層級

```text
Canvas
 ├── Main Camera
 ├── Core_Controllers
 │    └── GameManager              # GameManager.ts
 ├── Player                        # PlayerController.ts, BaseEntity, RigidBody
 ├── World_Root
 │    ├── Map_Layer                # 地圖 / 背景 / 地板
 │    ├── Resource_Layer           # Tree, Ore, coconut
 │    ├── Drop_Layer               # FruitDrop, OreDrop
 │    ├── Entity_Layer             # Slime, TravelingMerchant
 │    └── Bullet_Layer             # future projectile
 └── UI_Root
      ├── HUD_Layer                # UIManager.ts
      ├── InventoryPanel           # InventoryUIController.ts
      ├── DialoguePanel            # DialogueUIController.ts
      ├── MerchantShopPanel        # MerchantShopUIController.ts
      └── GameOverPanel            # future / GameOver scene
```

實際程式目前有些地方固定使用 `cc.find("Canvas/Player")` 或 `cc.find("Canvas")`，所以若場景路徑改動，需要同步修改 `PlayerController`、`ResourceObject`、`DropItem`、`FoodBase`。

## Core

位置：`assets/Scripts/Core`

- `Constants.ts`
  - 定義 `GameEvent`：`PLAYER_HP_CHANGED`、`PLAYER_EXP_CHANGED`、`PLAYER_DIED`、`NPC_MOCKED`、`NPC_DIED`、`SPAWN_ITEM`
  - 定義 `EntityType`：`PLAYER`、`NPC_PEACE`、`NPC_NEUTRAL`、`NPC_HOSTILE`
- `EventCenter.ts`
  - 自製事件中心
  - 保存 `callback`、`target`、實際 `handler`
  - 支援 `on()`、`emit()`、`off()`、`clear()`
- `BaseEntity.ts`
  - Player / NPC 共用生命值基底
  - 提供 `maxHp`、`currentHp`、`takeDamage()`、`onDamaged()`、`die()`
- `GameManager.ts`
  - Singleton
  - 啟用 PhysicsManager
  - `showPhysicsDebugDraw` 可控制 debug draw
  - 監聽 `PLAYER_DIED`
  - `onGameOver()` 目前仍是 log / TODO

## Attack

位置：`assets/Scripts/Attack`

- `CombatHitbox.ts`
  - 通用近戰 hitbox
  - 啟用後短時間打開 sensor collider
  - 支援 faction 過濾：Player / Peace NPC / Neutral NPC / Hostile NPC
  - 避免同一次攻擊重複命中同一目標
  - 優先呼叫目標 `receiveAttack()`，否則呼叫 `takeDamage()`

## Player

位置：`assets/Scripts/Player`

- `PlayerController.ts`
  - A / D 左右移動
  - Space 跳躍
  - 滑鼠左鍵攻擊
  - 滑鼠右鍵測試扣血
  - B 開關背包
  - F 商人互動 / 對話確認 / 關閉交易
  - T 測試加入 `coconut x10`
  - 滑鼠滾輪切換對話選項或商店商品
  - 支援 `PlayerIdle`、`PlayerRun`、`PlayerAttack`、`PlayerHurt`、`PlayerDie`
  - 死亡動畫完成後發送 `PLAYER_DIED` 並載入 `GameOver`
- `InventoryManager.ts`
  - 背包 singleton
  - 支援 `addItem()`、`removeItem()`、`getItemCount()`、`hasItem()`、`getItems()`
  - 變更時發送 `INVENTORY_CHANGED`
- `CollectibleItem.ts`
  - 碰到 PlayerController 後加入背包並銷毀

## NPC

位置：`assets/Scripts/NPC`

- `NPC_AI.ts`
  - 繼承 `BaseEntity`
  - 支援 Peace / Neutral / Hostile
  - 支援 `NONE`、`CHASE_TARGET`、`WANDER`
  - 支援 `NONE`、`MELEE` 攻擊型態
  - Neutral 被嘲諷或受傷後 enraged
  - Hostile / enraged Neutral 可追蹤與攻擊玩家
  - 支援談話 / 交易時暫停移動
  - 支援 HP bar、受傷動畫、死亡動畫、`NPC_DIED`
- `MerchantNPC.ts`
  - 商人元件，需要同節點有 `NPC_AI`
  - 強制設為 Peace NPC、Wander、無攻擊
  - 狀態：`Wandering`、`Talking`、`Trading`、`Leaving`
  - 使用 `coconut` 作為交易貨幣
  - 購買時檢查庫存、價格、玩家 coconut 數量，成功後扣款並加入商品

## Data

位置：`assets/Scripts/Data`

- `ItemData.ts`
  - 集中定義道具資料
  - 目前有 `coconut`、`potion`、`apple`、`ore`、`wood`
- `MerchantPool.ts`
  - 定義商人商品池與預設庫存
  - 預設商店：`potion`、`apple`、`ore`

## Entity / Resources / Items

位置：`assets/Scripts/Entity`

- `Resources/ResourceObject.ts`
  - Tree / Ore 可互動資源
  - 滑鼠左鍵互動
  - 檢查玩家距離
  - 扣耐久，耗盡後生成掉落物
  - Tree 可換 depleted sprite，Ore 直接 destroy
- `Resources/DropItem.ts`
  - 資源掉落物
  - 飛出、落地停止、玩家靠近吸附、收集後 destroy
  - 目前收集後未加入背包
- `Items/food/FoodBase.ts`
  - 食物掉落物基底
  - 飛出、吸附、收集時加入 `InventoryManager`
- `Items/food/fruits/coconut.ts`
  - 椰子狀態：OnTree / Falling / OnGround / Held
  - 支援掉落、互動提示、撿起、吃掉、丟出

## UI

位置：`assets/Scripts/UI`

- `UIManager.ts`
  - 監聽 `PLAYER_HP_CHANGED` 更新 HP bar
  - 監聽 `PLAYER_EXP_CHANGED` 更新 EXP label
- `InventoryUIController.ts`
  - 監聽 `INVENTORY_CHANGED`
  - 將背包內容顯示到 grid slot label
- `DialogueUIController.ts`
  - 商人互動提示
  - 對話選項顯示
  - 支援選項高亮與上下選擇
- `MerchantShopUIController.ts`
  - 商店面板
  - 顯示 coconut 貨幣、商品、價格、庫存、玩家持有數
  - 支援選商品、調整購買數量、購買

## Map / Utils

- `Map/NewScript - 001.ts`
  - 目前仍是預設測試腳本，尚未形成正式 MapManager
- `Utils/NewScript - 002.ts`
  - 目前仍是預設測試腳本

後續 Map 系統可拆成：

```text
assets/Scripts/Map/
  TileConfig.ts
  TileData.ts
  TileRenderer.ts
  MapManager.ts
```

## 目前跨模組流程

```text
PlayerController
  -> CombatHitbox.activate()
  -> CombatHitbox.onBeginContact()
  -> NPC_AI.receiveAttack()
  -> NPC_AI.takeDamage()
```

```text
NPC_AI
  -> CombatHitbox.activate()
  -> PlayerController.takeDamage()
  -> PLAYER_HP_CHANGED
  -> UIManager
```

```text
ResourceObject
  -> spawn DropItem / FoodBase prefab
  -> FoodBase.collect()
  -> InventoryManager.addItem()
  -> INVENTORY_CHANGED
  -> InventoryUIController.refreshUI()
```

```text
PlayerController
  -> F interact
  -> MerchantNPC.beginInteraction()
  -> DialogueUIController.showOptions()
  -> MerchantNPC.openTrade()
  -> MerchantShopUIController.open()
  -> MerchantNPC.buy()
  -> InventoryManager.removeItem("coconut")
  -> InventoryManager.addItem(item)
```

```text
PlayerController.die()
  -> PlayerDie animation finished
  -> PLAYER_DIED
  -> GameManager.onGameOver()
  -> loadScene("GameOver")
```

## Inspector 對齊重點

- Player prefab
  - `PlayerController.inventoryUI`
  - `PlayerController.attackHitbox`
  - `PlayerController.dialogueUI`
  - `PlayerController.merchantShopUI`
  - `Sprite_Body` 需掛 `cc.Animation`
  - `AttackHitbox` 子節點需掛 `CombatHitbox` + PhysicsCollider
- Slime / NPC prefab
  - `NPC_AI.targetPlayer`
  - `NPC_AI.hpBar`
  - `NPC_AI.attackHitbox`
  - `Sprite_Body` 或本體需掛 `cc.Animation`
- TravelingMerchant prefab
  - 同節點掛 `NPC_AI` + `MerchantNPC`
  - `NPC_AI` 會被 `MerchantNPC` 設為 Peace / Wander / No attack
- Resource prefab
  - `ResourceObject.dropPrefab`
  - Tree 需要 `depletedSpriteFrame` / `targetSprite`
- UI
  - `UIManager.expLabel`、`UIManager.hpBar`
  - `InventoryUIController.gridContainer`
  - `DialogueUIController.promptNode`、`promptLabel`、`dialoguePanel`、`dialogueLabel`、`optionLabels`
  - `MerchantShopUIController` 的 root、labels、itemListRoot、buyButton

## 目前風險與注意事項

1. `PlayerController` 的 `T` 是測試加 coconut，正式版應移除或包 debug flag。
2. `PlayerController` 滑鼠右鍵是測試扣血，正式版要改成正式互動。
3. `DropItem.ts` 收集後只 destroy，未加入背包；`FoodBase.ts` 與 `CollectibleItem.ts` 會加入背包。
4. `ResourceObject`、`DropItem`、`FoodBase` 目前固定找 `Canvas/Player`，場景路徑改動會影響功能。
5. `coconut.ts` 的 `eat()` 找 `PlayerStats`，但目前玩家主腳本是 `PlayerController`，回血 API 尚未統一。
6. `GameManager.onGameOver()` 目前仍是 TODO，真正結算 UI 尚未完成。

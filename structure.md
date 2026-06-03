# Cocos Sanctuary 專案架構

> 更新日期：2026-06-04  
> 目的：整理目前專案實際架構、模組責任、跨模組依賴，以及後續開發旅行商人 NPC 時需要對齊的基礎。

## 專案概況

- 引擎：Cocos Creator 2.4.8
- 類型：2D 橫向平台 / 探索 / Terraria-like 生存採集
- 主要場景：
  - `assets/Scenes/Game.fire`
  - `assets/Scenes/MenuScene.fire`
  - `assets/Scenes/GameOver.fire`
- 主要 prefab：
  - `assets/Prefabs/Player.prefab`
  - `assets/Prefabs/NPCs/Slime.prefab`
  - `assets/Prefabs/Resources/Tree.prefab`
  - `assets/Prefabs/Resources/Ore.prefab`
  - `assets/Prefabs/Resources/coconut.prefab`

## 目前資料夾結構

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
    Resources/
      Tree.prefab
      Ore.prefab
      FruitDrop.prefab
      OreDrop.prefab
      coconut.prefab

  Scripts/
    Core/
      BaseEntity.ts
      Constants.ts
      EventCenter.ts
      GameManager.ts

    Attack/
      CombatHitbox.ts

    Player/
      PlayerController.ts
      InventoryManager.ts
      CollectibleItem.ts

    NPC/
      NPC_AI.ts

    Entity/
      Resources/
        ResourceObject.ts
        DropItem.ts
      Items/
        food/
          FoodBase.ts
          fruits/
            coconut.ts

    UI/
      UIManager.ts
      InventoryUIController.ts

    Map/
      NewScript - 001.ts

    Utils/
      NewScript - 002.ts

  Textures/
    Inventory/
    mystic_woods_free_2.2/
    100 FOOD ASSETS/
    100 Retro Magic Sound Effects/
    GUI - The Stone/
    Platformer Tileset - Pixelart Snow Mountain/
    Desert Pixel Art Environment/
    Animals/
```

## Core

位置：`assets/Scripts/Core`

- `Constants.ts`
  - 定義 `GameEvent`
  - 定義 `EntityType`
  - 目前事件包含：
    - `PLAYER_HP_CHANGED`
    - `PLAYER_EXP_CHANGED`
    - `PLAYER_DIED`
    - `NPC_MOCKED`
    - `NPC_DIED`
    - `SPAWN_ITEM`

- `EventCenter.ts`
  - 專案內自製事件中心。
  - 用於 Player / UI / GameManager / NPC 之間的低耦合通知。

- `BaseEntity.ts`
  - Player 與 NPC 的共同生命值基底。
  - 欄位：
    - `type`
    - `maxHp`
    - `currentHp`
  - 方法：
    - `takeDamage(amount)`
    - `onDamaged()`
    - `die()`
  - 後續建議：
    - 補 `isDead`
    - HP clamp 到 0
    - 補 `receiveAttack(amount, attackerNode)` 統一攻擊入口

- `GameManager.ts`
  - Singleton。
  - 啟用 PhysicsManager。
  - 提供 `showPhysicsDebugDraw` Inspector 開關。
  - 監聽 `PLAYER_DIED`。

## Attack

位置：`assets/Scripts/Attack`

- `CombatHitbox.ts`
  - 目前唯一通用近戰攻擊 hitbox 腳本。
  - 負責：
    - 啟用 / 關閉攻擊碰撞框
    - 設定 attack hitbox local position
    - 設定 sensor collider 與 contact listener
    - 依 faction 與可命中類型過濾目標
    - 呼叫目標 `receiveAttack()` 或 `takeDamage()`
  - 目前 faction：
    - `PLAYER`
    - `PEACE_NPC`
    - `NEUTRAL_NPC`
    - `HOSTILE_NPC`

## Player

位置：`assets/Scripts/Player`

- `PlayerController.ts`
  - 玩家移動、跳躍、攻擊、受傷、死亡。
  - 使用 `CombatHitbox` 處理攻擊。
  - `B` 可切換背包 UI。
  - 目前有測試用 `T` 加物品邏輯。
  - 目前風險：
    - 部分中文字串顯示為亂碼，需確認是否造成 TS 編譯錯。

- `InventoryManager.ts`
  - 背包資料 singleton。
  - `Item` 目前包含：
    - `id`
    - `name`
    - `count`
    - `description`
  - `addItem()` 會堆疊同 id 物品，並 emit `INVENTORY_CHANGED`。
  - `getItems()` 回傳背包內容。
  - 後續旅行商人需要擴充：
    - `removeItem(id, count)`
    - `getItemCount(id)`
    - `canAddItem(...)`
    - `hasItem(id, count)`

- `CollectibleItem.ts`
  - 可撿拾物件，接觸 Player 後加入背包。
  - 目前風險：
    - 部分中文字串顯示為亂碼，需確認是否造成 TS 編譯錯。

## NPC

位置：`assets/Scripts/NPC`

- `NPC_AI.ts`
  - 目前支援 Peace / Neutral / Hostile 類型。
  - Hostile NPC 可追蹤、攻擊、受傷、死亡、顯示 HP bar。
  - 使用 `CombatHitbox` 進行攻擊判定。
  - Slime animation 命名：
    - `idle_front`
    - `idle_right`
    - `idle_back`
    - `move_front`
    - `move_right`
    - `move_back`
    - `attack_front`
    - `attack_right`
    - `attack_back`
    - `damaged_front`
    - `damaged_right`
    - `damaged_back`
    - `death`
  - 後續旅行商人不建議直接塞進 `NPC_AI.ts`：
    - 商人是 peace NPC
    - 不需要攻擊
    - 需要閒逛、互動提示、對話、商店、生成與消失規則
    - 建議新增 `MerchantNPC.ts` 或通用 `NPCWander.ts` + `MerchantNPC.ts`

## Entity / Resources / Items

位置：`assets/Scripts/Entity`

- `Resources/ResourceObject.ts`
  - Tree / Ore 點擊互動。
  - 距離檢查。
  - 耐久扣減。
  - 掉落 `DropItem` prefab。

- `Resources/DropItem.ts`
  - 資源掉落物的物理彈出與狀態。

- `Items/food/FoodBase.ts`
  - 食物掉落物基底。
  - 支援靠近玩家吸附、加入 Inventory。
  - 目前可作為未來 `ItemData` 的參考，但商店資料不應直接依賴 Mono Component。

- `Items/food/fruits/coconut.ts`
  - 椰子食物實作。
  - 旅行商人目前需求中，椰子數量會暫時作為金錢。

## UI

位置：`assets/Scripts/UI`

- `UIManager.ts`
  - HUD。
  - 監聽 `PLAYER_HP_CHANGED` / `PLAYER_EXP_CHANGED`。
  - 更新 HP bar / EXP label。

- `InventoryUIController.ts`
  - 背包 UI。
  - 監聽 `INVENTORY_CHANGED`。
  - 顯示 slot label。
  - 後續旅行商店 UI 可參考此事件刷新模式。

## Map

位置：`assets/Scripts/Map`

- 目前只有 `NewScript - 001.ts`，尚未形成正式 MapManager。
- 後續旅行商人生成位置需要：
  - 玩家 world position
  - 可站立地面或簡化 spawn range
  - `minSpawnDistance` / `maxSpawnDistance`
  - 存在時間與無交易消失時間

## 目前跨模組流程

```text
PlayerController
  -> CombatHitbox
  -> BaseEntity / NPC_AI.receiveAttack()

NPC_AI
  -> CombatHitbox
  -> PlayerController.takeDamage()

ResourceObject
  -> DropItem / FoodBase
  -> InventoryManager.addItem()
  -> INVENTORY_CHANGED
  -> InventoryUIController.refreshUI()

PlayerController
  -> PLAYER_HP_CHANGED
  -> UIManager

PlayerController
  -> PLAYER_DIED
  -> GameManager
```

## 旅行商人開發建議位置

建議新增：

```text
assets/Scripts/Data/
  ItemData.ts
  MerchantPool.ts

assets/Scripts/NPC/
  MerchantNPC.ts
  MerchantSpawner.ts

assets/Scripts/UI/
  DialogueUIController.ts
  MerchantShopUIController.ts
```

可選擇新增：

```text
assets/Prefabs/NPCs/TravelingMerchant.prefab
assets/Prefabs/UI/MerchantShopPanel.prefab
assets/Prefabs/UI/DialoguePanel.prefab
```

## 目前風險與注意事項

1. `structure.md` 舊版內容曾出現亂碼，已重寫。
2. 多個程式檔中的中文 log / description 看起來有亂碼，需確認是否造成 TypeScript 字串未閉合。
3. `InventoryManager` 目前只支援 add/get，不足以支援商店扣款與購買。
4. `NPC_AI.ts` 偏戰鬥 NPC，旅行商人應獨立腳本，避免把 peaceful 互動與 hostile AI 混在一起。
5. 商店 UI 需要與背包同步，應使用 `INVENTORY_CHANGED` 或新增 typed `GameEvent`。

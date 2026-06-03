# Cocos Sanctuary 專案架構與分工

> 本文件整理目前專案實際架構、模組責任、組員分工與整合注意事項。
> `PLAN.md` 保持短期開發計畫；`structure.md` 放長期架構與分工。

## 專案概況

- 引擎：Cocos Creator 2.4.8
- 類型：2D 生存 / 探索 / Terraria-like 雛形
- 主要場景：
  - `assets/Scenes/Game.fire`
  - `assets/Scenes/GameOver.fire`
  - `assets/Scenes/MenuScene.fire`
- 主要腳本根目錄：`assets/Scripts`
- 主要素材根目錄：`assets/Textures`

## 目前目錄架構

```text
assets/
  Scenes/
    Game.fire
    GameOver.fire
    MenuScene.fire

  Scripts/
    Core/
      BaseEntity.ts
      Constants.ts
      EventCenter.ts
      GameManager.ts

    Player/
      PlayerController.ts
      PlayerAttackHitbox.ts

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

    Map/
      NewScript - 001.ts

    Utils/

  Textures/
    Inventory/
    mystic_woods_free_2.2/
    100 Retro Magic Sound Effects/
    100 FOOD ASSETS/
    2D Casual Background HD V.2/
    2D Casual Background HD V.3/
    Desert Pixel Art Environment/
    GUI - The Stone/
    Platformer Tileset - Pixelart Snow Mountain/
    Rainforest - Platformer Tileset/
    Purple Planet - Platformer Tileset/
    Traps and Tileset/
```

## 核心模組

### Core

位置：`assets/Scripts/Core`

職責：

- 管理全域事件、基礎實體、遊戲流程。
- 避免 Player、NPC、UI、物件彼此硬抓太多。

檔案：

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
  - 全域事件中心。
  - 提供 `on / emit / off / clear`。
  - 事件溝通優先用這裡，不建議跨組直接互相抓 component。

- `BaseEntity.ts`
  - 所有有 HP 的角色基底。
  - 目前提供：
    - `type`
    - `maxHp`
    - `currentHp`
    - `takeDamage(amount)`
    - `onDamaged()`
    - `die()`
  - 待補：
    - HP clamp
    - `isDead`
    - `heal(amount)`
    - 更穩定的死亡防重複觸發

- `GameManager.ts`
  - Singleton。
  - 啟用 PhysicsManager。
  - 監聽 `PLAYER_DIED`。
  - 待補完整 Game Over / restart / pause 流程。

## Player 模組

位置：`assets/Scripts/Player`

職責：

- 玩家移動、跳躍、攻擊輸入、玩家受傷與死亡流程。
- 玩家攻擊 NPC 使用 hitbox 碰撞判定。

檔案：

- `PlayerController.ts`
  - 控制左右移動與跳躍。
  - 播放 `PlayerIdle / PlayerRun / PlayerAttack / PlayerHurt / PlayerDie`。
  - 左鍵攻擊。
  - 右鍵目前可測試玩家受傷。
  - 透過 `EventCenter` 發送玩家 HP / death 事件。

- `PlayerAttackHitbox.ts`
  - 玩家攻擊用碰撞箱。
  - 攻擊時短暫啟用 `PhysicsCollider`。
  - 碰到 NPC hurtbox 後呼叫 `NPC_AI.receiveAttack(damage, attackerNode)`。

建議 Player 節點：

```text
Player
  PlayerController
  RigidBody
  PhysicsBoxCollider
  Sprite_Body
    Sprite
    Animation
  AttackHitbox
    PlayerAttackHitbox
    RigidBody
    PhysicsBoxCollider
```

AttackHitbox 建議：

- `RigidBody.type = Kinematic`
- `PhysicsBoxCollider.sensor = true`
- collider 預設可 disabled，由腳本攻擊時打開
- `PlayerAttackHitbox.debugLog = true` 可用來測試命中

## NPC 模組

位置：`assets/Scripts/NPC`

職責：

- 通用 NPC 行為。
- Peace / Neutral / Hostile 模式。
- 追蹤、近戰攻擊、受傷、死亡、血條。
- 播放 slime 方向動畫。

檔案：

- `NPC_AI.ts`
  - Inspector 可設定：
    - `type`
    - `maxHp`
    - `targetPlayer`
    - `autoFindTarget`
    - `targetNodeName`
    - `debugLog`
    - `showHpBar`
    - `hpBar`
    - `detectRadius`
    - `attackRange`
    - `attackDamage`
    - `attackCooldown`
    - `moveSpeed`
    - `attackType`
    - `chaseTarget`
    - `attackAnimLockTime`
    - `damagedAnimLockTime`

Slime 動畫命名規則：

```text
idle_front
idle_right
idle_back
move_front
move_right
move_back
attack_front
attack_right
attack_back
damaged_front
damaged_right
damaged_back
death
```

方向規則：

- 目標在下方：`front`
- 目標在上方：`back`
- 目標在右方：`right`
- 目標在左方：播放 `right`，`Sprite_Body.scaleX = -1`

建議 Slime 節點：

```text
Slime
  NPC_AI
  RigidBody
  PhysicsBoxCollider
  Sprite_Body
    Sprite
    Animation
  HpBar
    ProgressBar
    bar
      Sprite
```

Slime collider 建議：

- `RigidBody.type = Kinematic`
- `PhysicsBoxCollider.sensor = true`
- collider 大小包住 slime 身體即可
- 若 hurtbox 放在子節點，`PlayerAttackHitbox` 會往 parent 找 `NPC_AI`

注意：

- NPC 攻擊玩家目前仍用距離判斷。
- 玩家攻擊 NPC 已改為 hitbox 碰撞判定。
- 商人或非戰鬥 NPC 可關閉 `showHpBar`。

## Entity / Resource 模組

位置：`assets/Scripts/Entity`

職責：

- 可互動資源、掉落物、食物道具。
- 目前這組和地圖 / 物件分工關係最密切。

檔案：

- `Resources/ResourceObject.ts`
  - 樹 / 礦石類資源。
  - 左鍵互動。
  - 使用距離判斷玩家是否可互動。
  - 耐久歸零後生成掉落物或改變 sprite。

- `Resources/DropItem.ts`
  - 掉落物彈出、落地、吸向玩家、收集。
  - 使用 RigidBody / PhysicsCollider。

- `Items/food/FoodBase.ts`
  - 食物掉落與吸附邏輯。
  - 預留食用恢復 HP / stamina。

- `Items/food/fruits/coconut.ts`
  - 椰子食物實作。

## UI 模組

位置：`assets/Scripts/UI`

職責：

- HUD 顯示。
- 接收事件更新 UI。

檔案：

- `UIManager.ts`
  - 監聽 `PLAYER_HP_CHANGED`
  - 監聽 `PLAYER_EXP_CHANGED`
  - 更新 HP progress bar
  - 更新 EXP label

待補：

- Score UI
- Item bar
- Game Over panel
- NPC 相關 UI 若需要集中管理，可從 `NPC_DIED` 接事件

## Map 模組

位置：`assets/Scripts/Map`

目前狀態：

- `NewScript - 001.ts` 仍是預設空腳本。

待補：

- 地圖資料結構
- 地形 / tile / collider
- 場景邊界
- 資源物件放置規則

## 五人分工建議

### 1. Player 組

負責：

- `assets/Scripts/Player`
- 玩家移動、跳躍、攻擊、受傷、死亡。
- 玩家攻擊 hitbox。
- 玩家動畫。

交付：

- 玩家可移動、跳躍。
- 左鍵攻擊可命中 NPC。
- 玩家受傷會更新 UI。
- 玩家死亡會發送 `PLAYER_DIED`。

### 2. NPC 組

負責：

- `assets/Scripts/NPC/NPC_AI.ts`
- NPC prefab。
- NPC 動畫 clips。
- NPC hurtbox / hp bar。

交付：

- Slime 可追蹤玩家。
- Slime 可攻擊玩家。
- Slime 可被玩家 hitbox 打到。
- Slime 受傷 / 死亡 / 攻擊動畫可播。
- 商人等和平 NPC 可使用同腳本但關閉攻擊與血條。

### 3. 地圖 / Tile 組

負責：

- `assets/Scripts/Map`
- 場景地形、tile、平台、地面 collider。
- 世界邊界。

交付：

- `Game.fire` 有可玩的測試地圖。
- Player / NPC / 掉落物可正確站在地面或被地形限制。
- 後續可支援 tilemap。

### 4. 物件 / 掉落 / 資源組

負責：

- `assets/Scripts/Entity/Resources`
- `assets/Scripts/Entity/Items`
- 樹、礦石、掉落物、食物。

交付：

- 樹 / 礦石可互動。
- 互動後可掉落 item。
- 掉落物可吸向玩家並收集。
- 食物可預留恢復效果。

### 5. Core / UI / 整合 PM 組

負責：

- `assets/Scripts/Core`
- `assets/Scripts/UI`
- `PLAN.md`
- `structure.md`
- 分支整合與事件命名。

交付：

- 維護 `GameEvent`。
- 確保 Player / NPC / Entity / UI 透過事件或明確 API 互動。
- 整合 Game Over / Restart。
- 維持文件更新。

## 模組互動規則

### 事件優先

跨組通知優先透過 `EventCenter`：

```text
Player damaged -> PLAYER_HP_CHANGED -> UIManager
Player dead    -> PLAYER_DIED       -> GameManager
NPC dead       -> NPC_DIED          -> 掉落 / Score / UI
Spawn item     -> SPAWN_ITEM        -> 掉落物系統
```

### 直接呼叫只用於近距離 gameplay

允許直接呼叫的例子：

```text
PlayerAttackHitbox -> NPC_AI.receiveAttack()
NPC_AI             -> PlayerController/BaseEntity.takeDamage()
ResourceObject     -> DropItem.launch()
```

不建議：

- UI 直接改 Player 內部狀態
- NPC 直接改 UI
- ResourceObject 直接改 GameManager 分數

## 當前高優先修正事項

1. 統一 NPC 腳本路徑
   - 目前應以 `assets/Scripts/NPC/NPC_AI.ts` 作為正式路徑。
   - 若還有 `assets/Scripts/Entity/NPC_AI.ts` 舊檔，應刪除或停止引用，避免兩份邏輯分裂。

2. 修整 `PlayerController.ts`
   - 目前 `onLoad()` 內有重複 `super.onLoad()`、重複設定 `type`、重複註冊鍵盤事件的跡象。
   - 應整理成單一初始化流程。

3. 修整 `BaseEntity.ts`
   - `takeDamage()` 應 clamp 到 0。
   - 加入 `isDead` 防止重複死亡。
   - 補 `heal(amount)`。

4. 攻擊碰撞測試
   - Player `AttackHitbox` 需要 `RigidBody + PhysicsBoxCollider`。
   - NPC 需要 `RigidBody + PhysicsBoxCollider`。
   - PhysicsManager 已在 `GameManager` / `PlayerController` 啟用，但建議統一由 `GameManager` 啟用。

5. UI 擴充
   - 增加 Score。
   - 增加 Game Over panel。
   - 增加 item bar。

## 建議分支

```text
feature/player-control
feature/npc-combat
feature/map-terrain
feature/items-resources
feature/core-ui-flow
```

整合順序建議：

1. `feature/core-ui-flow`
2. `feature/player-control`
3. `feature/npc-combat`
4. `feature/items-resources`
5. `feature/map-terrain`

## Editor 設定備忘

### Player 攻擊 hitbox

```text
Player
  AttackHitbox
    PlayerAttackHitbox
    RigidBody: Kinematic
    PhysicsBoxCollider: sensor = true
```

### NPC hurtbox

```text
Slime
  NPC_AI
  RigidBody: Kinematic
  PhysicsBoxCollider: sensor = true
```

### NPC animation

`Animation` 建議掛在 `Sprite_Body`，clips 名稱必須和 `NPC_AI.ts` 使用的字串完全一致。

### NPC hp bar

```text
Slime
  HpBar
    ProgressBar
    bar
      Sprite
```

`NPC_AI.showHpBar = false` 可用於商人、對話 NPC 等不需要血條的角色。

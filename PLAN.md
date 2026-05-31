# Cocos Sanctuary 簡單規劃

## 目標

先做出一個可以在 Cocos Creator 2.4.8 跑起來的 2D 生存 / 探索雛形：

- 玩家可以移動、受傷、死亡、累積經驗。
- NPC 有基礎敵對 / 中立行為。
- UI 可以顯示血量與經驗。
- 地圖、素材、音效先整理乾淨，再逐步擴充。

## 開發順序

- [ ] 1. 整理素材資料夾
- [ ] 2. 修正核心腳本可編譯問題
- [ ] 3. 建立基本場景層級
- [ ] 4. 接上玩家移動與血量 UI
- [ ] 5. 實作 NPC 偵測與攻擊
- [ ] 6. 加入地圖 / Tile / 障礙物
- [ ] 7. 加入音效、動畫與死亡結算

## 近期優先事項

### 1. 素材整理

- [ ] 把 Unity 專用檔移出 `assets/`，例如 `.anim`、`.controller`、`.unity`、`.unitypackage`、Unity `.prefab`、Unity `.asset`。
- [ ] 保留可用的 `.png`、`.jpg`、必要 `.wav`。
- [ ] 將音效從 `assets/Textures/` 之後整理到較合理的位置，例如 `assets/Audio/`。
- [ ] 只把遊戲真的會用到的素材放進 Cocos 專案，原始素材包另外備份。

注意：不要批量刪除。需要清理時，由使用者手動確認或一次處理明確單一檔案。

#### Textures 殘留檔案位置清單

這些位置包含 Unity 專用或 Cocos 不適合直接匯入的檔案，例如 `.anim`、`.controller`、`.unity`、`.unitypackage`、Unity `.prefab`、Unity `.asset`、`.cs`。之後清理時優先檢查這些資料夾，只把真正會用到的 `.png`、`.jpg`、必要 `.wav` 留在 Cocos 專案裡。

清理目標：

- [ ] `Platformer Tileset - Pixelart Snow Mountain`
- [ ] `Desert Pixel Art Environment`
- [ ] `GUI - The Stone`
- [ ] `Rainforest - Platformer Tileset`
- [ ] `Unique Toon Projectiles Vol. 1`
- [ ] `Purple Planet - Platformer Tileset`
- [ ] `Traps and Tileset`
- [ ] `2D Casual Background HD V.3`
- [ ] `2D Casual Background HD V.2`
- [ ] `100 FOOD ASSETS`

```text
assets/Textures/
├── Platformer Tileset - Pixelart Snow Mountain/
│   └── Assets/BigManJD/Platformer Tileset - Pixelart Snow Mountain/
│       ├── v2.0.0/
│       │   ├── Tileset Palette/
│       │   │   ├── Rock/             .asset x200
│       │   │   ├── Ice/              .asset x189
│       │   │   ├── Background/       .asset x165
│       │   │   ├── Snow/             .asset x52
│       │   │   ├── Spikes/           .asset x8
│       │   │   ├── Platforms/        .asset x3
│       │   │   └── root              .prefab x1
│       │   ├── Prefabs/              .prefab x26
│       │   ├── Character/Animations/ .anim x6
│       │   └── Scenes/
│       │       ├── DemoAnims/        .anim x3, .controller x3
│       │       └── root              .unity x2
│       └── v1.0.0/
│           ├── Tileset Palette/
│           │   ├── Ice/              .asset x45
│           │   ├── Rock/             .asset x30
│           │   ├── Spikes/           .asset x12
│           │   ├── Climbing/         .asset x10
│           │   ├── Background/       .asset x9
│           │   ├── Platforms/        .asset x3
│           │   └── root              .prefab x1
│           ├── Prefabs/              .prefab x10
│           ├── Character/Animations/ .anim x1, .controller x1
│           └── Scenes/               .unity x2
│
├── Desert Pixel Art Environment/
│   └── Assets/Desert_pixel_art_environment/
│       ├── Tiles/                    .asset x164
│       ├── Prefabs/                  .prefab x126
│       ├── Scenes/                   .unity x2
│       └── Palette/                  .prefab x1
│
├── GUI - The Stone/
│   └── Assets/Layer Lab/
│       ├── GUI-TheStone/
│       │   ├── Prefabs/
│       │   │   ├── Prefabs_Component_Frames/        .prefab x36
│       │   │   ├── Prefabs_DemoScene/               .prefab x30
│       │   │   ├── Prefabs_Component_Buttons/       .prefab x23
│       │   │   ├── Prefabs_Component_ActionText/    .prefab x19
│       │   │   ├── Prefabs_Component_Sliders/       .prefab x19
│       │   │   ├── Prefabs_Component_UI_Etc/        .prefab x15
│       │   │   ├── Prefabs_Component_Labels-Titles/ .prefab x13
│       │   │   └── Prefabs_Component_Popups/        .prefab x3
│       │   ├── ResourcesData/Fonts/                 .asset x5
│       │   ├── Scene/                               .unity x1
│       │   └── PSD,AI/                              .unitypackage x1
│       └── Scripts/                                 .cs x2
│
├── Rainforest - Platformer Tileset/
│   └── Assets/Rainforest/
│       ├── animations/              .anim x2, .controller x2
│       └── root                     .unity x1
│
├── Unique Toon Projectiles Vol. 1/
│   └── Assets/GabrielAguiarProductions/ .unitypackage x3
│
├── Purple Planet - Platformer Tileset/
│   └── Assets/Purple Planet/        .unity x1
│
├── Traps and Tileset/
│   └── Assets/TrapsTileset/Scenes/  .unity x1
│
├── 2D Casual Background HD V.3/
│   └── Assets/2D Casual background HD V.3/Scene/ .unity x1
│
├── 2D Casual Background HD V.2/
│   └── Assets/2D Casual background HD V.2/Scene/ .unity x1
│
└── 100 FOOD ASSETS/
    └── Assets/food/                 .unity x1
```

### 2. 核心腳本

核心腳本位置：`assets/Scripts/Core/`

#### Constants.ts

職責：集中管理遊戲共用常數，避免事件名稱和實體類型散落在各腳本。

目前內容：

- `GameEvent.PLAYER_HP_CHANGED`：玩家血量改變時通知 UI。
- `GameEvent.PLAYER_EXP_CHANGED`：玩家經驗值改變時通知 UI。
- `GameEvent.PLAYER_DIED`：玩家死亡時通知 GameManager。
- `GameEvent.NPC_MOCKED`：預留給 NPC 被嘲諷或觸發敵意。
- `GameEvent.SPAWN_ITEM`：預留給掉落物或生成道具。
- `EntityType`：玩家、和平 NPC、中立 NPC、敵對 NPC。

下一步：

- [ ] 新增功能前先確認事件是否已存在，不要在其他腳本硬打字串。
- [ ] 之後若加入道具、地圖、結算，可在這裡擴充 `GameEvent`。

#### EventCenter.ts

職責：全域事件中心，讓 Player、UI、GameManager 不需要直接互相抓節點也能溝通。

目前流程：

```text
EventCenter.on(...)   註冊監聽
EventCenter.emit(...) 發送事件
EventCenter.off(...)  移除監聽
```

目前問題：

- `on()` 內部存的是 `callback.bind(target)` 產生的新 function。
- `off()` 卻拿原本的 `callback` 去比對，所以可能移除不到監聽。
- 場景切換或節點銷毀後，事件可能殘留。

下一步：

- [ ] 調整事件資料結構，記錄 `callback`、`target`、`handler`。
- [ ] 讓 `off(eventName, callback, target)` 可以正確找到並移除同一筆監聽。
- [ ] 在 `onDestroy()` 中確認 GameManager、UIManager 都會取消事件。

#### BaseEntity.ts

職責：所有可受傷實體的基底，例如 Player、NPC。

目前內容：

- `type`：實體類型，可在 Inspector 下拉選。
- `maxHp`：最大生命值，可在 Inspector 調整。
- `currentHp`：目前生命值，`onLoad()` 時設為 `maxHp`。
- `takeDamage(amount)`：扣血、呼叫 `onDamaged()`、血量小於等於 0 時呼叫 `die()`。
- `onDamaged()`：給子類覆寫，例如玩家受傷時通知 UI。
- `die()`：給子類覆寫，預設直接 destroy node。

下一步：

- [ ] 確認扣血不會變成負數，必要時 clamp 到 0。
- [ ] 視需求加入 `heal(amount)`、`isDead`，避免死亡邏輯重複觸發。
- [ ] Player 和 NPC 的死亡特效、掉落物、分數等都由子類覆寫處理。

#### GameManager.ts

職責：遊戲流程總管理器，負責初始化、全域事件反應、Game Over 流程。

目前內容：

- 使用 `GameManager.instance` 做簡單 Singleton。
- Inspector 欄位 `playerNode` 用來掛玩家節點。
- `onLoad()` 註冊 `PLAYER_DIED`。
- `onGameOver()` 目前只印 log，之後接死亡結算 UI。
- `start()` 預留 MapManager 初始化。

目前問題：

- `EventCenter.ts` 是 default export，但 `GameManager.ts` 現在寫 `import { EventCenter } from "./EventCenter";`，可能編譯失敗。
- `onDestroy()` 呼叫 `EventCenter.off(GameEvent.PLAYER_DIED, this.onGameOver)`，但目前 `EventCenter.off()` 還不能正確處理 bind 後的 function。

下一步：

- [ ] 改成 `import EventCenter from "./EventCenter";`。
- [ ] 等 `EventCenter.off()` 修好後，確認 `onDestroy()` 能正確取消 `PLAYER_DIED`。
- [ ] 補 `onGameOver()`：暫停玩家/NPC、顯示結算 UI、必要時切換場景。

#### 相關非 Core 腳本

- [ ] `assets/Scripts/UI/UIManager.ts` 也要把 `import { EventCenter } from "../Core/EventCenter";` 改成 default import。
- [ ] `assets/Scripts/Player/PlayerController.ts` 目前已使用 default import，是正確方向。
- [ ] 核心腳本修完後，測試 `PlayerController.takeDamage()` -> `PLAYER_HP_CHANGED` -> `UIManager` 更新血條。
- [ ] 測試玩家死亡時 `PLAYER_DIED` -> `GameManager.onGameOver()` 是否觸發。

### 3. 場景與 Inspector

- [ ] 建立 Canvas 層級：`Core_Controllers`、`World_Root`、`UI_Root`。
- [ ] 在 `Core_Controllers/GameManager` 掛上 `GameManager.ts`。
- [ ] 建立玩家節點，掛上 `PlayerController.ts`。
- [ ] 建立 HUD，掛上 `UIManager.ts`。
- [ ] 在 Inspector 連接 `playerNode`、`expLabel`、`hpBar`。

## 功能規劃

### Player

- [ ] WASD 移動。
- [ ] 血量、受傷、死亡。
- [ ] 經驗值累積。
- [ ] 達到條件後進化，提升能力。
- [ ] 之後補動畫狀態，例如 idle、walk、hurt、die。

### NPC

- [ ] 敵對 NPC 進入範圍後攻擊玩家。
- [ ] 中立 NPC 被觸發後變敵對。
- [ ] 補上 `attackTarget()` 的實際扣血邏輯。
- [ ] 之後補巡邏、追蹤、死亡掉落。

### UI

- [ ] 血條顯示。
- [ ] 經驗值顯示。
- [ ] 死亡 / Game Over 畫面。
- [ ] 之後補道具欄、氧氣條、排行榜或結算資料。

### Map

- [ ] 先用簡單靜態地圖測試玩家與 NPC。
- [ ] 再加入地圖層：校園、海洋、地下。
- [ ] 若 TileMap 匯入有問題，先用圖片背景 + 簡單 BoxCollider 做碰撞。

## 使用者手動設定

這些比較適合在 Cocos Creator Editor 裡手動做：

- [ ] 建立 / 調整場景節點。
- [ ] 拖拉 Inspector 欄位。
- [ ] 切 SpriteFrame、製作 AnimationClip。
- [ ] 整理素材、刪除不需要的 Unity 原始檔。
- [ ] 建立 Prefab。

## AI 可協助

- [ ] 修改 `.ts` 腳本。
- [ ] 更新 `NOTE.md` / `PLAN.md`。
- [ ] 檢查 import、事件流程、TypeScript 錯誤。
- [ ] 幫忙設計腳本架構與 Cocos Inspector 連接方式。
- [ ] 整理需要手動做的清單。

## Git 流程提醒

- `main/master`：穩定版，確認沒問題再合併。
- `develop`：平常開發主分支。
- `feature/*`：每個功能自己開分支，完成後 merge 回 `develop`。

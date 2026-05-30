# Cocos Sanctuary Note

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

- `Core/`
- `Player/`
- `Entity/`
- `UI/`

`Map/` 和 `Utils/` 是預留規劃方向，目前只有對應 `.meta`，之後需要實作地圖生成或工具函式時再補腳本。

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

## assets/Scripts 說明

這個資料夾放遊戲主要 TypeScript 腳本，目前架構是「核心系統 + 實體基底 + 玩家控制 + NPC AI + UI 更新」。

## Core

`Scripts/Core/` 是整個遊戲的地基，目前包含 `Constants.ts`、`EventCenter.ts`、`BaseEntity.ts`、`GameManager.ts`。

### Constants.ts

集中管理共用常數，也可以理解成全域常數字典。

- `GameEvent`：全域事件名稱，例如玩家血量改變、經驗改變、死亡。
- `EntityType`：實體類型，例如玩家、和平 NPC、中立 NPC、敵對 NPC。
- `cc.Enum(EntityType)`：讓 `EntityType` 可以在 Cocos Creator Inspector 中顯示為下拉選單。

這個檔案的重點是避免打錯字，例如把 `PLAYER_DIED` 寫成其他拼法導致事件收不到。之後要新增事件或 NPC 種類，統一從這裡加。

### EventCenter.ts

簡單的全域事件中心，負責在不同腳本之間傳遞資料，是觀察者模式的簡化實作。

- `EventCenter.on(eventName, callback, target)`：註冊事件。
- `EventCenter.emit(eventName, ...args)`：發送事件。
- `EventCenter.off(eventName, callback)`：取消事件。

典型用途：

```text
玩家扣血
  -> EventCenter.emit(GameEvent.PLAYER_HP_CHANGED, currentHp, maxHp)
  -> UIManager 接收事件
  -> 更新血條
```

### BaseEntity.ts

所有會動、有血量、會受傷的實體通用藍圖。Player、NPC 這類物件應該繼承它，而不是直接繼承 `cc.Component`。

- `type`：實體類型。
- `maxHp`：最大生命值，可在 Inspector 調整。
- `currentHp`：目前生命值。
- `takeDamage(amount)`：扣血並檢查是否死亡。
- `onDamaged()`：受傷後的 hook，給子類 override。
- `die()`：死亡邏輯，預設會 destroy 節點。

好處是血量、受傷、死亡這些基礎邏輯只要寫一次。不同角色只需要 override `onDamaged()` 或 `die()` 加上特效、音效、掉落物、分數等。

### GameManager.ts

遊戲流程管理器。

- 使用 `GameManager.instance` 做簡單 Singleton。
- 在 `onLoad()` 註冊 `PLAYER_DIED` 事件。
- `onGameOver()` 目前先印出結算訊息，之後可以接 UI 結算畫面、重新開始、切換場景等流程。
- `playerNode` 是 Inspector 欄位，可以把玩家節點拖進來。

## Player

### PlayerController.ts

玩家控制器，繼承 `BaseEntity`。

- WASD 控制移動方向。
- `moveSpeed` 可在 Inspector 調整。
- `update(dt)` 根據目前方向移動玩家節點。
- `gainExp(amount)` 增加經驗並發送 `PLAYER_EXP_CHANGED`。
- 經驗超過 1000 且等級為 1 時，呼叫 `evolveToUltimate()` 進化並增加移動速度。
- 受傷時發送 `PLAYER_HP_CHANGED`，讓 UI 更新血條。
- 死亡時發送 `PLAYER_DIED`，並把玩家節點設為 inactive。

## Entity

### NPC_AI.ts

NPC 行為腳本，繼承 `BaseEntity`。

- `detectRadius` 可在 Inspector 調整偵測距離。
- 敵對 NPC 會在玩家進入偵測範圍時攻擊。
- 中立 NPC 需要先被 `onMocked(playerNode)` 觸發，才會進入憤怒狀態並攻擊。
- `attackTarget()` 目前還是空函式，之後可以補上扣血、追蹤或播放攻擊動畫。

## UI

### UIManager.ts

負責把遊戲資料同步到 UI。

- `expLabel`：顯示玩家經驗值。
- `hpBar`：顯示玩家生命值比例。
- 監聽 `PLAYER_HP_CHANGED` 後更新血條。
- 監聽 `PLAYER_EXP_CHANGED` 後更新經驗文字。

## 事件流程

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
  -> EventCenter.emit(PLAYER_DIED)
  -> GameManager.onGameOver()
```

## Cocos Inspector 設定

- 掛 `GameManager.ts` 的節點需要把玩家節點拖到 `playerNode`。
- 掛 `PlayerController.ts` 的玩家節點可以調整 `maxHp` 和 `moveSpeed`。
- 掛 `NPC_AI.ts` 的 NPC 節點可以調整 `type`、`maxHp` 和 `detectRadius`。
- 掛 `UIManager.ts` 的 UI 節點需要把經驗 Label 拖到 `expLabel`，把血條 ProgressBar 拖到 `hpBar`。

## 目前注意事項

- `EventCenter.ts` 是 default export，所以其他腳本應使用 default import。
- `GameManager.ts` 和 `UIManager.ts` 若使用 `import { EventCenter } ...`，可能會造成編譯錯誤，建議改成 `import EventCenter ...`。
- `EventCenter.off()` 目前用原 callback 比對，但 `on()` 存的是 bind 後的新函式，取消事件時可能移除不到。之後若要頻繁切換場景，建議修正事件註冊資料結構。
- `NPC_AI.attackTarget()` 還沒有實作，現在只保留攻擊邏輯入口。

# Cocos Sanctuary Plan

> PLAN.md 盡量維持 300 行內。本檔只放高層規劃、目前進度與下一步。

## 專案目標

使用 Cocos Creator 2.4.8 製作 2D 生存 / 探索雛形，暫定遊戲名為 `Coconut Sanctuary`。

- 玩家可移動、受傷、累積 EXP / Score，並逐步接上工具與攻擊。
- NPC 分為 Peace / Neutral / Hostile，能根據狀態偵測與攻擊玩家。
- UI 顯示 HP、EXP、Score、Item bar 與 Game Over。
- 地圖先用簡單背景與碰撞完成 MVP，再逐步導入 TileMap / 素材。

## MVP 範圍

- [ ] 玩家 WASD 移動
- [ ] 玩家 HP / EXP / Score 資料流
- [ ] HUD 顯示 HP / EXP / Score
- [ ] 玩家受傷與死亡事件
- [ ] Game Over 流程
- [ ] 基礎 NPC 偵測與攻擊
- [ ] 簡單地圖與碰撞
- [ ] 基礎物品或資源互動

## 目前進度

### 已完成

- [x] Cocos Creator 2.4.8 專案建立
- [x] 基礎資料夾：`Core`、`Player`、`Entity`、`UI`、`Map`、`Utils`
- [x] `Constants.ts` 定義 `GameEvent`、`EntityType`
- [x] `BaseEntity.ts` 建立 HP / damage / die 基底
- [x] `PlayerController.ts` 建立 WASD 移動、左右翻面、Idle / Run 動畫切換
- [x] `NPC_AI.ts` 建立 Peace / Neutral / Hostile 通用行為
- [x] `UIManager.ts` 建立 HP / EXP UI 事件監聽外殼
- [x] `EventCenter.ts` 改為 default import 用法，並修正 callback / target / off 邏輯

### 進行中

- [ ] 核心事件流測試：Player -> EventCenter -> UIManager / GameManager
- [ ] 場景節點與 Inspector 綁定
- [ ] 玩家受傷、死亡、EXP 流程

### 尚未開始

- [ ] Score 系統
- [ ] Item bar
- [ ] 工具 / 武器 / 資源互動
- [ ] NPC 真正攻擊玩家
- [ ] Game Over UI
- [ ] 素材整理與地圖導入

## Core 規劃

### Constants.ts

用途：集中管理全域事件名稱與實體類型。

- `PLAYER_HP_CHANGED`
- `PLAYER_EXP_CHANGED`
- `PLAYER_DIED`
- `NPC_MOCKED`
- `SPAWN_ITEM`
- `EntityType.PLAYER`
- `EntityType.NPC_PEACE`
- `EntityType.NPC_NEUTRAL`
- `EntityType.NPC_HOSTILE`

### EventCenter.ts

用途：全域事件中心，避免 Player、UI、GameManager 直接互相抓節點。

目前狀態：

- [x] 使用 default export / default import
- [x] `on(eventName, callback, target)` 保存原 callback、target、實際 handler
- [x] `emit(eventName, ...args)` 使用 snapshot，避免 emit 中途增刪 listener 造成迭代問題
- [x] `off(eventName, callback, target)` 可精準移除同一組 callback + target
- [x] `off(eventName)` 可清除單一事件
- [x] `clear()` 可清除全部事件，方便切場景或測試

### BaseEntity.ts

用途：所有可受傷實體的基底，例如 Player、NPC。

下一步：

- [ ] `takeDamage()` clamp HP，不讓 HP 小於 0
- [ ] 加入 `isDead`，避免重複死亡
- [ ] 加入 `heal(amount)`
- [ ] Player / NPC 覆寫 `onDamaged()` 與 `die()`

### GameManager.ts

用途：管理遊戲狀態、Game Over、初始化流程。

目前狀態：

- [x] Singleton 外殼
- [x] 監聽 `PLAYER_DIED`
- [x] 修正 EventCenter default import
- [x] `onDestroy()` 帶 target 取消事件

下一步：

- [ ] 接上 `playerNode`
- [ ] `onGameOver()` 暫停玩家 / NPC
- [ ] 顯示 Game Over UI
- [ ] 視需要支援重新開始或回主選單

## Player 規劃

目前狀態：

- [x] WASD 移動
- [x] Idle / Run 動畫切換
- [x] 左右翻面

下一步：

- [ ] 加入背包功能
- [ ] WS更改為爬上爬下，空白鍵變為跳
- [ ] 覆寫 `onDamaged()`，發送 `PLAYER_HP_CHANGED`
- [ ] 覆寫 `die()`，發送 `PLAYER_DIED`
- [ ] 加入 `gainExp(amount)`，發送 `PLAYER_EXP_CHANGED`
- [ ] 加入 Score 或資源數值
- [ ] 加入測試按鍵或測試碰撞，方便驗證扣血流程

## NPC 規劃

目前狀態：

- [x] 有 `detectRadius`
- [x] 可在 Inspector 指定 `targetPlayer`
- [x] Neutral NPC 可被 `onMocked(playerNode)` 轉為 enraged
- [x] Hostile / Neutral 偵測與追蹤
- [x] 近戰 `attackTarget()` 可呼叫玩家 `takeDamage()`
- [x] 加入攻擊距離、傷害、冷卻時間
- [x] NPC 死亡時發送 `NPC_DIED`

下一步：

- [ ] 在 Cocos Editor 建立 Hostile NPC prefab
- [ ] 實測 NPC 是否能扣玩家血
- [ ] 接上 NPC idle / run / hurt / attack / die 動畫
- [ ] 規劃遠程攻擊與 projectile prefab
- [ ] 將 `NPC_DIED` 接到掉落物 / Score / EXP

## UI 規劃

目前狀態：

- [x] `UIManager` 監聽 HP / EXP 事件
- [x] 修正 EventCenter default import
- [x] `onDestroy()` 帶 target 取消事件

下一步：

- [ ] 場景中建立 HUD 節點
- [ ] Inspector 綁定 `hpBar`
- [ ] Inspector 綁定 `expLabel`
- [ ] 加入 Score label
- [ ] 加入 Game Over panel
- [ ] 加入 Item bar

## Map / Assets 規劃

短期：

- [ ] 優先加入 ground，讓重力有辦法測試
- [ ] 加入採集點 ex: 礦點、樹
- [ ] 加入部分食物進行測試(水果)
- [ ] 先用靜態背景圖做測試地圖
- [ ] 先用 BoxCollider 建立簡單邊界與障礙
- [ ] 放置玩家與 1 個測試 NPC

中期：

- [ ] 整理 `assets/Textures`
- [ ] 保留 Cocos 可直接用的 `.png`、`.jpg`、`.wav`
- [ ] 移除或隔離 Unity 專用 `.unity`、`.unitypackage`、`.controller`、`.asset`、`.cs`
- [ ] 規劃 TileMap 或 atlas

### Load Map

- [ ] 每個物件都做成 prefab
- [ ] 將所有物件特性定義在一份文件當中 (TileConfig)
- [ ] 一份 Tile Data 文件記錄整個大地圖每一個是甚麼方塊
- [ ] 一個 TileRenderer Node，產生玩家當前畫面附近的 tile 
 
## 下一步優先順序

1. 修 `BaseEntity`：HP clamp、`isDead`、`heal()`
2. 修 `PlayerController`：受傷 / 死亡 / EXP 事件
3. 建測試流程：按鍵扣血、按鍵加 EXP
4. 確認 UIManager 可更新血條與 EXP
5. 確認 GameManager 可收到玩家死亡
6. 在 Cocos Editor 綁定 GameManager、Player、UIManager
7. 建立 NPC prefab 並實測攻擊流程

## Git 流程

- `main/master`：穩定版
- `develop`：整合開發版
- `feature/*`：單一功能分支

## 分工

- player + 背包 : 許庭翊
- npc + 商人 : 林柏均
- 物件(礦、樹) : 傅康睿
- 物件(椰子) : 蔡敏中
-  : 田俊騏
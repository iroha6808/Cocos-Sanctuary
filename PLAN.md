# Cocos Sanctuary Plan

> 更新日期：2026-06-04
> 本檔只放高層規劃、目前進度、下一步與手動設定。詳細架構見 `structure.md`，功能追蹤見 `NOTE.md`。

## 目錄

- [下一步優先順序](#下一步優先順序)
- [企劃摘要](#企劃摘要)
- [MVP 範圍](#mvp-範圍)
- [需求拆解](#需求拆解)
- [目前進度](#目前進度)
- [分工](#分工)
- [模組規劃](#模組規劃)
- [手動設定](#手動設定)
- [Git 流程](#git-流程)

## 下一步優先順序

掉落物、水
1. 移除或包裝 debug 行為：`T` 加 coconut、滑鼠右鍵扣血。
2. 統一物品收集流程：讓 `DropItem.ts` 收集後也能進 `InventoryManager`。
3. 統一回血 API：處理 `coconut.ts` 找 `PlayerStats`，但玩家主腳本是 `PlayerController` 的問題。
4. 補 `Score / EXP` 資料流與 UI：Score label、EXP 增加、NPC_DIED / 採集加分。
5. 完成 Game Over 流程：`GameManager.onGameOver()` 接結算 UI 或場景。
6. 檢查 Cocos Editor Inspector 綁定：Player、NPC、Merchant、Resource、UI。
7. 整理 Map 系統：先固定 `Canvas/Player` 路徑，之後再拆 `TileConfig / TileData / TileRenderer`。

## 企劃摘要

遊戲名稱：`Coconut Sanctuary`

背景：傳說探險家 Chu Hong Kuo 發現由椰子能量驅動的神祕島嶼，玩家作為開拓者，需要採集資源、對抗怪物、累積 EXP / Score，爭奪 `Golden Coconut` 與排行榜。

核心玩法：

- 側視 2D 探索，有地面、水中、高低差與碰撞物件。
- 玩家可移動、跳躍、攻擊、受傷、死亡。
- 採集樹、水果、礦物等資源。
- 背包與商人交易使用 coconut 作為暫時貨幣。
- NPC 分為 Peace / Neutral / Hostile。
- Neutral NPC 被嘲諷或攻擊後 enraged。
- 長期延伸包含 PvE、PvP、交通工具 car / boat / wing、排行榜。

## MVP 範圍

- [x] 玩家左右移動、跳躍
- [x] 玩家 HP 與受傷 / 死亡事件
- [x] Player attack hitbox
- [x] 基礎 NPC 偵測、追蹤、近戰攻擊
- [x] 背包資料與背包 UI
- [x] 商人對話與商店交易
- [x] Tree / Ore 資源互動與掉落物生成
- [x] GameOver 場景切換
- [ ] EXP / Score 資料流
- [ ] Score UI
- [ ] 正式 Game Over 結算 UI
- [ ] 地圖資料化 / TileRenderer

## 需求拆解

### 分工

| 主要負責 | 內容 |
| --- | --- |
| Player + 背包 | 玩家控制、玩家狀態、背包 / item bar、道具切換 |
| NPC + 商人 | Peace / Neutral / Hostile、NPC 攻擊、商人互動 |
| 物件：礦、樹 | 採礦、採果、資源點、可互動物件 prefab |
| 物件：椰子 | 椰子相關道具、回血水果、掉落物或採集回饋 |
| 掉落物、水 |  |

### High Risk

| 功能 | 風險原因 | 階段 |
| --- | --- | --- |
| 地圖碰撞 / TileRenderer | TileMap、BoxCollider、玩家移動與固定路徑 `Canvas/Player` 會互相影響 | MVP |
| Player 狀態流 | HP 已接，EXP / Score / heal 尚未統一 | MVP |
| 物品收集 | `FoodBase` 會進背包，但 `DropItem` 目前只 destroy | MVP |
| 商人交易 | 已可買賣，但仍依賴 debug coconut 與 Inspector UI 綁定 | MVP |
| Game Over | 玩家會切 GameOver，但 `GameManager.onGameOver()` 尚未接結算 UI | MVP |
| 素材清理 | `assets/Textures` 混 Unity 檔與 Cocos 可用素材 | 延伸 |

### High Value

| 功能 | 價值原因 | 階段 |
| --- | --- | --- |
| 三類 NPC 差異 | Peace / Neutral / Hostile 是企劃核心賣點 | MVP |
| 商人 NPC | 讓探索和背包有實際用途 | MVP |
| 掉落物與撿取 | 採集、戰鬥、成長流程會串起來 | MVP |
| 水果回血 / 礦物製作 | 讓資源有用途，不只是加分 | 延伸 |
| 升級 / 死亡動畫 | 展示效果明顯 | 延伸 |
| PvP | 企劃亮點但成本高，先不進 MVP | 延伸 |
| 交通工具 car / boat / wing | 可展示地面、水中、空中探索差異 | 延伸 |

## 目前進度

### 已完成

- [x] Cocos Creator 2.4.8 專案建立
- [x] Scenes：`Game`、`MenuScene`、`GameOver`
- [x] Prefabs：Player、Slime、TravelingMerchant、Tree、Ore、FruitDrop、OreDrop、coconut
- [x] Player 動畫：Idle、Run、Jump、Attack、Hurt、Die
- [x] `Constants.ts` 定義事件與 EntityType
- [x] `EventCenter.ts` 修正 callback / target / off 邏輯
- [x] `GameManager.ts` 啟用 physics，監聽 `PLAYER_DIED`
- [x] `PlayerController.ts` 支援 A/D、Space、左鍵攻擊、B 背包、F 商人、T debug coconut
- [x] `CombatHitbox.ts` 支援 faction 過濾與單次命中
- [x] `InventoryManager.ts` 支援 add/remove/count/has/get
- [x] `InventoryUIController.ts` 監聽 `INVENTORY_CHANGED`
- [x] `NPC_AI.ts` 支援 Peace / Neutral / Hostile、Wander / Chase、近戰攻擊、HP bar、死亡事件
- [x] `MerchantNPC.ts` 支援對話、交易、coconut 貨幣、庫存
- [x] `DialogueUIController.ts` 與 `MerchantShopUIController.ts`
- [x] `ResourceObject.ts` 支援 Tree / Ore 互動與掉落 prefab
- [x] `FoodBase.ts` / `CollectibleItem.ts` 可加入背包

### 進行中

- [ ] Inspector 綁定完整性檢查
- [ ] 商店 / 背包 UI 實機流程測試
- [ ] 資源掉落物與背包流程統一
- [ ] 玩家回血與食物效果 API 統一

### 尚未開始 / 未完成

- [ ] Score 系統
- [ ] EXP 實際增加流程
- [ ] Scoreboard / 排行榜
- [ ] 遠程攻擊與 projectile prefab
- [ ] `NPC_DIED` 接掉落物 / Score / EXP
- [ ] `GameManager.onGameOver()` 結算 UI
- [ ] 正式 MapManager / TileRenderer
- [ ] 清理 `assets/Textures` 的 Unity 專用檔

## 分工

| 主要負責 | 內容 |
| --- | --- |
| Player + 背包 | 玩家控制、玩家狀態、背包 / item bar、道具切換 |
| NPC + 商人 | Peace / Neutral / Hostile、NPC 攻擊、商人互動 |
| 物件：礦、樹 | 採礦、採果、資源點、可互動物件 prefab |
| 物件：椰子 | 椰子相關道具、回血水果、掉落物或採集回饋 |
|  |  |

## 模組規劃

### Core

- [x] `EventCenter` 已可安全 on/off
- [x] `Constants` 已有 `NPC_DIED`
- [ ] `BaseEntity.takeDamage()` clamp HP
- [ ] `BaseEntity` 加入通用 `isDead` / `heal()`
- [ ] `GameManager.onGameOver()` 接正式結算

### Player / Inventory

- [x] 移動、跳躍、攻擊、受傷、死亡
- [x] B 背包、F 商人、T debug coconut
- [x] 背包 add/remove/count/has
- [ ] 移除正式版 debug key
- [ ] 加入 `gainExp(amount)` 與 Score
- [ ] 背包 item icon

### NPC / Merchant

- [x] Peace / Neutral / Hostile
- [x] Wander / Chase / Melee
- [x] Merchant talk / trade
- [X] 商人生成 / 離開規則
- [x] 掉落物
- [ ] 遠程攻擊

### Resource / Item

- [x] Tree / Ore 耐久與掉落
- [x] FoodBase 自動吸附並加入背包
- [x] DropItem 收集也加入背包
- [ ] Coconut eat/drop 與 PlayerController stats API 統一
- [ ] 礦物製作工具

### UI

- [x] HP / EXP HUD 外殼
- [x] Inventory UI
- [x] Dialogue UI
- [x] Merchant Shop UI
- [ ] Score label
- [ ] Game Over 結算面板
- [ ] UI prefab 整理

### Map / Assets

- [ ] 固定目前 `Canvas/Player` 路徑或改成可配置引用
- [ ] 加入正式 MapManager
- [ ] 規劃 `TileConfig` / `TileData` / `TileRenderer`
- [ ] 整理 `assets/Textures`
- [ ] 保留 Cocos 可用 `.png`、`.jpg`、`.wav`
- [ ] 隔離 Unity `.unity`、`.unitypackage`、`.controller`、`.asset`、`.cs`

## 手動設定

- [ ] Player prefab 接 `inventoryUI`、`attackHitbox`、`dialogueUI`、`merchantShopUI`
- [ ] Player 的 `Sprite_Body` 掛 `cc.Animation`
- [ ] Player 的 `AttackHitbox` 掛 `CombatHitbox` + PhysicsCollider
- [ ] NPC prefab 接 `targetPlayer`、`hpBar`、`attackHitbox`
- [ ] TravelingMerchant 同節點掛 `NPC_AI` + `MerchantNPC`
- [ ] Resource prefab 接 `dropPrefab`
- [ ] Tree 接 `depletedSpriteFrame` / `targetSprite`
- [ ] UIManager 接 `expLabel`、`hpBar`
- [ ] InventoryUI 接 `gridContainer`
- [ ] DialogueUI 接 prompt、panel、option labels
- [ ] MerchantShopUI 接 root、labels、itemListRoot、buyButton

### Cocos Inspector 設定

- [ ] 掛 `GameManager.ts` 的節點需要把玩家節點拖到 `playerNode`。
- [ ] 掛 `PlayerController.ts` 的玩家節點可以調整 `maxHp`、`moveSpeed`、`jumpForce`、`attackDamage`。
- [ ] `PlayerController.ts` 需要接 `inventoryUI`、`attackHitbox`、`dialogueUI`、`merchantShopUI`。
- [ ] 玩家節點建議有 `RigidBody`、`Sprite_Body`、`AttackHitbox` 子節點。
- [ ] 掛 `NPC_AI.ts` 的 NPC 節點可以調整 `type`、`maxHp`、`detectRadius`、`attackRange`、`attackDamage`、`moveMode`、`attackType`。
- [ ] NPC 節點建議接 `targetPlayer`、`hpBar`、`attackHitbox`，商人節點需同時掛 `MerchantNPC.ts` 與 `NPC_AI.ts`。
- [ ] 掛 `UIManager.ts` 的 UI 節點需要把經驗 Label 拖到 `expLabel`，把血條 ProgressBar 拖到 `hpBar`。
- [ ] `InventoryUIController.ts` 需要接 `gridContainer`，格子底下要有 `Label` 子節點。
- [ ] `DialogueUIController.ts` 需要接 prompt、dialogue panel、dialogue label、option labels。
- [ ] `MerchantShopUIController.ts` 需要接 root、currency label、商品列表、商品描述、價格、庫存、持有數、購買數量、buy button。
- [ ] `ResourceObject.ts` 需要接 `dropPrefab`，Tree 若要變枯樹需接 `depletedSpriteFrame` / `targetSprite`。

## Git 流程

- `main/master`：穩定版
- `develop`：整合開發版
- `feature/*`：單一功能分支

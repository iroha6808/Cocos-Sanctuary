# Cocos Sanctuary Plan

> 更新日期：2026-06-09
> 本檔只放高層規劃、目前進度、下一步與手動設定。詳細架構見 `structure.md`，功能追蹤見 `NOTE.md`。

## 目錄

- [下一步優先順序](#下一步優先順序)
- [企劃摘要](#企劃摘要)
- [MVP 範圍](#mvp-範圍)
- [評分規格對齊](#評分規格對齊)
- [需求拆解](#需求拆解)
- [目前進度](#目前進度)
- [分工](#分工)
- [模組規劃](#模組規劃)
- [手動設定](#手動設定)
- [Git 流程](#git-流程)

## 下一步優先順序

1. 修正交易 UI 座標：`MerchantShopUI` 目前固定在原 Background 座標，OceanArea 交易時會跑到畫面外；應改掛 Main Camera / Screen UI Root。
2. 補 Final Project 流程分數缺口：暫停 / 繼續、GameOver 結算、回主畫面或重玩。
3. 補課程技術配分缺口：Scoreboard / 排行榜、Firebase 存讀、BGM / SFX、粒子特效。
4. 實測遠程攻擊：`SkeletonMage.prefab`、`CombatProjectile.ts`、`BurningCoconutProjectile.prefab` 的傷害、擊退、陣營與銷毀流程。
5. 實測水域：Camera 已跟玩家到水域，需確認 `OceanArea.ts` 進出時玩家重力 / 游泳控制穩定。
6. 檢查 Cocos Editor Inspector 綁定：Player、NPC、SkeletonMage、Projectile、OceanArea、Resource、UI。
7. 統一回血 / 食物使用 API，並補 `Score / EXP` 資料流與 UI。

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
- [x] MerchantSpawner 旅行商人生成腳本
- [x] NPC 遠程攻擊程式與 BurningCoconut projectile prefab
- [x] OceanArea 水域判定與玩家游泳控制
- [x] Tree / Ore 資源互動與掉落物生成
- [x] GameOver 場景切換
- [ ] EXP / Score 資料流
- [ ] Score UI
- [ ] 正式 Game Over 結算 UI
- [ ] 地圖資料化 / TileRenderer

## 評分規格對齊

| 類別 | 配分 | 分項 / 分數 | 目前狀態 / 待補 |
| --- | --- | --- | --- |
| 遊戲流程 | 10% | 開頭動畫 Optional、主畫面、功能選單 / 參數、關卡選擇 Optional、進入遊戲、暫停 / 繼續、勝敗畫面、回主畫面或關卡選擇；流程需可重複玩 | Menu -> Game 已有；需補暫停 / 繼續、GameOver 結算、回主畫面或重玩 |
| 帳號系統 | 7% | 註冊 / 登入 / 登出 3%；排行榜 4% | 尚未開始 |
| 存檔 / 讀檔 | 6% | Firebase；每帳號固定存檔欄位，可覆寫或新增 | 尚未開始 |
| 物理系統 | 13% | 正確重力與碰撞系統 | 已有 physics、碰撞、OceanArea；需實測 |
| 遊戲音效 | 7% | 各場景 BGM 2%；五種不同音效 5% | 尚未整理 |
| 遊戲操作 | 13% | 所有角色移動 4%；三種移動以外操作 9% | 玩家移動、攻擊、背包、商人互動、水中控制已有；需補操作展示 |
| 遊戲動畫 | 12% | 所有角色動作 4%；轉場 2%；開場 2%；結束 / 通關 2%；Action 2% | Player / NPC 基礎動畫已有；轉場、開場、結束需補 |
| 遊戲特效 | 5% | 五種不同粒子特效 | 尚未開始 |
| 版本控制 | 7% | 使用 Git | 已使用 Git；提交訊息與分支流程需保持乾淨 |
| 遊戲技術合計 | 60% | 技術表原始總分 70，最高可拿 60 | 優先補帳號 / 排行榜、Firebase、音效、粒子 |
| 進階功能 | 20% | 敵人 AI 0-6%；Node Pooling 0-4%；客製化渲染 0-4%；2.5D 0-2%；打擊感 0-3%；特殊運鏡 0-4%；客製化物理 0-4%；關卡編輯器 0-8%；自動地圖 0-4%；無限地圖 0-3%；魔王 0-2%；線上多人 0-8%；其他自由發揮 | 已有敵人 AI、水域特殊物理雛形；可補 projectile / drop Node Pooling、打擊感或運鏡 |
| 美術風格 | 5% | 整體視覺一致性 | 素材量足夠；需統一可用素材、UI / 場景風格，並隔離 Unity 殘留檔 |
| 主觀分數 | 15% | 完成度、體驗、展示效果 | 優先把採集、背包、商人、戰鬥、水域、死亡 / 重玩 demo loop 跑順 |

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
| Final Project 遊戲流程 | 暫停 / 繼續、正式 GameOver、回主畫面 / 重玩會直接影響流程 10% | MVP |
| 課程技術配分缺口 | 帳號 / 排行榜、Firebase、音效、粒子尚未完整追蹤，會影響技術 60% | MVP |
| 水域碰撞 / OceanArea | 需要 sensor collider、玩家 contact listener、進出水域時重力還原要穩 | MVP |
| Camera / 商店 UI 座標 | Camera 已跟玩家移動，Dialogue 已能保持可見，但 MerchantShop UI 仍固定在舊世界座標 | MVP |
| 遠程攻擊 prefab 綁定 | SkeletonMage、projectile prefab、spawn node、projectile parent 都靠 Inspector 設定 | MVP |
| Player 狀態流 | HP 已接，EXP / Score / heal 尚未統一，食物仍找 `PlayerStats` | MVP |
| 商人交易 | 已有對話、商店與生成腳本，但仍依賴 Inspector UI 綁定與 coconut 貨幣測試 | MVP |
| item / prefab 命名一致性 | `greenapple`、`coffeebean`、`guazi` / `gauzi.ts` 命名混用，可能影響資料查找或 prefab 綁定 | MVP |
| Game Over | 玩家會切 GameOver，但 `GameManager.onGameOver()` 尚未接結算 UI | MVP |
| 素材清理 | `assets/Textures` 與 `assets/resources` 有大量來源檔 / 動畫 / 圖集，需要人工判斷 | 延伸 |

### High Value

| 功能 | 價值原因 | 階段 |
| --- | --- | --- |
| 三類 NPC 差異 | Peace / Neutral / Hostile 是企劃核心賣點 | MVP |
| 商人 NPC | 讓探索和背包有實際用途 | MVP |
| 掉落物與撿取 | 採集、戰鬥、成長流程會串起來 | MVP |
| 食物資料表 | `ItemData` 已擴充水果 / 堅果，可支撐回血、體力、商店與掉落 | MVP |
| 遠程 NPC | SkeletonMage + projectile 讓戰鬥展示差異更明顯 | MVP |
| 水域探索 | OceanArea 讓地形不只地面，能展示水中控制 | MVP |
| 敵人 AI / Node Pooling | 對應進階功能配分，可用在敵人、projectile、掉落物效能優化 | 延伸 |
| 音效 / 粒子 / 打擊感 | 分數明確且展示效果明顯 | 延伸 |
| 水果回血 / 礦物製作 | 讓資源有用途，不只是加分 | 延伸 |
| 升級 / 死亡動畫 | 展示效果明顯 | 延伸 |
| PvP | 企劃亮點但成本高，先不進 MVP | 延伸 |
| 交通工具 car / boat / wing | 可展示地面、水中、空中探索差異 | 延伸 |

## 目前進度

### 已完成

- [x] 專案 / 場景基礎：Cocos Creator 2.4.8、`Game`、`MenuScene`、`GameOver`、主要 prefab 與 Player 基礎動畫
- [x] Core：`Constants`、`EventCenter`、`GameManager` physics / `PLAYER_DIED` 監聽
- [x] Player / Inventory：移動、跳躍、攻擊、受傷 / 死亡、B 背包、F 商人、T debug coconut、背包增刪查、icon、右鍵使用 / 刪除
- [x] Combat / NPC：Peace / Neutral / Hostile、Wander / Chase、近戰、遠程 projectile、faction 過濾、HP bar、死亡事件、drop table
- [x] Merchant：商人對話、交易、coconut 貨幣、庫存、生成 / 離開規則，Dialogue UI 已跟隨鏡頭可見範圍
- [x] Resource / Item：Tree / Ore、AppleTree、OreRock、掉落物、FoodBase、CollectibleItem、ItemData 水果 / 堅果 / potion / ore / wood
- [x] Map / Camera：`OceanArea` 水域移動 / 重力切換，Camera 可跟隨玩家到水域，商人依玩家附近生成
- [x] UI：Inventory、Dialogue、Merchant Shop、HP / EXP HUD 外殼、Menu 進入 Game、玩家死亡切 GameOver

### 進行中

- [ ] Inspector 綁定完整性檢查
- [ ] 商店 / 背包 UI 實機流程測試
- [ ] MerchantShop UI 改成 screen-space / camera-bound，避免 OceanArea 交易時離開畫面
- [ ] 遠程攻擊與水域實機流程測試
- [ ] 玩家回血與食物效果 API 統一

### 尚未開始 / 未完成

- [ ] Score 系統
- [ ] EXP 實際增加流程
- [ ] Scoreboard / 排行榜
- [ ] 帳號系統：註冊 / 登入 / 登出
- [ ] Firebase 存檔 / 讀檔
- [ ] 暫停 / 繼續遊戲
- [ ] 回主畫面 / 重玩流程
- [ ] 各場景 BGM 與至少五種 SFX
- [ ] 五種粒子特效
- [ ] Projectile / drop Node Pooling
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
- [x] B 背包、F 商人、右鍵背包 action menu
- [x] `T` debug coconut 已改用 `addItem("coconut", 10)`
- [x] OceanArea 中支援水平 / 垂直游泳控制
- [x] 背包 add/remove/count/has
- [ ] 移除正式版 debug key
- [ ] 加入 `gainExp(amount)` 與 Score
- [ ] 加入 各項道具的use功能
- [x] 可刪除道具
- [x] 背包 item icon

### NPC / Merchant

- [x] Peace / Neutral / Hostile
- [x] Wander / Chase / Melee
- [x] Merchant talk / trade
- [x] 商人生成 / 離開規則
- [x] 掉落物
- [x] 遠程攻擊程式與 projectile prefab
- [ ] SkeletonMage 實機測試

### Resource / Item

- [x] Tree / Ore 耐久與掉落
- [x] AppleTree 可消耗與回復蘋果
- [x] OreRock 支援 weighted drop table
- [x] FoodBase 自動吸附並加入背包
- [x] DropItem 收集也加入背包
- [ ] Coconut eat/drop 與 PlayerController stats API 統一
- [ ] 礦物製作工具

### UI

- [x] HP / EXP HUD 外殼
- [x] Inventory UI
- [x] Dialogue UI
- [x] Merchant Shop UI
- [x] Dialogue UI 可跟著鏡頭可見範圍顯示
- [ ] Merchant Shop UI 改掛 Screen UI Root / Main Camera 對齊畫面
- [ ] Score label
- [ ] Game Over 結算面板
- [ ] UI prefab 整理

### Map / Assets

- [ ] 固定目前 `Canvas/Player` 路徑或改成可配置引用
- [x] 加入 `OceanArea` 水域 prefab / 腳本
- [ ] 加入正式 MapManager
- [ ] 規劃 `TileConfig` / `TileData` / `TileRenderer`
- [ ] 整理 `assets/Textures`
- [ ] 整理 `assets/resources/100 FOOD ASSETS` 與 `Purple Planet - Platformer Tileset` 圖示路徑與實際使用素材
- [ ] 保留 Cocos 可用 `.png`、`.jpg`、`.wav`
- [ ] 隔離 Unity `.unity`、`.unitypackage`、`.controller`、`.asset`、`.cs`

## 手動設定

- [ ] Player prefab 接 `inventoryUI`、`attackHitbox`、`dialogueUI`、`merchantShopUI`
- [ ] Player 的 `Sprite_Body` 掛 `cc.Animation`
- [ ] Player 的 `AttackHitbox` 掛 `CombatHitbox` + PhysicsCollider
- [ ] NPC prefab 接 `targetPlayer`、`hpBar`、`attackHitbox`
- [ ] SkeletonMage 接 `projectilePrefab`、`projectileSpawnNode`、`projectileParent`
- [ ] BurningCoconutProjectile prefab 要有 `CombatProjectile`、RigidBody、PhysicsCollider、視覺 / 火焰動畫
- [ ] TravelingMerchant 同節點掛 `NPC_AI` + `MerchantNPC`
- [ ] MerchantSpawner 接 `merchantPrefab`、`playerNode`、`spawnParent`
- [ ] OceanArea 節點掛 `PhysicsBoxCollider` sensor + `OceanArea.ts`
- [ ] Resource prefab 接 `dropPrefab`
- [ ] Tree 接 `depletedSpriteFrame` / `targetSprite`
- [ ] UIManager 接 `expLabel`、`hpBar`
- [ ] InventoryUI 接 `gridContainer`
- [ ] DialogueUI 接 prompt、panel、option labels
- [ ] MerchantShopUI 接 root、labels、itemListRoot、buyButton
- [ ] MerchantShopUI root 放在跟隨 Main Camera 的 Screen UI Root，或由腳本每次 open 時轉成 camera/screen 座標

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

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
| 遊戲流程 | 10% | 開頭動畫 Optional、主畫面、功能選單 / 參數、關卡選擇 Optional、進入遊戲、暫停 / 繼續、勝敗畫面、回主畫面或關卡選擇；流程需可重複玩 | 腳本已補 Menu、Pause、GameOver、Retry、Main Menu、fade；待手動 UI / Button 綁定 |
| 帳號系統 | 7% | 註冊 / 登入 / 登出 3%；排行榜 4% | `SaveService` 以 localStorage 模擬 Firebase，已補註冊 / 登入 / 登出 / 排行榜 API；待手動 UI 綁定 |
| 存檔 / 讀檔 | 6% | Firebase；每帳號固定存檔欄位，可覆寫或新增 | `SaveService` 已補每帳號存檔、讀檔、下次進 Game 自動載入；待手動 UI 綁定 |
| 物理系統 | 13% | 正確重力與碰撞系統 | 已有 physics、碰撞、OceanArea；需實測 |
| 遊戲音效 | 7% | 各場景 BGM 2%；五種不同音效 5% | `AudioManager` 已補 BGM + attack / hit / collect / buy / heal / skill；待拖 AudioClip |
| 遊戲操作 | 13% | 所有角色移動 4%；三種移動以外操作 9% | `InputManager` + context stack 統一 Game 場景輸入；Esc pause、R retry、M mute，UI 開啟時先吃對應操作 |
| 遊戲動畫 | 12% | 所有角色動作 4%；轉場 2%；開場 2%；結束 / 通關 2%；Action 2% | Player / NPC 基礎動畫已有；新增 fade transition；開場 / 結束可用 UI 動畫補強 |
| 遊戲特效 | 5% | 五種不同粒子特效 | `EffectsManager` 已補 hit / collect / heal / fire / water runtime particle；待拖 particle sprite |
| 版本控制 | 7% | 使用 Git | 已使用 Git；提交訊息與分支流程需保持乾淨 |
| 遊戲技術合計 | 60% | 技術表原始總分 70，最高可拿 60 | 腳本已補主要缺口；剩 Cocos Editor 節點、AudioClip、Label、Button 綁定 |
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
| Player 狀態流 | HP、EXP、Score、食物回血 API 已接；仍需實機測試 UI / save 還原 | MVP |
| 商人交易 | 已有對話、商店與生成腳本，但仍依賴 Inspector UI 綁定與 coconut 貨幣測試 | MVP |
| item / prefab 命名一致性 | `greenapple`、`coffeebean`、`guazi` / `gauzi.ts` 命名混用，可能影響資料查找或 prefab 綁定 | MVP |
| Game Over | `GameManager.onGameOver()` 已寫 last run / save / leaderboard；GameOver labels/buttons 需手動接 | MVP |
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

| 狀態 | 摘要 |
| --- | --- |
| 已完成 | 場景 / prefab 基礎、Player 操作與動畫、背包與交易、NPC 近遠程攻擊、資源掉落、水域、Camera 跟隨、Dialogue / Shop / HUD 外殼 |
| 進行中 | Inspector 綁定檢查、流程 UI 手動設定、商店 / 背包 / 遠程攻擊 / 水域實測、MerchantShop UI screen-space 修正 |
| 未完成 | Firebase 真後端替換、正式 UI 美術、Node Pooling、MapManager / TileRenderer、素材清理 |

## 分工

| 主要負責 | 內容 |
| --- | --- |
| Player + 背包 | 玩家控制、玩家狀態、背包 / item bar、道具切換 |
| NPC + 商人 | Peace / Neutral / Hostile、NPC 攻擊、商人互動 |
| 物件：礦、樹 | 採礦、採果、資源點、可互動物件 prefab |
| 物件：椰子 | 椰子相關道具、回血水果、掉落物或採集回饋 |
|  |  |

## 模組規劃

| 模組 | 已有 | 待補 |
| --- | --- | --- |
| Core | `EventCenter`、`Constants`、physics / death event、`SaveService`、score / exp、pause / retry / save / leaderboard | Firebase 真後端替換、正式 GameOver 視覺 |
| Player / Inventory | 移動、跳躍、攻擊、受傷 / 死亡、背包、item icon、水中控制、存檔匯出 / 還原 | 移除 debug key、道具使用 API polish |
| NPC / Merchant | 三類 NPC、巡邏 / 追擊、近遠程攻擊、商人對話 / 交易 / 生成、drop table | SkeletonMage 實測、交易流程測試 |
| Resource / Item | Tree / Ore、AppleTree、OreRock、DropItem、FoodBase、ItemData | Coconut eat/drop 與 PlayerController API 統一、礦物製作 |
| UI | HP / EXP / Score HUD、Inventory、Dialogue、Merchant Shop、Menu / GameOver 腳本 API | Shop UI camera-bound、手動接 Menu / Pause / GameOver panels |
| Map / Assets | OceanArea、Camera 跟隨玩家到水域 | MapManager、TileData / TileRenderer、素材路徑整理、Unity 殘留檔隔離 |

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
- [ ] UIManager 接 `scoreLabel`
- [ ] InventoryUI 接 `gridContainer`
- [ ] DialogueUI 接 prompt、panel、option labels
- [ ] MerchantShopUI 接 root、labels、itemListRoot、buyButton
- [ ] MerchantShopUI root 放在跟隨 Main Camera 的 Screen UI Root，或由腳本每次 open 時轉成 camera/screen 座標
- [ ] Game 場景加 `AudioManager` 節點並拖 `sceneBgm`、`attackSfx`、`hitSfx`、`collectSfx`、`buySfx`、`healSfx`、`skillSfx`
- [ ] Game 場景加 `EffectsManager` 節點，`effectRoot` 指向畫面 / Canvas 底下的特效容器，`particleSpriteFrame` 可用粒子圖
- [ ] GameManager 接 `pausePanel`、`fadeOverlay`，Pause panel 按鈕綁 `resumeGame()`、`restartGame()`、`backToMenu()`、`saveCurrentGame()`
- [ ] MenuScene 接 `mainPanel`、`loginPanel`、`settingsPanel`、`leaderboardPanel`、`fadeOverlay`、username / password EditBox、status / current user / leaderboard Labels
- [ ] Menu 按鈕綁 `goToGameScene()`、`loadSavedGame()`、`register()`、`login()`、`logout()`、`showMain()`、`showLogin()`、`showSettings()`、`showLeaderboard()`、`toggleMute()`
- [ ] GameOver 場景掛 `GameOverScene.ts`，接 title / username / score / exp / status Labels 與 fadeOverlay
- [ ] GameOver 按鈕綁 `retry()`、`goToMainMenu()`、`submitScore()`

### Cocos Inspector 設定

- [ ] 掛 `GameManager.ts` 的節點需要把玩家節點拖到 `playerNode`。
- [ ] 掛 `PlayerController.ts` 的玩家節點可以調整 `maxHp`、`moveSpeed`、`jumpForce`、`attackDamage`。
- [ ] `PlayerController.ts` 需要接 `inventoryUI`、`attackHitbox`、`dialogueUI`、`merchantShopUI`。
- [ ] 玩家節點建議有 `RigidBody`、`Sprite_Body`、`AttackHitbox` 子節點。
- [ ] 掛 `NPC_AI.ts` 的 NPC 節點可以調整 `type`、`maxHp`、`detectRadius`、`attackRange`、`attackDamage`、`moveMode`、`attackType`。
- [ ] NPC 節點建議接 `targetPlayer`、`hpBar`、`attackHitbox`，商人節點需同時掛 `MerchantNPC.ts` 與 `NPC_AI.ts`。
- [ ] 掛 `UIManager.ts` 的 UI 節點需要把經驗 Label 拖到 `expLabel`，Score Label 拖到 `scoreLabel`，把血條 ProgressBar 拖到 `hpBar`。
- [ ] `InventoryUIController.ts` 需要接 `gridContainer`，格子底下要有 `Label` 子節點。
- [ ] `DialogueUIController.ts` 需要接 prompt、dialogue panel、dialogue label、option labels。
- [ ] `MerchantShopUIController.ts` 需要接 root、currency label、商品列表、商品描述、價格、庫存、持有數、購買數量、buy button。
- [ ] `ResourceObject.ts` 需要接 `dropPrefab`，Tree 若要變枯樹需接 `depletedSpriteFrame` / `targetSprite`。

## Git 流程

- `main/master`：穩定版
- `develop`：整合開發版
- `feature/*`：單一功能分支

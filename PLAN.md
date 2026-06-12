# Cocos Sanctuary Plan

> 更新日期：2026-06-11
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
edit3 卡住(可能因為被暫停)，edit1取消預覽框線然後正確顯示預覽地形
1. 確認 Main Camera 使用 `CameraRig` 作為唯一跟隨腳本；`CameraFollow` 僅保留為 legacy 備用。
2. 實測 `8b456ff` 後商人動畫：TravelingMerchant idle / talk clips、prefab 尺寸、Game scene 中商人顯示。
3. 手動掛新功能節點：Car / Boat、PlayerToolController、MiniBossAI、BossArenaController、EnemyRespawner、DamageNumberManager。
4. 實測車 / 船：靠近顯示 prompt，按 `F` 上下，載具中玩家不能攻擊 / 開 UI / 用工具。
5. 實測工具模式、Boss / 刷怪、Portal / BouncePad / PathGraph / PlayerGun / realtime snapshot。
6. 實測跟鏡頭 UI：`MerchantShopUI`、`InventoryUI`、`CraftingUI`、`DialogueUI` 已有 camera-bound / clamp 邏輯，需確認 OceanArea 不跑出畫面。
7. 檢查 Cocos Editor Inspector 綁定：Player、NPC、Boss、Spawner、Projectile、OceanArea、Resource、UI。

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
- [x] TravelingMerchant 新商人 sprite / idle / talk 動畫素材與 prefab 綁定
- [x] NPC 遠程攻擊程式與 BurningCoconut projectile prefab
- [x] OceanArea 水域判定與玩家游泳控制
- [x] Tree / Ore 資源互動與掉落物生成
- [x] 多種 smallore 礦物資料、icon、DropOre prefab 與 Orebase collect 流程
- [x] GameOver 場景切換
- [x] EXP / Score 資料流
- [x] Score UI 腳本
- [x] 傳送門 / 方向彈跳板腳本
- [x] 玩家右鍵槍與玩家子彈 `cc.NodePool`
- [x] waypoint path graph 與 portal link 尋路腳本
- [x] localStorage 假多人 realtime snapshot API
- [x] 工具模式：槍 / 噴射背包 / 鉤索腳本
- [x] 傳送法師 Mini Boss、Boss Arena、敵人距離刷新腳本
- [x] 傷害數字與額外 runtime 粒子效果
- [x] 車 / 船互動腳本、水域 BGM crossfade、ThemeManager 雛形
- [x] Blue / Red / Yellow Potion scripts / prefab / resources 圖
- [x] Rockleft / Rockright / Rockplatform3 / 4 / 5 map prefab
- [x] AutoMapGenerator 腳本：在 `Canvas/platform/auto generate` 生成跳躍平台
- [ ] 正式 Game Over 結算 UI
- [ ] 地圖資料化 / TileRenderer

## 評分規格對齊

### 遊戲流程 10%

| 項目 | 細節 | 狀態 |
| --- | --- | --- |
| 開頭動畫 | Optional | 可用 UI / fade 補展示 |
| 主畫面 | Menu scene | 腳本已補，待 UI 綁定 |
| 功能選單 | 遊戲參數設定，例如音量 | Menu settings / mute 已補，待 UI 綁定 |
| 關卡選擇 | Optional | 暫不列 MVP |
| 進入遊戲 | Menu -> Game | 腳本已補 |
| 暫停 / 繼續遊戲 | Esc pause/resume，Pause panel | 腳本已補，待 panel / button 綁定 |
| 遊戲獲勝 / 失敗畫面 | GameOver 結算 | 腳本已補，待 GameOver UI 綁定 |
| 回到主畫面 or 關卡選擇 | Main Menu / Retry | 腳本已補，待 button 綁定 |
| Notice | 流程都做完且可重複玩才能得分 | 必須手測至少兩輪 demo loop |

### 遊戲技術 60%

| 項目 | 分數 | 細節 | 狀態 |
| --- | --- | --- | --- |
| 帳號系統 | 7 | 註冊 / 登入 / 登出 3%；排行榜 4% | `SaveService` localStorage 假 Firebase 已補，含 login/logout metadata 與 backend snapshot；待 UI 綁定 |
| 存檔 / 讀檔 | 6 | Firebase；每帳號有固定存檔欄位，可覆寫或新增 | API 已補，save summaries 可查分數 / HP / 背包統計 / map seed；待 UI 綁定與真 Firebase 替換 |
| 物理系統 | 13 | 正確重力系統和碰撞系統 | 已有 physics / collider / OceanArea / 斜坡跳躍修正；需實測 |
| 遊戲音效 | 7 | 各場景 BGM 2%；五種不同音效 5% | `AudioManager` 已補 land / water BGM crossfade + 6 SFX；待拖 AudioClip |
| 遊戲操作 | 13 | 所有角色移動 4%；三種移動以外操作 9%，包含單機多人 | 已補 A/D、Space、F、B、C、Esc、M、mouse、wheel、水中 boost、空中 fast fall、車 / 船；R 快捷鍵已移除 |
| 遊戲動畫 | 12 | 所有角色動作 4%；轉場 2%；開場 2%；結束 / 通關 2%；Action 2% | Player / NPC / TravelingMerchant 動畫已有；fade transition 已補；開場 / 結束 UI 動畫待補 |
| 遊戲特效 | 5 | 五種不同粒子特效 | `EffectsManager` 已補 hit / collect / heal / fire / water；待粒子圖 |
| 版本控制 | 7 | 使用 Git | 已使用 Git；提交訊息與分支流程需保持乾淨 |
| Notice | 70 -> 60 | 技術表總分 70，最高可拿 60 | 腳本已補主要缺口，剩 Cocos Editor 手動綁定 |

### 進階功能 20%

| 類別 | 舉例 / 分數 | 目前對應 |
| --- | --- | --- |
| 遊戲控制 | 敵人 AI Path finding 0-6%；Node Pooling 效能優化 0-4% | `PathGraph` / `NPCPathAgent`、距離刷怪、玩家槍子彈池、傷害數字池已補 |
| 遊戲渲染 | 客製化渲染效果 Shader 0-4%；2.5D 0-2% | 暫未做 |
| 遊戲特效 | 打擊感 0-3%；特殊遊戲運鏡 0-4% | 橡皮筋鏡頭、`HitFeelManager` 已補 hit stop / flash / shake |
| 物理系統 | 客製化物理系統，例如外太空無重力場景 0-4% | `OceanArea` 水中物理可展示 |
| 關卡設計 | 關卡編輯器 0-8%；自動地圖生成 0-4%；無限地圖 0-3%；魔王機制 0-2% | 傳送法師 Mini Boss / Boss Arena 已補腳本；AutoMapGenerator 已補腳本 |
| 線上多人連線 | 可同時看到自己與其他使用者動作 0-8% | `RealtimeStateReporter` 已先把 client/session、位置、HP、score、exp、背包統計、狀態寫進 localStorage 假後端，待 UI / 真同步 |
| 其他 | 同學可以自由發揮 | 打擊感、橡皮筋鏡頭可當展示亮點 |
| Notice | 最高可拿 20% | 優先保住打擊感 / 運鏡 / AI / 水中物理 |

### 美術風格 5% / 主觀分數 15%

| 類別 | 重點 | 目前策略 |
| --- | --- | --- |
| 美術風格 5% | 整體視覺一致性 | 統一可用素材、UI / 場景風格，隔離 Unity 殘留檔 |
| 主觀分數 15% | 完成度、體驗、展示效果 | 採集、背包、商人、戰鬥、水域、死亡 / 重玩 demo loop 要跑順 |

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
| Camera / UI 座標 | Camera 以 `CameraRig` 跟玩家移動，Dialogue / MerchantShop / Inventory / Crafting 已有跟鏡頭與 clamp 邏輯 | MVP |
| 遠程攻擊 prefab 綁定 | SkeletonMage、projectile prefab、spawn node、projectile parent 都靠 Inspector 設定 | MVP |
| Player 狀態流 | HP、EXP、Score、食物回血 API 已接；仍需實機測試 UI / save 還原 | MVP |
| 商人交易 | 已有對話、商店與生成腳本，但仍依賴 Inspector UI 綁定與 coconut 貨幣測試 | MVP |
| 商人動畫 prefab | `8b456ff` 後 TravelingMerchant 換新 sprite 與 Animation clips；需實測 idle / talk 是否被正確播放 | MVP |
| Portal / PathGraph 手動節點 | 尋路效果仰賴 PathNode 鄰接與 Portal pair 設定，缺節點會 fallback 直接追擊 | 延伸 |
| PlayerGun prefab 綁定 | 槍需要 projectile prefab 有 `CombatProjectile`、RigidBody、PhysicsCollider；未綁只 warn | 延伸 |
| Tool mode 輸入重疊 | `PlayerController` 仍直接處理 Space / mouse；ToolController 會關掉 PlayerGun 直接右鍵，但 Space 在 Jetpack 仍會先保留原跳躍 | 延伸 |
| Boss 手動設定 | Boss 依賴 NPC_AI、teleport points、minion prefabs；沒拖 prefab 只會少召喚 | 延伸 |
| Vehicle / Player 鎖控制 | 車船上載具時會鎖 PlayerController 並把 Player 同步到 seat；若 seat / exitOffset / collider 沒設好，可能卡地形 | 延伸 |
| item / prefab 命名一致性 | smallore 礦物、`greenApple`、`coffeebean`、`guazi` / `gauzi.ts` 命名混用，可能影響資料查找或 prefab 綁定 | MVP |
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
| 礦物掉落物 | 新增多種 smallore icon、資料與 DropOre prefab，讓採礦展示更完整 | MVP |
| 敵人 AI / Node Pooling | 對應進階功能配分，可用在敵人、projectile、掉落物效能優化 | 延伸 |
| 傳送門 / 彈跳板 | 可展示關卡機制、敵人追擊與方向物理互動 | 延伸 |
| 假多人 / 假後端 state | 先有 client/session、玩家狀態、背包統計、current map state 與 `getBackendSnapshot()`，之後可替換 Firebase / multiplayer UI | 延伸 |
| 工具模式 / 噴射背包 / 鉤索 | 展示操作爽感，對主觀分數有感 | 延伸 |
| Boss / 自動刷新 / 傷害數字 | 展示戰鬥完整度，能串 AI、粒子、Score | 延伸 |
| 音效 / 粒子 / 打擊感 / 運鏡 | 分數明確且展示效果明顯，已用 hit stop、shake、flash、CameraRig 補強 | 延伸 |
| 車 / 船 / 水域 BGM | 讓陸地與水域探索差異更明顯，也替未來主題 / 色調切換鋪路 | 延伸 |
| 水果回血 / 礦物製作 | 讓資源有用途，不只是加分 | 延伸 |
| 升級 / 死亡動畫 | 展示效果明顯 | 延伸 |
| PvP | 企劃亮點但成本高，先不進 MVP | 延伸 |
| 交通工具 car / boat / wing | 可展示地面、水中、空中探索差異 | 延伸 |

## 目前進度

| 狀態 | 摘要 |
| --- | --- |
| 已完成 | 場景 / prefab 基礎、Player 操作與動畫、背包與交易、商人 idle / talk 動畫素材、NPC 近遠程攻擊、資源掉落、水域、smallore、potions、Rocksets、AutoMapGenerator、CameraRig、HitFeel、Portal、BouncePad、PlayerGun、ProjectilePool、PathGraph、Realtime snapshot、Tool mode、Mini Boss、Respawner、Damage number、車 / 船、BGM crossfade 腳本 |
| 進行中 | Inspector 綁定檢查、流程 UI 手動設定、AutoMapGenerator prefab 欄位、商人動畫 / 商店 / 背包 / 合成 / 遠程攻擊 / 水域 / 車船 / 傳送門 / 彈跳板 / 槍 / 鉤索 / Boss / 刷怪實測 |
| 未完成 | Firebase 真後端替換、正式 UI 美術、TileRenderer、素材清理、多人角色顯示 UI |

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
| Core | `EventCenter`、`Constants`、`SaveService`、score / exp、pause / save / leaderboard、`AudioManager` land / water crossfade、`ThemeManager`、`CameraRig`、`HitFeelManager`、`RealtimeStateReporter`、`DamageNumberManager` | Firebase 真後端替換、正式 GameOver 視覺、多人 UI、正式色調 / shader |
| Player / Inventory | 移動、跳躍、fast fall、攻擊、右鍵槍、工具模式、Jetpack、Grapple、背包、水中控制、外部控制鎖、存檔匯出 / 還原 | 移除 debug key、道具使用 API polish、確認 InputManager / PlayerController 輸入責任 |
| NPC / Merchant | 三類 NPC、巡邏 / 追擊、waypoint path agent、近遠程攻擊、Boss、距離刷怪、商人交易、TravelingMerchant sprite / idle / talk clips、drop table | SkeletonMage / Boss / Respawner 實測、商人動畫播放實測、PathNode 手動連線 |
| Resource / Item | Tree / Ore、AppleTree、OreRock、DropItem、Orebase、smallore、FoodBase、potions、ItemData | Coconut eat/drop 與 PlayerController API 統一、礦物製作 |
| UI | HP / EXP / Score HUD、Inventory、Dialogue、Merchant Shop、Crafting、Menu / GameOver 腳本 API；多數 panel 已可跟 Main Camera / clamp | 手動接 Menu / Pause / GameOver panels，實測 OceanArea UI |
| Map / Assets | OceanArea、OceanLayerOrder、OceanPrefabBuilder、AutoMapGenerator 逐塊生成與平坦平台資源、Portal、BouncePad、PathNode、PathGraph、Camera 跟隨玩家到水域 | TileData / TileRenderer、素材路徑整理、Unity 殘留檔隔離 |
| Vehicle | `VehicleInteractable`、`VehicleController`、`CarController`、`BoatController` | 車 / 船 prefab 視覺、seat / exitOffset / collider 手動調整 |

## 手動設定

- [ x] Player prefab 接 `inventoryUI`、`attackHitbox`、`dialogueUI`、`merchantShopUI`
- [ x] Player 的 `Sprite_Body` 掛 `cc.Animation`
- [ x] Player 的 `AttackHitbox` 掛 `CombatHitbox` + PhysicsCollider
- [ x] NPC prefab 接 `targetPlayer`、`hpBar`、`attackHitbox`
- [ x] SkeletonMage 接 `projectilePrefab`、`projectileSpawnNode`、`projectileParent`
- [ x] BurningCoconutProjectile prefab 要有 `CombatProjectile`、RigidBody、PhysicsCollider、視覺 / 火焰動畫
- [ x] TravelingMerchant 同節點掛 `NPC_AI` + `MerchantNPC`
- [ x] TravelingMerchant prefab 已有新 sprite 與 `cc.Animation`，確認 default clip / clips 包含 idle / talk，並實測對話時切 talk 或至少顯示新商人圖。
- [ x] MerchantSpawner 接 `merchantPrefab`、`playerNode`、`spawnParent`
- [ ] OceanArea 節點掛 `PhysicsBoxCollider` sensor + `OceanArea.ts`
- [ ] OceanArea root 可掛 `OceanLayerOrder.ts`；若要清掉舊 GeneratedContent 可掛 `OceanPrefabBuilder.ts`
- [ x] Resource prefab 接 `dropPrefab`
- [ x] DropOre prefab 掛對應 `Orebase` 子類，item id 要對上 `ItemData.ts` 的 smallore key
- [ x] Potion prefab / resources 圖已匯入；若要可食用回血，確認 Blue / Red / Yellow Potion prefab 掛對應 potion script。
- [ x] Rockleft / Rockright / Rockplatform3 / 4 / 5 map prefab 已匯入；放進場景後要檢查 collider 與 spacing。
- [ x] `Canvas/platform/auto generate` 掛 `AutoMapGenerator.ts`；拖入 `assets/Prefabs/Map/` 的 Rockleft、Rockright、Rockplatform3、Rockplatform4、Rockplatform5。
- [ x] AutoMapGenerator 的 `manualTriggerOnly` 預設開啟；開場 / 讀檔只套 seed 與參數不生成，Gameplay 按 `G` 後鏡頭用 `cameraFrameDuration = 1.6` 秒拉遠，等 `startAfterCameraDelay = 0.5` 秒，再在 `x -5000~0`、`y -2000~0` 每 `generationStepInterval = 0.25` 秒逐塊生成並小幅震動，完成後等 `returnAfterGenerationDelay = 1.0` 秒再回玩家。
- [ x] AutoMapGenerator 使用 FlatRun / RampUp / RampDown / Hill / Valley pattern 拼接平台，`minPatternCount/maxPatternCount` 控制組數，`slopePatternChance` 控制斜坡組比例；存檔保存 map seed / 範圍 / 主要參數，不保存 runtime 節點。
- [ x] AutoMapGenerator 可拖 `resourceRoot`、`appleBushPrefab`、`oreRockPrefab`、`fruitOrePrefab`；資源只生成在平坦平台頂面，fruitore prefab 尚未建立時可先留空。
- [ x] Map Editor 入口：Menu 新增按鈕綁 `MenuScene.startMapEditor()`；進 Game 後會切 `InputContext.MapEditor` 並鎖住 Player 控制。
- [ x] MapEditorController 可掛 `Canvas/platform/auto generate` 或由 GameManager runtime 補；拖 `terrainRoot`、`resourceRoot`、`cameraRig`、`playerNode`、可選 `editorStatusLabel` / `selectionGraphics`，prefab 欄位沒拖時會 fallback AutoMapGenerator。
- [ x] Map Editor 操作：`E` / `Esc` 進出、`1/2/3` 地形 / 資源 / 框選生成、左鍵放置或拖框、右鍵刪 editor-owned 節點、`Q/R` 換 prefab、`[` / `]` 旋轉；支援 Cocos `num1/num2/num3` 與瀏覽器 key/code fallback，框選生成只清框內 `Auto*` / `Editor*` 節點。
- [ x] Map Editor 暫存：放置 / 刪除 / 框選生成後會更新 live scene 與 `SaveService.currentMapEditor`；目前讀檔先不重建 editor placements，避免假後端舊資料蓋掉場景。
- [ ] Tree 接 `depletedSpriteFrame` / `targetSprite`
- [ ] UIManager 接 `expLabel`、`hpBar`
- [ ] UIManager 接 `scoreLabel`
- [ ] InventoryUI 接 `gridContainer`
- [ ] DialogueUI 接 prompt、panel、option labels
- [ ] DialogueUI / InventoryUI / MerchantShopUI / CraftingUI 若要跟鏡頭，接 `mainCameraNode` 或確認 fallback 可找到 Main Camera
- [ ] MerchantShopUI 接 root、labels、itemListRoot、buyButton
- [ ] MerchantShopUI root 放在跟隨 Main Camera 的 Screen UI Root，或使用腳本 open/update 時的 camera world 座標與 clamp 邏輯
- [ ] Game 場景加 `AudioManager` 節點並拖 `sceneBgm`、可選 `waterBgm`、`attackSfx`、`hitSfx`、`collectSfx`、`buySfx`、`healSfx`、`skillSfx`；`bgmFadeDuration` 控制進出水域淡入淡出。
- [ ] 可選：Game 場景加 `ThemeManager.ts`，拖 `tintOverlay` / `tintTargets`；若勾 `autoApplyOceanTheme`，進出 OceanArea 會套 ocean/default tint。
- [ ] Game 場景加 `EffectsManager` 節點，`effectRoot` 指向畫面 / Canvas 底下的特效容器，`particleSpriteFrame` 可用粒子圖
- [ x] Main Camera 手動掛 `CameraRig.ts`；GameManager 的 `cameraRig` 欄位拖 Main Camera 上的 CameraRig component，`playerNode` 拖 Player，`autoMapGenerator` 拖 `Canvas/platform/auto generate` 的 AutoMapGenerator；Background 可拖 `zoomScaledNodes` / `inverseZoomScaledNodes`；ExpLabel / HpBar 保持掛 `CameraUIFollower`，targetCamera 拖 Main Camera，`compensateCameraZoomScale` 保持勾選，不需要再拖到 `screenFixedZoomScaledNodes`。
- [ x] 不要再把 legacy `CameraFollow.ts` 掛到 Main Camera；相機跟隨統一用 `CameraRig.ts`
- [ x] 可選：調整 `CameraRig` 的 `minFollowSpeed` / `maxFollowSpeed` / `distanceSpeedK` / `distanceResponseScale` / `lookAheadScale` / `minZoomRatio` / `maxZoomRatio` / `zoomStep` / `overviewPadding` / `overviewMinZoomRatio`，或 `AutoMapGenerator.spawnShakeDuration/spawnShakeAmplitude`、`HitFeelManager` 的 hitStop / shake / zoom 數值
- [ ] GameManager 接 `pausePanel`、`fadeOverlay`；`pausePanel` 是暫停時顯示的 UI 容器，`fadeOverlay` 是 Retry / Main Menu 切場景前淡出的全螢幕黑幕
- [ ] Pause panel 按鈕綁 `resumeGame()`、`restartGame()`、`backToMenu()`、`saveCurrentGame()`
- [ ] Player 或 Player 子節點掛 `PlayerGun.ts`；`projectilePrefab` 拖玩家子彈 prefab，`muzzleNode` 可拖槍口節點，`projectileParent` 建議拖 Bullet_Layer。
- [ ] Player 掛 `PlayerToolController.ts`，拖 `PlayerGun`；可選拖 `toolLabel`、`jetpackFuelBar`、`jetpackFlameRoot`、`grappleLineRoot`。
- [ ] 操作模式：`1` Gun 右鍵射擊、`2` Jetpack 按住 Space 上升、`3` Grapple 右鍵鉤非 sensor 實體地形。
- [ ] 玩家子彈 prefab 要有 `CombatProjectile`、`RigidBody`、`PhysicsCollider` sensor；`canHitPeaceNpc` / `canHitNeutralNpc` / `canHitHostileNpc` 依需求開啟。
- [ ] 可選：Player 或 Bullet_Layer 掛 `ProjectilePoolManager.ts`，拖同一個 projectile prefab，調 `prewarmCount`；沒掛時 `PlayerGun` 會 runtime 補在 Player 上。
- [ ] 成對 Portal 節點各掛 `Portal.ts`、PhysicsCollider sensor；兩個 portal 設同一個 `pairId`，調 `exitOffset` / `cooldown`。
- [ ] BouncePad 節點掛 `BouncePad.ts`、PhysicsCollider sensor；旋轉節點即可改變 local up 反彈方向，調 `bounceSpeed`。
- [ ] PathGraph root 掛 `PathGraph.ts`；子節點掛 `PathNode.ts`，用 `neighbors` 手動連線，portal 入口 / 出口附近的 PathNode 可拖對應 `Portal`。
- [ ] 需要升級尋路的 Hostile NPC 掛 `NPCPathAgent.ts`；可拖 `PathGraph`，不拖則使用 `PathGraph.instance`。
- [ ] GameManager 節點可掛 `RealtimeStateReporter.ts` 並拖 `playerNode`；沒掛時 GameManager 會 runtime 補一個。Fake backend 可用 `SaveService.getBackendSnapshot()` 查 users / saves / leaderboard / realtime players / current map / storage keys。
- [ ] GameManager 或 UI Root 可掛 `DamageNumberManager.ts`；沒掛時 GameManager 會 runtime 補一個，`numberRoot` 可拖 UI Root。
- [ ] Boss prefab 掛 `NPC_AI.ts` + `MiniBossAI.ts`；`MiniBossAI` 拖 `npcAI`、`targetPlayer`、`teleportPoints`、`minionPrefabs`、`minionParent`。
- [ ] Boss Arena sensor 節點掛 `BossArenaController.ts`，拖 `boss` / `bossNode`、`playerNode`、可選 `gateNode`、`clearRewardNode`。
- [ ] 刷怪點掛 `EnemyRespawner.ts`，拖 `enemyPrefabs`、`playerNode`、`spawnParent`，調 `activationRange` / `despawnRange` / `maxAlive`。
- [ ] 車節點掛 `VehicleInteractable.ts` + `CarController.ts` + `RigidBody` / collider；`promptText` 可設 `Press F to Drive`，`seatNode` 拖座位點，調 `exitOffsetX/Y`。
- [ ] 船節點掛 `VehicleInteractable.ts` + `BoatController.ts` + `RigidBody` / collider；`promptText` 可設 `Press F to Board`，船建議放在 OceanArea 附近，調 `horizontalSpeed` / `verticalSpeed` / `boostAcceleration`。
- [ ] MenuScene 接 `mainPanel`、`loginPanel`、`settingsPanel`、`leaderboardPanel`、`fadeOverlay`、username / password EditBox、status / current user / leaderboard Labels
- [ ] Menu 按鈕綁 `goToGameScene()`、`startMapEditor()`、`loadSavedGame()`、`register()`、`login()`、`logout()`、`showMain()`、`showLogin()`、`showSettings()`、`showLeaderboard()`、`toggleMute()`
- [ ] GameOver 場景掛 `GameOverScene.ts`，接 title / username / score / exp / status Labels 與 fadeOverlay
- [ ] GameOver 按鈕綁 `retry()`、`goToMainMenu()`、`submitScore()`

### Cocos Inspector 設定

- [ x] 掛 `GameManager.ts` 的節點需要把玩家節點拖到 `playerNode`，Main Camera 的 CameraRig 拖到 `cameraRig`，AutoMapGenerator 拖到 `autoMapGenerator`，暫停 UI 拖到 `pausePanel`，轉場黑幕拖到 `fadeOverlay`。
- [ ] 掛 `PlayerController.ts` 的玩家節點可以調整 `maxHp`、`moveSpeed`、`jumpForce`、`attackDamage`。
- [ ] `PlayerController.ts` 需要接 `inventoryUI`、`attackHitbox`、`dialogueUI`、`merchantShopUI`、`craftingUI`。
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

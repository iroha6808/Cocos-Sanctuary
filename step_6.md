# Step 6 - MerchantSpawner 生成與消失

## 目標

在交易可測、商品池可用後，再做商人的生成與消失。  
這一步不是最小可測交易的前置需求。

## 要修改 / 新增的 file

```text
assets/Scripts/NPC/MerchantSpawner.ts
assets/Scripts/NPC/MerchantNPC.ts
assets/Prefabs/NPCs/TravelingMerchant.prefab
assets/Scenes/Game.fire
```

## MerchantSpawner 目標

Inspector 欄位：

```ts
@property(cc.Prefab) merchantPrefab
@property(cc.Node) playerNode
@property(cc.Node) spawnParent
@property(cc.Float) minSpawnDistance = 300
@property(cc.Float) maxSpawnDistance = 700
@property(cc.Float) spawnInterval = 120
@property(cc.Boolean) spawnOnStart = true
```

方法：

```ts
spawnMerchant(): cc.Node
despawnMerchant(): void
getRandomSpawnPositionNearPlayer(): cc.Vec2
```

簡化生成位置：

```text
player position
  -> 隨機左右
  -> x offset in [minSpawnDistance, maxSpawnDistance]
  -> y 先使用 player y 或指定 ground y
```

後續若 MapManager 完成，再改成查可站立地面。

## MerchantNPC 消失目標

新增：

```ts
@property(cc.Float) maxLifeTime = 180;
@property(cc.Float) noTradeDespawnTime = 60;

private lifeTimer = 0;
private noTradeTimer = 0;
```

規則：

- Talking / Trading 時不消失。
- 玩家開始對話、打開商店、完成購買時重置 noTrade timer。
- 超過 `maxLifeTime` 後進入 `Leaving`。
- `Leaving` 可先直接 destroy，之後再做離場動畫。

## 與 NPC_AI 的關係

`MerchantNPC` 進入 Leaving：

```text
npcAI.endTalk()
npcAI.resumeMovement()
state = Leaving
```

可選：

- 讓 NPC_AI 走向遠離玩家方向。
- 或先 `node.destroy()` 作為 MVP。

## 相依性

- 依賴 Step 2 的 `NPC_AI` 共用行為。
- 依賴 Step 3 的 `MerchantNPC`。
- 不依賴 Step 5，但有隨機商品後體驗更完整。

## 驗證方式

- 商人在玩家距離 a 到 b 內生成。
- 場上同時只有一個 TravelingMerchant。
- 交易或對話中不會消失。
- 無交易超過時間後消失。
- 存在超過最大時間後消失。

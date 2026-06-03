# Step 3 - MerchantNPC 基礎互動與固定商品

## 目標

新增 `MerchantNPC.ts`，只放旅行商人專屬行為。  
這一步完成後，場景中手動放一個商人，應該能接近、按 F、進入交易流程入口。

## 要修改 / 新增的 file

```text
assets/Scripts/NPC/MerchantNPC.ts
assets/Prefabs/NPCs/TravelingMerchant.prefab
assets/Scripts/Player/PlayerController.ts
```

## File 修改目標

### `assets/Scripts/NPC/MerchantNPC.ts`

不重新定義移動。  
改成依賴同一個 node 上的 `NPC_AI`：

```ts
private npcAI: NPC_AI = null;
public shopItems: MerchantStockItem[] = [];
```

旅行商人專屬狀態：

```ts
export enum MerchantState {
    Wandering = 0,
    Talking = 1,
    Trading = 2,
    Leaving = 3
}
```

核心方法：

```ts
public canInteract(player: cc.Node): boolean
public beginInteraction(player: cc.Node): void
public openTrade(): void
public closeTrade(): void
public leave(): void
public buy(itemId: string, amount: number): boolean
```

行為：

- `onLoad()` 取得 `NPC_AI`。
- 強制或檢查 `NPC_AI.type = NPC_PEACE`。
- 初始化 `shopItems = getDefaultMerchantStock()`，先不用隨機。
- `beginInteraction()` 呼叫 `npcAI.beginTalk(player)` 與 `npcAI.pauseMovement()`。
- `closeTrade()` / 離開時呼叫 `npcAI.endTalk()` 與 `npcAI.resumeMovement()`。

### `TravelingMerchant.prefab`

建議 node tree：

```text
TravelingMerchant
  NPC_AI
  MerchantNPC
  RigidBody
  PhysicsBoxCollider
  Sprite_Body
    Sprite
    Animation
```

Inspector：

```text
NPC_AI
  Type: NPC_PEACE
  Move Mode: WANDER
  Interact Distance: 90
  Debug Log: true during testing

MerchantNPC
  Debug Log: true during testing
```

### `PlayerController.ts`

先加入最小互動掃描：

```ts
private currentMerchant: MerchantNPC = null;
```

做法可先簡化：

- 每幀或按 F 時用 `cc.find("Canvas")` 遞迴尋找最近 `MerchantNPC`。
- 若 `merchant.canInteract(this.node)`，按 F 呼叫 `merchant.beginInteraction(this.node)`。
- 後續 Step 4 再接 UI。

## 相依性

- 依賴 Step 1 的固定商品清單。
- 依賴 Step 2 的 `NPC_AI` 共用 API。
- Step 4 會把 `beginInteraction()` 接到 Dialogue UI。

## 實作框架

```text
Player press F
  -> find nearest MerchantNPC
  -> merchant.canInteract(player)
  -> merchant.beginInteraction(player)
  -> NPC_AI.pauseMovement()
  -> later DialogueUI opens
```

## 驗證方式

- 場景手動放 TravelingMerchant。
- 商人會 wander。
- 玩家靠近按 F，商人停止移動。
- 商人 `shopItems` 有固定商品。
- 離開互動後商人恢復 wander。

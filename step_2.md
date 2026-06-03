# Step 2 - 調整 NPC_AI 成共用 NPC 底盤

## 目標

把 NPC 的共同行為放在 `NPC_AI.ts`，讓不同 NPC 可以重用。  
`MerchantNPC.ts` 不重新發明移動與互動，只呼叫 `NPC_AI` 提供的共用功能。

## 要修改 / 新增的 file

```text
assets/Scripts/NPC/NPC_AI.ts
```

暫時不新增 `NPCWander.ts`，先降低檔案分裂。

## File 修改目標

### `NPC_AI.ts`

新增 NPC 共用模式：

```ts
export enum NPCMoveMode {
    NONE = 0,
    CHASE_TARGET = 1,
    WANDER = 2
}
```

建議新增欄位：

```ts
@property({ type: cc.Enum(NPCMoveMode) })
public moveMode: NPCMoveMode = NPCMoveMode.CHASE_TARGET;

@property(cc.Float) wanderMoveSpeed = 40;
@property(cc.Float) minWanderMoveTime = 1.5;
@property(cc.Float) maxWanderMoveTime = 4;
@property(cc.Float) minWanderIdleTime = 1;
@property(cc.Float) maxWanderIdleTime = 3;

@property(cc.Float) interactDistance = 90;
```

新增共用狀態：

```ts
protected isTalking: boolean = false;
protected isTrading: boolean = false;
protected isMovementPaused: boolean = false;
```

新增共用方法：

```ts
public pauseMovement(): void
public resumeMovement(): void
public stopMovement(): void
public isPlayerInInteractRange(player: cc.Node): boolean
public beginTalk(player: cc.Node): void
public endTalk(): void
protected updateWander(dt: number): void
protected setFacingByDirection(direction: cc.Vec2 | cc.Vec3): void
```

調整 update：

```text
if dead -> return
if movement paused / talking / trading -> stopMovement
if NPC_PEACE + moveMode WANDER -> updateWander
if hostile/neutral + chase -> 原本追擊/攻擊
```

## MerchantNPC 如何使用

```ts
const npcAI = this.getComponent(NPC_AI);
npcAI.beginTalk(player);
npcAI.pauseMovement();
npcAI.resumeMovement();
npcAI.isPlayerInInteractRange(player);
```

## 相依性

- 依賴既有 `NPC_AI.ts`。
- Step 3 的 `MerchantNPC.ts` 會依賴這些共用 API。
- 需小心不破壞 slime hostile 行為。

## 實作框架

```text
Slime
  NPC_AI.moveMode = CHASE_TARGET
  type = NPC_HOSTILE

TravelingMerchant
  NPC_AI.moveMode = WANDER
  type = NPC_PEACE
  MerchantNPC calls NPC_AI shared functions
```

## 驗證方式

- Slime 仍可追玩家、攻擊玩家。
- TravelingMerchant 掛 `NPC_AI` 後可 wander。
- 呼叫 `pauseMovement()` 後停止。
- 呼叫 `resumeMovement()` 後繼續 wander。
- `isPlayerInInteractRange(player)` 在距離內回傳 true。

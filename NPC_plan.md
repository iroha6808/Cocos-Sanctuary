# NPC Implementation Plan

> 本文件專注 NPC 系統實作步驟。目標是讓 NPC 具備重力、hitbox / hurtbox、跳躍越障、血條、攻擊與受傷動畫，以及可用 Console / Physics debug 觀察。

## 目前目標

1. NPC 要有 hitbox，且受重力影響。
2. NPC 新增 jump 動作，遇到障礙物時嘗試跳過去。
3. NPC 新增血條。
4. NPC 和 Player 的攻擊 / 受傷判定改為 hitbox 判定。
5. NPC 的攻擊 / 受傷邏輯與動畫切換邏輯配合 Player。
6. 支援 debug console 與 hitbox 可視化。

## 前置整理

### 1. 統一 NPC 腳本路徑

目前應以此路徑為正式 NPC 腳本：

```text
assets/Scripts/NPC/NPC_AI.ts
```

如果仍有舊檔：

```text
assets/Scripts/Entity/NPC_AI.ts
```

請停止引用或刪除舊檔，避免同名腳本邏輯分裂。

### 2. 統一 Player 攻擊入口

Player 攻擊應改為：

```text
PlayerController.attack()
  -> 播 PlayerAttack
  -> 啟用 AttackHitbox
  -> AttackHitbox 碰到 NPC hurtbox
  -> NPC_AI.receiveAttack(damage, playerNode)
```

不要再用掃整個 scene 的距離判定當主要攻擊方式。

## 建議節點結構

### Player

```text
Player
  PlayerController
  RigidBody
  PhysicsBoxCollider
  Sprite_Body
    Sprite
    Animation
  AttackHitbox
    PlayerAttackHitbox
    RigidBody
    PhysicsBoxCollider
```

### Slime / NPC

```text
Slime
  NPC_AI
  RigidBody
  PhysicsBoxCollider
  Sprite_Body
    Sprite
    Animation
  AttackHitbox
    NPCAttackHitbox
    RigidBody
    PhysicsBoxCollider
  HpBar
    ProgressBar
    bar
      Sprite
```

說明：

- `Slime` root 的 collider 是身體 hurtbox，也可兼作實體碰撞箱。
- `AttackHitbox` 是 NPC 攻擊玩家時短暫啟用的攻擊範圍。
- `HpBar` 可選，商人或和平 NPC 可以關閉。

## Component 設定

### Player root

```text
RigidBody
  Type: Dynamic
  Gravity Scale: 1
  Fixed Rotation: true

PhysicsBoxCollider
  Sensor: false
  Size: 依玩家身體調整
```

### Player / AttackHitbox

```text
PlayerAttackHitbox
  Active Time: 0.12
  Offset X: 46
  Debug Log: true during testing

RigidBody
  Type: Kinematic
  Gravity Scale: 0

PhysicsBoxCollider
  Sensor: true
  Enabled: false at start
  Size: W 45~65, H 30~45
```

### NPC root

```text
NPC_AI
  Type: NPC_HOSTILE for test
  Max Hp: 100
  Target Player: Player
  Auto Find Target: true
  Target Node Name: Player
  Debug Log: true during testing
  Show Hp Bar: true
  Hp Bar: drag HpBar ProgressBar
  Detect Radius: 300~500
  Attack Range: 50~70
  Attack Damage: 10
  Attack Cooldown: 1
  Move Speed: 80~120
  Chase Target: true
  Jump Force: 300~450
  Obstacle Check Distance: 20~40
```

```text
RigidBody
  Type: Dynamic
  Gravity Scale: 1
  Fixed Rotation: true
  Linear Damping: 視手感調整

PhysicsBoxCollider
  Sensor: false
  Size: 包住 slime 身體
```

### NPC / AttackHitbox

```text
NPCAttackHitbox
  Active Time: 0.12~0.2
  Offset X: 32~48
  Damage: 由 NPC_AI 傳入
  Debug Log: true during testing

RigidBody
  Type: Kinematic
  Gravity Scale: 0

PhysicsBoxCollider
  Sensor: true
  Enabled: false at start
  Size: W 35~55, H 25~40
```

### NPC / HpBar

```text
HpBar
  ProgressBar
    Mode: HORIZONTAL
    Progress: 1
    Total Length: 32~48

bar
  Sprite
```

`NPC_AI.showHpBar = false` 時，腳本應隱藏血條。

## 腳本實作步驟

### Step 1: PlayerAttackHitbox

新增或確認：

```text
assets/Scripts/Player/PlayerAttackHitbox.ts
```

職責：

- 攻擊時短暫啟用 PhysicsCollider。
- 記錄本次攻擊已命中的 NPC，避免同一次攻擊重複扣血。
- `onBeginContact()` 碰到 NPC hurtbox 時，往 parent 找 `NPC_AI`。
- 找到後呼叫：

```ts
npc.receiveAttack(damage, attackerNode);
```

必要 API：

```ts
activate(facingRight: boolean, damage: number, attackerNode: cc.Node)
deactivate()
onBeginContact(contact, selfCollider, otherCollider)
```

### Step 2: PlayerController 攻擊改為 hitbox

修改 `PlayerController.attack()`：

```text
attack()
  if attacking / hurting / dead -> return
  isAttacking = true
  playAnimation("PlayerAttack")
  attackHitbox.activate(facingRight, attackDamage, this.node)
```

PlayerController 需要 Inspector 欄位：

```ts
@property(cc.Float)
attackDamage: number = 20;

@property(PlayerAttackHitbox)
attackHitbox: PlayerAttackHitbox = null;
```

可保留 `attackRange` 做 debug 或之後調整 hitbox，但主要命中判定由 collider 負責。

### Step 3: NPC_AI 使用 RigidBody 移動

目前 NPC 若用 `this.node.x += ...`，會繞過物理系統，不適合重力和碰撞。

改成：

```text
onLoad()
  rb = getComponent(cc.RigidBody)

moveTowardTarget(dt)
  rb.linearVelocity.x = directionX * moveSpeed
  保留 rb.linearVelocity.y
```

建議欄位：

```ts
private rb: cc.RigidBody = null;

@property(cc.Float)
jumpForce: number = 360;

@property(cc.Float)
groundCheckVelocityY: number = 0.1;
```

移動邏輯：

```text
如果追蹤玩家：
  targetSpeedX = sign(target.x - npc.x) * moveSpeed
  rb.linearVelocity = cc.v2(targetSpeedX, rb.linearVelocity.y)

如果不追：
  rb.linearVelocity = cc.v2(0, rb.linearVelocity.y)
```

### Step 4: NPC 跳躍越障

先做簡化版，不需要 pathfinding。

判斷條件：

```text
NPC 正在追玩家
NPC 在地上
玩家在前方
前方有障礙物 或 NPC 水平速度被卡住
跳躍 cooldown 已結束
```

建議欄位：

```ts
@property(cc.Float)
jumpForce: number = 360;

@property(cc.Float)
jumpCooldown: number = 0.8;

@property(cc.Float)
stuckCheckTime: number = 0.25;

@property(cc.Float)
minMoveDeltaX: number = 1;
```

簡化實作：

```text
記錄 lastX
如果正在追，但一段時間 X 幾乎沒變，且在地上：
  rb.linearVelocity.y = jumpForce
```

更準確版本：

- 在 NPC 前方放 `ObstacleCheck` 子節點。
- `ObstacleCheck` 掛 sensor collider。
- sensor 碰到 ground / obstacle 時設定 `hasObstacleAhead = true`。
- 追蹤中且 `hasObstacleAhead` 且 grounded 就跳。

第一版建議先用 stuck detection，較快完成。

### Step 5: NPC 受傷 / 攻擊狀態配合 Player

NPC_AI 應對齊 PlayerController 的狀態模式：

```ts
private isAttacking: boolean = false;
private isHurting: boolean = false;
private isDead: boolean = false;
```

Update 開頭：

```text
if dead -> return
if attacking or hurting -> 不移動、不切 idle/move
```

攻擊：

```text
attackTarget()
  if cooldown -> return
  isAttacking = true
  isHurting = false
  play attack_*
  NPC attack hitbox activate
  attackTimer = attackCooldown
```

受傷：

```text
receiveAttack()
  currentHp -= damage
  updateHpBar()
  if hp <= 0 -> die()
  else -> onDamaged()

onDamaged()
  if neutral -> enraged
  isHurting = true
  isAttacking = false
  play damaged_*
```

動畫 finished：

```text
if attack_* finished:
  isAttacking = false
  currentAnimName = ""

if damaged_* finished:
  isHurting = false
  currentAnimName = ""

if death finished:
  destroy node
```

建議像 Player 一樣使用：

```ts
this.anim.on("finished", this.onAnimFinished, this);
```

onDestroy 時用安全清理：

```ts
if (this.anim && this.anim.node && cc.isValid(this.anim.node, true)) {
    this.anim.targetOff(this);
}
```

### Step 6: NPC 攻擊改為 NPCAttackHitbox

新增：

```text
assets/Scripts/NPC/NPCAttackHitbox.ts
```

職責：

- 攻擊時短暫啟用 collider。
- 碰到 Player hurtbox 時呼叫 Player 的 `takeDamage(damage)`。
- 避免同次攻擊重複打同一個 Player。

必要 API：

```ts
activate(facingRight: boolean, damage: number, attackerNode: cc.Node)
deactivate()
onBeginContact(...)
```

NPC_AI.attackTarget() 改成：

```text
play attack_*
npcAttackHitbox.activate(facingRight, attackDamage, this.node)
attackTimer = attackCooldown
```

不要在 `attackTarget()` 裡直接 `targetEntity.takeDamage()`。

### Step 7: NPC 血條

NPC_AI 欄位：

```ts
@property(cc.Boolean)
showHpBar: boolean = true;

@property(cc.ProgressBar)
hpBar: cc.ProgressBar = null;
```

onLoad：

```text
若 hpBar 沒拖，找子節點 HpBar / HPBar
updateHpBar()
```

受傷：

```text
updateHpBar()
```

死亡：

```text
hideHpBar()
```

商人：

```text
showHpBar = false
attackType = NONE
type = NPC_PEACE
```

## Debug Console

### Console log 項目

`NPC_AI.debugLog = true` 時建議印：

```text
[NPC_AI] Slime target = Player, type = 3
[NPC_AI] missing animation clip: attack_front
[NPC_AI] receiveAttack damage=20 hp=80/100
[NPC_AI] attack started: attack_right
[NPC_AI] jump: obstacle/stuck detected
```

`PlayerAttackHitbox.debugLog = true`：

```text
[PlayerAttackHitbox] enabled
[PlayerAttackHitbox] Hit NPC: Slime, damage: 20
[PlayerAttackHitbox] disabled
```

`NPCAttackHitbox.debugLog = true`：

```text
[NPCAttackHitbox] Hit Player, damage: 10
```

### F12 Console 使用

1. Preview / Browser 執行遊戲。
2. 按 F12。
3. 切到 Console。
4. 搜尋：

```text
NPC_AI
PlayerAttackHitbox
NPCAttackHitbox
```

## Hitbox 可視化

### Cocos Physics debug draw

在 `GameManager.onLoad()` 統一開啟：

```ts
const physicsManager = cc.director.getPhysicsManager();
physicsManager.enabled = true;
physicsManager.debugDrawFlags = 1;
```

測完可關掉：

```ts
physicsManager.debugDrawFlags = 0;
```

### Editor 中確認

確認每個 collider：

- Size 是否包住身體或攻擊範圍。
- Offset 是否在正確位置。
- Sensor 是否符合用途。
- AttackHitbox 是否在攻擊時移到面向方向。

## 測試順序

### Test 1: NPC 受重力

設定：

```text
Slime RigidBody: Dynamic
Gravity Scale: 1
Slime PhysicsBoxCollider: Sensor false
地面有 PhysicsBoxCollider
```

預期：

- Slime 會落到地面。
- 不會穿地板。

### Test 2: Player hitbox 命中 NPC

設定：

```text
Player AttackHitbox debugLog = true
Slime NPC_AI debugLog = true
Slime 有 PhysicsBoxCollider
```

操作：

- Player 面向 Slime。
- 左鍵攻擊。

預期：

```text
[PlayerAttackHitbox] Hit NPC: Slime, damage: 20
[NPC_AI] receiveAttack damage=20 hp=80/100
```

- Slime 血條下降。
- Slime 播 `damaged_*`。

### Test 3: NPC attack hitbox 命中 Player

設定：

```text
Slime AttackHitbox debugLog = true
Slime attackRange 合理
Player 有 PhysicsBoxCollider
```

操作：

- Player 站進 Slime 攻擊範圍。

預期：

```text
[NPCAttackHitbox] Hit Player, damage: 10
```

- Player HP 下降。
- Player 播 `PlayerHurt`。

### Test 4: NPC 越障

設定：

```text
Slime 追 Player
Player 和 Slime 之間放一個低障礙物
```

預期：

- Slime 被卡住時嘗試跳躍。
- Console 可看到 jump debug log。

### Test 5: NPC death

操作：

- Player 多次攻擊 Slime。

預期：

- Slime HP 到 0。
- 播 `death`。
- 隱藏 hp bar。
- 發送 `NPC_DIED`。
- death 動畫結束後 destroy。

## 完成定義

NPC 系統完成時應符合：

- [ ] NPC root 有 Dynamic RigidBody，受重力影響。
- [ ] NPC 有可被 PlayerAttackHitbox 命中的 hurtbox。
- [ ] Player 攻擊 NPC 使用 hitbox 判定。
- [ ] NPC 攻擊 Player 使用 hitbox 判定。
- [ ] NPC 追玩家時遇障礙會嘗試跳躍。
- [ ] NPC 受傷會扣 HP、更新血條、播放 damaged animation。
- [ ] NPC 攻擊會播放 attack animation。
- [ ] NPC 死亡會播放 death animation，再 destroy。
- [ ] F12 Console 可看到 NPC / hitbox debug log。
- [ ] Physics debug draw 可看到 hitbox / hurtbox。


# Attack Hitbox Design

## Current Problems

1. Attack hitboxes can enable and disable correctly, but no `Hit ...` log appears.
   - This means `onBeginContact()` is not firing, or it fires but cannot find a valid `BaseEntity`.
   - For Cocos Creator 2.4, attack sensor colliders should explicitly enable contact listener.

2. `PlayerAttackHitbox` and `NPCAttackHitbox` duplicate almost the same logic.
   - Future NPC vs NPC combat would need more copies.
   - Melee attacks should use one shared script: `CombatHitbox`.

3. Damage should not depend on whether the target is Player or NPC.
   - The hitbox should only decide whether the target is legal.
   - The target entity should decide how to react to damage.

## Final Flow

```text
PlayerController.attack() / NPC_AI.attackTarget()
  -> CombatHitbox.activate(facingRight, damage, attackerNode)
  -> CombatHitbox enables sensor collider
  -> Cocos physics sends onBeginContact
  -> CombatHitbox finds BaseEntity on the contacted node or its parents
  -> CombatHitbox rejects self / same-side targets
  -> CombatHitbox calls target.receiveAttack(...) if available
  -> otherwise calls target.takeDamage(...)
```

## Shared CombatHitbox Rules

`CombatHitbox` is the only melee hitbox script.

Inspector fields:

```text
Active Time
Offset X
Offset Y
Owner Faction
Ignore Same Faction
Can Hit Player
Can Hit Peace NPC
Can Hit Neutral NPC
Can Hit Hostile NPC
Debug Log
```

Recommended presets:

```text
Player melee hitbox
  Owner Faction: PLAYER
  Ignore Same Faction: true
  Can Hit Player: false
  Can Hit Peace NPC: true/false depending on design
  Can Hit Neutral NPC: true
  Can Hit Hostile NPC: true

Hostile NPC melee hitbox
  Owner Faction: HOSTILE_NPC
  Ignore Same Faction: true
  Can Hit Player: true
  Can Hit Peace NPC: false
  Can Hit Neutral NPC: false
  Can Hit Hostile NPC: false
```

For future NPC vs NPC combat, set the hitbox target switches according to the NPC's team.

## Contact Listener Requirements

AttackHitbox node:

```text
CombatHitbox
RigidBody: Kinematic, Gravity Scale 0
PhysicsBoxCollider:
  Sensor: true
  Enabled Contact Listener: true
```

Body / hurtbox node:

```text
BaseEntity subclass, such as PlayerController or NPC_AI
RigidBody: Dynamic
PhysicsBoxCollider:
  Sensor: false
```

If contact still does not fire, also enable contact listener on the body collider during testing.

## Debug Checklist

When an attack starts:

```text
[CombatHitbox] enabled damage=20, localPos=(...)
```

When contact happens:

```text
[CombatHitbox] contact with Slime
[CombatHitbox] Hit Slime, damage=20
```

When target receives damage:

```text
[NPC_AI] receiveAttack damage=20 hp=80/100
```

If there is `enabled` and `disabled` but no `contact with ...`, the physics contact listener or collider overlap is wrong.

If there is `contact with ...` but no `Hit ...`, the target filter is rejecting it or the contacted node has no `BaseEntity` on itself or parents.

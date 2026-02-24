# Action Combat Game — Design Spec (v0.1)

This document converts the provided concept into implementation-oriented language while preserving intent.

## 1) Core Loop

- Fight enemies in persistent zones on a radial map.
- Combat runs in waves (baseline: 60 seconds).
- End of each wave:
  - Enemy power scales by 1.5x.
  - Player selects one upgrade (~15–20% gain in a single axis).
  - Consumables can be purchased whenever they are in stock.
- Run ends on death or voluntary retirement at wave end.

### Meta progression

- Restart loadout resets to club.
- Permanent upgrades persist across runs.
- Zone local difficulty resets between runs.
- Retired characters can be hired as frozen-power helpers.
- Dead runs can be revived with expensive potions.

## 2) World Structure

- Radial, concentric map organized like a clock face.
- World always loaded in memory (no instancing/teleporting).
- Zone state persists while traveling (mid-wave enemies remain).

### Zone rings

- R < 1: Orchard.
- R1–2: Grove, Creekside.
- R2–3: Pasture, Smith Town, Fletcher Village.
- R3–4: Tundra, Sawmill Woods, Marsh, Marches, Desert, Volcano, Mine, Frosty Mountain.
- R4–5: Swamp, Foundry Monastery.

## 3) Combat Model

- Channels: impact, pierce, cut.
- Weapon properties: mass, velocity, area, geometry.
- Armor reduces penetration and converts sharp contribution into blunt.
- Projectile effectiveness decays over range due to slowing.
- Movement velocity adds into projectile launch velocity (horseback skill expression).

## 4) Elements

- Fire: high DPS that decays.
- Ice: slow.
- Poison: DPS ramps over time.
- Native enemies resist matching element.

## 5) Economy

- Currency from kills.
- Zone-specific payout multipliers per category.
- Zone shops provide healing/ammo/charges.
- Pasture unlocks courier logistics across zones with distance-scaled cost/time.

## 6) Waves, Difficulty, and Bosses

- Baseline wave = 60s.
- Difficulty tracks aggregate enemy durability + pressure.
- Enemy scaling intentionally outpaces player growth.
- Boss cadence approximately every third wave.
- Marches equivalent: fortress capture objective.

## 7) Marches Army Layer

- Capture rook fortresses, then interact with queen inside.
- Two factions of recruitable pawns with promotion system.
- Promotions lock weapon lineage and do not inherit future player upgrades.
- Some upgrades allow projectile recovery by units.

## 8) Key Persistence Rules

- First zone entry starts wave.
- Later wave starts require player aggression.
- Leaving a zone pauses that zone's wave activity.
- Most enemies do not chase across zone boundaries.
- Projectiles may cross zone boundaries.

## 9) Baseline Implementation Priority

1. Data-first schema and content loading.
2. Wave simulation + scaling + retirement flow.
3. Zone runtime state and persistence.
4. Combat resolver with element/status effects.
5. Economy and shop integrations.
6. AI behavior profiles (ant lines, circling flyers, chargers, sneaky mushrooms).

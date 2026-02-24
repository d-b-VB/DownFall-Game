# DownFall Game

Initial project scaffold for a top-down action combat game with emoji-style visuals.

## Included in this commit

- `docs/design-v0.1.md`: normalized design spec for implementation.
- `data/game_blueprint.json`: JSON-ready baseline schema for zones, weapons, status effects, waves, and progression.

## Next implementation steps

1. Build a simulation core for wave progression and scaling.
2. Add zone runtime state (active enemies, paused waves, persistence).
3. Add combat resolver for impact/pierce/cut channels.
4. Add economy and vendor systems per zone.
5. Add renderer/UI with compressed offscreen map overview.

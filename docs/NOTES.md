# Notes

Scratch space for ideas, game data sources, and leftover questions.

## Open questions

- [x] What is being routed — collectibles, quests, resource nodes, fast-travel hops?
  Answered: A→B along roads (main / sub / off-road), Horse or On foot.
- [x] Where does map/node data come from — manual entry, a wiki, datamined files?
  Answered: raster extraction (`scripts/extract-roads.py`) plus in-app tracing.
  Map image from PowerPyx (see SOURCE.md).
- [x] Interface: local web app, CLI, or something usable second-screen while playing?
  Answered: local web app, phone-first, usable beside the game.
- [x] Does it need to run offline / on a phone beside the TV?
  Answered: yes — `npm run build` is an offline-capable static `dist/`.

## Ideas for later

- Fast-travel nodes
- Multi-stop routes
- In-game speed calibration
- Higher-res map source (MapGenie tiles are gated)
- Water-aware off-road legs

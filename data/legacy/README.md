# Legacy road graph

`roads-powerpyx.json` is the last extraction from the PowerPyx in-game map (5178 x 5240
px, its own pixel coordinates; see SOURCE.md "Previous source"). The th.gl tiles omit
some thin trails that the in-game map draws, so `scripts/extract-roads.py --legacy`
imports the trails from this file that have no counterpart in the new graph
(docs/DECISIONS.md D5). The file is frozen: the pipeline that produced it was retired
on 2026-09-03 (git history has `scripts/build-tiles.py` and the old extractor).

---
name: resync
description: "Regenerate the conductor architecture map (.conductor/architecture.md) for the current project and re-stamp it to HEAD. Use when the codebase has drifted enough that the map is stale, or after a big refactor or merge."
---

# conductor:resync

Regenerate the persisted project map.

1. Read `${CLAUDE_PROJECT_DIR}/.conductor/profile.json` for `architectureMap.path`. If there's no profile, tell the user to run `/conductor:init`.
2. Dispatch the **scout** agent in map mode to build a fresh project-understanding map — package/module map, data-flow, key entry points — and write it to the map path.
3. Re-stamp: record `git rev-parse HEAD` as `architectureMap.generatedAtSha` in the profile.
4. Summarize what changed and offer to commit.

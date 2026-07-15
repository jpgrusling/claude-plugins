# crew

Assemble a crew of subagents to run a single design→delivery effort — **survey → align → build (isolated worktree) → inspect → integrate** — driven by a per-project profile you set up once. The flow is the same everywhere; the project-specific knowledge (gates, conventions, codegen, visual QA) lives in a committed `.crew/` profile, so `crew` works in any repo.

## Install

```bash
claude plugin marketplace add jpgrusling/claude-plugins
claude plugin install crew@jpgrusling
```

## Set up a project (once)

```
/crew:init
```

`init` runs a read-only detector (package manager, task runner, trunk, gate commands, protected paths, codegen, visual-QA target), confirms it with you, asks the few things it can't detect (conventions, design source), lets you pick a **persona skin**, generates a project **architecture map**, and writes it all to a committed `.crew/profile.json` + `.crew/architecture.md`.

A plugin can't grant its own permissions, so `init` prints the entries to add to your repo's `.claude/settings.json` (a couple of git reads + your Playwright MCP tools) and offers to add them for you.

## Run an effort

```
/crew:assemble
```

Drop a design or ticket link. The foreman runs the pipeline:

1. **Survey** — `surveyor` (read-only) returns a recon report + initial plan + the hard questions.
2. **Align** — you and the foreman lock the plan (`.crew/plans/<effort>.md`).
3. **Build** — `builder` builds it in an isolated worktree, running your gates; never pushes.
4. **QA loop** — `inspector` runs the gates + visual QA and returns ranked findings; the foreman routes each back to `builder` through an escalation ladder until clean.
5. **Manual QA** — final acceptance with you.
6. **Integrate** — the foreman recommends a merge strategy, confirms, merges into your trunk, and cleans up. Pushing is always confirmed with you.

Small, unambiguous changes skip the pipeline — the foreman does them inline as a **quick-hit** (commits without asking; still confirms before pushing).

## The crew (and skins)

Agents are `surveyor`, `builder`, `inspector` (functional names = invocation handles). Their **display names** are skinnable per project: pick a shipped preset during `init`, or set `personas` in your profile to anything you like. Shipped presets are trademark-safe; custom names live only in your repo.

```json
"personas": { "foreman": "Athena", "surveyor": "Hermes", "builder": "Hephaestus", "inspector": "Themis" }
```

## Keeping the map fresh

The architecture map is stamped with the commit it was built at. The `surveyor` refreshes the slice it needs at the start of each effort; run `/crew:resync` to regenerate the whole map after a big change.

## Reference

- [`reference/profile.schema.json`](./reference/profile.schema.json) — the profile contract
- [`reference/profile.example.json`](./reference/profile.example.json) — a filled example
- [`reference/presets.json`](./reference/presets.json) — the shipped persona skins

## License

[MIT](../../LICENSE)

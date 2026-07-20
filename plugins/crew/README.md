# crew

Assemble a crew of subagents to run a single design→delivery effort — **survey → align → build (isolated worktree) → inspect → integrate** — driven by a per-project profile you set up once. The flow is the same everywhere; the project-specific knowledge (gates, conventions, codegen, visual QA) lives in a committed `.crew/` profile, so `crew` works in any repo.

## Install

```bash
claude plugin marketplace add jpgrusling/claude-plugins
claude plugin install crew@jpgrusling
```

## New here?

```
/crew:guide
```

An interactive, read-only concierge: it reads your project's `.crew/` profile and your preferences, tells you what this project's crew is set up to do, and points you at the right skill for whatever you're trying to accomplish — without doing the work itself. The fastest way to onboard a teammate to a repo that already uses the crew.

## Set up a project (once)

```
/crew:init
```

`init` runs a read-only detector (package manager, task runner, trunk, gate commands, protected paths, codegen, visual-QA target), confirms it with you, asks the few things it can't detect (conventions, design source), optionally **pins a persona skin or model tier** for the project if you want to be prescriptive, generates a project **architecture map**, and writes the project facts to a committed `.crew/profile.json` + `.crew/architecture.md`. Your personal skin, model tier, and visual-QA tool live in `~/.claude/crew/preferences.json` and resolve at runtime, so they're never baked into each repo.

A plugin can't grant its own permissions, so `init` prints the entries to add to your repo's `.claude/settings.json` (a couple of git reads + your Playwright MCP tools) and offers to add them for you.

### Carry preferences across projects

Run `/crew:preferences` to set standing preferences at `~/.claude/crew/preferences.json`. Your **persona skin, per-role model tier, and visual-QA tool** are *live* — the foreman resolves them on every run (`project pin > your preferences > plugin default`), so they're never committed to a repo and a change applies everywhere at once. Your **plan dir, conventions doc, and extra permissions** are *seeds* — `init` copies them into a new project's committed profile. A project can still **pin** a skin or tier in its profile to be prescriptive for the whole team. (User-scoped; works with no project open.)

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

## Debug a complex bug

```
/crew:debug
```

For **cause-unknown** bugs. Describe the symptom; the foreman runs a debugging pipeline:

1. **Diagnose** — `diagnostician` works in an isolated worktree: reproduces, adds throwaway instrumentation, bisects, and returns a **proven root cause + minimal repro + fix plan**, discarding its scratch changes (it may leave a flagged repro test).
2. **Align** — you confirm the root cause and fix approach before any product code changes.
3. **Fix → QA → integrate** — the same `builder` → `inspector` loop and integration ritual as `assemble`.

If the fix keeps failing QA because the diagnosis was wrong, the foreman re-opens diagnosis rather than grinding the builder. Cause already understood? Use `/crew:assemble` (or a quick-hit) instead.

## Research a question

```
/crew:research
```

Send the **Scout** out to documentation, the web, and MCP tools; it returns a distilled, cited brief instead of a pile of pages (the raw docs stay in its context, not yours). Works standalone with no project open, and it's the same Scout the foreman/surveyor/diagnostician dispatch on-demand during the crew flows. For a heavyweight, multi-source investigation, use the `deep-research` skill instead.

## Review someone else's code

```
/crew:review
```

An **interactive** review of a colleague's PR or diff — correctness, style, architecture, and design intent — grounded in your project's conventions and architecture map. It fans out parallel dimension passes (`reviewer` agent), synthesizes and de-duplicates them, then **walks the findings with you conversationally** so you decide what stands and the author learns *why*; optionally posts the agreed findings as inline PR comments (confirmed first). Distinct from the inspector: the inspector gatekeeps the crew's *own* build against a locked plan; the reviewer judges *external* code on its merits for a human author. Works with no profile, better with one.

## More flows

- **`/crew:test`** — the **Tester** designs a strategy, writes missing coverage, and hunts edge cases adversarially in a worktree; product-bug findings route to the builder. Also runs as an optional coverage pass inside `assemble`.
- **`/crew:design`** — for non-trivial or novel work, the **Architect** weighs approaches and tradeoffs and returns a design; you align it; the foreman persists an ADR. Routine work skips this and goes straight to `assemble`.
- **`/crew:audit`** — the **Security Auditor** runs a threat-model / authz / injection / secrets / deps pass (wrapping the shipped `security-review` skill) and returns severity-ranked findings with concrete exploit scenarios, walked with you.
- **`/crew:campaign`** — orchestrates a large initiative: the Architect decomposes it into ordered efforts, you align the breakdown, then it sequences `assemble`/`debug` runs with a checkpoint between each (parallel only where efforts don't overlap).

## The crew (and skins)

Agents are `surveyor`, `builder`, `inspector`, `diagnostician`, `scout`, `reviewer`, `tester`, `architect`, `auditor` (functional names = invocation handles). The Scout is external read-only recon; the Reviewer critiques others' code for a human author; the Tester authors coverage; the Architect designs before building; the Auditor is a security lens. Their **display names** are skinnable: set a skin in your `~/.claude/crew/preferences.json` (applies everywhere), or **pin** one in a project's `.crew/profile.json` to standardize it for the team. Pick a shipped preset or name them anything; shipped presets are trademark-safe, custom names live only in your files.

```json
"personas": { "foreman": "Athena", "surveyor": "Hermes", "builder": "Hephaestus", "inspector": "Themis", "diagnostician": "Asclepius", "scout": "Metis", "reviewer": "Mentor", "tester": "Argus", "architect": "Daedalus", "auditor": "Cassandra" }
```

## Keeping the map fresh

The architecture map is stamped with the commit it was built at. The `surveyor` refreshes the slice it needs at the start of each effort; run `/crew:resync` to regenerate the whole map after a big change.

## Reference

- [`reference/profile.schema.json`](./reference/profile.schema.json) — the profile contract
- [`reference/profile.example.json`](./reference/profile.example.json) — a filled example
- [`reference/preferences.schema.json`](./reference/preferences.schema.json) — the user-preferences contract (`~/.claude/crew/preferences.json`)
- [`reference/preferences.example.json`](./reference/preferences.example.json) — a filled preferences example
- [`reference/presets.json`](./reference/presets.json) — the shipped persona skins
- [`reference/PRINCIPLES.md`](./reference/PRINCIPLES.md) — the design principles the crew is built on
- [`reference/routing.md`](./reference/routing.md) — which skill/role for which situation

## License

[MIT](../../LICENSE)

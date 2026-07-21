---
name: preferences
description: "Create or edit your user-level crew preferences at ~/.claude/crew/preferences.json — your persona skin, per-role model tier, and visual-QA tool (resolved live on every run) plus plan-dir/conventions/permissions seeds for init. Also syncs those preferences into the current project: pin your skin/tiers/visual-QA tool as team-prescriptive, unpin them, or refresh the profile's seed fields. Use for 'set crew preferences', 'crew:preferences', 'crew:defaults', 'edit my crew preferences', 'change my persona skin / model tier', 'pin my prefs to this repo', 'sync preferences to this project', 'make these prescriptive', or 'refresh this project's seeds'. User-scoped and works with no project open; for first-time per-project setup use /crew:init."
---

# crew:preferences

Guided create/edit of `~/.claude/crew/preferences.json` — your personal crew preferences, carried across every project and **never committed to a repo**. Editing preferences writes only to your home dir and needs no detection. This skill also has one repo-facing mode — **sync to the current project** (§4) — for when you want those standing preferences reflected in a specific repo; that's the *only* thing here that writes into `.crew/`.

Two kinds of field live here:

- **Live** — `models`, `personas`, `visualQA.tool`. The foreman resolves these on **every run** (`profile pin > your preferences > plugin default`). They are *not* written into a project's `.crew/profile.json`, so changing one here takes effect everywhere immediately, with no re-`init`.
- **Seed** — `planDir`, `conventions`, `permissions`. These pre-fill the `/crew:init` interview and get copied into the committed profile as project facts.

## 1 · Load current state

Read `~/.claude/crew/preferences.json` if it exists — you're editing; show what's set and change only what they ask. If it doesn't exist, you're creating from scratch; seed from `${CLAUDE_PLUGIN_ROOT}/reference/preferences.example.json` as a starting point. Every field is optional — a partial file is valid, so don't force a value the user doesn't care to standardize.

## 2 · Walk the fields

Confirm or set each, skipping any the user isn't interested in standardizing:

- **Models** *(live)* — per-role tier, resolved at dispatch. The shipped tier runs every role at the **strong** tier except `scout`, which defaults to `claude-sonnet-5` (bounded and external). Surveyor and inspector are judgment roles, so they stay strong. Offer it as the starting point; let them adjust any role. `inherit` = use the session model.
- **Personas** *(live)* — a skin for the ten roles (foreman, surveyor, builder, inspector, diagnostician, scout, reviewer, tester, architect, auditor). Offer the shipped presets (`cat "${CLAUDE_PLUGIN_ROOT}/reference/presets.json"`) or take custom names. This is your default skin everywhere; a project can still pin its own at init.
- **Visual QA** *(live)* — `tool`: `playwright` or `none` (default `playwright`; set `none` if you don't run Playwright). Only the tool is a preference; `target`/`startCommand` are always per-project, set at init.
- **Plan dir** *(seed)* — preferred plan directory for new projects (default `.crew/plans`).
- **Conventions** *(seed)* — a `docRef` filename init should look for first (e.g. `AGENTS.md`), and/or standing `notes`.
- **Permissions** *(seed)* — extra `permissions.allow` entries init should append on top of the plugin baseline (e.g. Bash allowlist entries you always grant the crew).

## 3 · Validate + write

Validate against `${CLAUDE_PLUGIN_ROOT}/reference/preferences.schema.json`. Set `version: 1`. Create `~/.claude/crew/` if needed and write `~/.claude/crew/preferences.json`. Show the final file.

**Do not commit it and do not write it into any repo** — it's user-scoped by design. Live fields take effect on the next crew run anywhere; seed fields take effect the next time `/crew:init` runs in a project.

## 4 · Sync to the current project (pin / unpin / re-seed)

This is the **one place preferences reach into a repo**, and it's optional — everything above is user-scoped. Enter it when the user wants their standing preferences reflected in a specific repo: *"pin my skin here"*, *"make these prescriptive for the team"*, *"sync my prefs to this project"*, *"refresh this repo's seeds"*. It's distinct from editing preferences — the user can run it without changing preferences at all.

Requires the current project to already have a `.crew/profile.json`. If there's none, this repo hasn't been set up — point them at `/crew:init`, which does the first-time seed (this mode is for *after* init, when preferences have drifted or the team wants a pin). Read the project's `.crew/profile.json` and the user's `~/.claude/crew/preferences.json` first.

**Always show a `current → new` diff and confirm before writing.** Never touch the project facts the detector owns — `trunk`, `gates`, `protected`, `packageManager`, `codegen`, `visualQA.target`/`startCommand`, `designSource`, `architectureMap`. This mode only ever touches the pinnable live blocks and the seed fields.

Offer whichever of the three the user wants:

**Pin live fields (prescribe for the team).** Write the resolved live values into the profile so *everyone* who runs the crew here uses them regardless of their own preferences (`profile pin > preferences > plugin default`):
- `personas` — all ten roles.
- `models` — per-role tiers.
- `visualQA.tool` — only if the project must force one for everyone.

Resolve "current" from the user's `preferences.json`, falling back to the plugin default for anything unset. Show `profile now → pin` per field and write only the block(s) the user chose to pin. (This is the same pin `/crew:init` offers, available any time after setup.)

**Unpin (hand back to runtime resolution).** Remove `personas` / `models` / `visualQA.tool` from the profile so each person's own preferences win again. Show what's being removed and what it will resolve to afterward for the current user.

**Re-seed (refresh seeds without re-detecting).** `/crew:init` copies the seed fields once at setup; this refreshes them from current preferences **without re-running the detector**:
- `planDir` and `conventions.docRef`/`notes` → into `.crew/profile.json`.
- `permissions.allow` → appended to the repo's `.claude/settings.json`, deduped against what's there; **never remove** existing entries, and keep the list read-only (no write/push/merge commands — see `/crew:init` §6).

Only offer to re-seed fields the preferences actually set, and leave any project value the user has hand-tuned alone unless they confirm the overwrite.

Validate the updated profile against `${CLAUDE_PLUGIN_ROOT}/reference/profile.schema.json`, show the final file, and offer to commit `.crew/profile.json` (and `.claude/settings.json` if it changed). Pushing is the user's call, as always.

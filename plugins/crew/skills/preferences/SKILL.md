---
name: preferences
description: "Create or edit your user-level crew preferences at ~/.claude/crew/preferences.json — your persona skin, per-role model tier, and visual-QA tool (resolved live on every run) plus plan-dir/conventions/permissions seeds for init. Use for 'set crew preferences', 'crew:preferences', 'crew:defaults', 'edit my crew preferences', or 'change my persona skin / model tier'. User-scoped and works with no project open; for per-project setup use /crew:init."
---

# crew:preferences

Guided create/edit of `~/.claude/crew/preferences.json` — your personal crew preferences, carried across every project and **never committed to a repo**. This is **not** project setup: it writes to your home dir, touches no repo, and needs no detection.

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

---
name: defaults
description: "Create or edit your user-level crew defaults at ~/.claude/crew/defaults.json — standing preferences (model tier, persona skin, visual-QA tool, plan dir, conventions doc, extra permissions) that /crew:init layers under detection so new projects start from your choices. Use for 'set crew defaults', 'crew:defaults', 'edit my crew preferences', or 'change the default model tier/personas'. This is user-scoped and works with no project; for per-project setup use /crew:init."
---

# crew:defaults

Guided create/edit of `~/.claude/crew/defaults.json` — your standing preferences that carry across every project. This is **not** project setup: it writes to your home dir, touches no repo, and needs no detection. `/crew:init` reads this file and layers it **under** detection (`project profile > detected > your defaults > plugin defaults`).

## 1 · Load current state

Read `~/.claude/crew/defaults.json` if it exists — you're editing; show the user what's set and change only what they ask. If it doesn't exist, you're creating from scratch; seed from `${CLAUDE_PLUGIN_ROOT}/reference/defaults.example.json` as a starting point. Every field is optional — a partial file is valid, so don't force a value the user doesn't care to standardize.

## 2 · Walk the fields

Confirm or set each, skipping any the user isn't interested in standardizing:

- **Models** — per-role tier. The shipped tier is strong `builder`/`diagnostician` (code + judgment) and `claude-sonnet-5` for `surveyor`/`inspector` (cost). Offer it as the starting point; let them adjust any role. `inherit` = use the session model.
- **Personas** — a skin for the five roles (foreman, surveyor, builder, inspector, diagnostician). Offer the shipped presets (`cat "${CLAUDE_PLUGIN_ROOT}/reference/presets.json"`) or take custom names.
- **Visual QA** — default `tool`: `playwright` or `none`. (Only the tool is a user default; `target`/`startCommand` are always per-project, set at init.)
- **Plan dir** — preferred plan directory for new projects (default `.crew/plans`).
- **Conventions** — a `docRef` filename init should look for first (e.g. `AGENTS.md`), and/or standing `notes`.
- **Permissions** — extra `permissions.allow` entries init should append on top of the plugin baseline (e.g. Bash allowlist entries you always grant the crew).

## 3 · Validate + write

Validate against `${CLAUDE_PLUGIN_ROOT}/reference/defaults.schema.json`. Set `version: 1`. Create `~/.claude/crew/` if needed and write `~/.claude/crew/defaults.json`. Show the final file.

**Do not commit it and do not write it into any repo** — it's user-scoped by design. It takes effect the next time `/crew:init` runs in any project.

---
name: init
description: "Set up crew for a project: detect the toolchain, confirm it with you, and persist a .crew/ profile + architecture map so /crew:assemble can run here. Use for 'set up crew', 'crew init', 'profile this project', or the first time crew runs in a repo."
---

# crew:init

Run once per project. Produces a committed `.crew/profile.json` (+ `architecture.md`) that teaches the flow how *this* repo works. Re-run whenever the toolchain changes.

## 0 · Load user preferences (if any)

Read `~/.claude/crew/preferences.json` if it exists (validate against `${CLAUDE_PLUGIN_ROOT}/reference/preferences.schema.json`). It holds two kinds of field:

- **Live** (`models`, `personas`, `visualQA.tool`) — the foreman resolves these at runtime; **init does not persist them into the profile.** You only touch them here if the user wants to *pin* one for the whole project (steps 2–3).
- **Seed** (`planDir`, `conventions.docRef`/`notes`, `permissions.allow`) — use these to **pre-fill** the interview so you only ask about what they don't cover; these *are* written into the committed profile.

**Precedence for seed fields, highest first:** an existing project `.crew/profile.json` > detected values (step 1) > these preferences > plugin defaults (the schema). Never let a preference silently override something the detector found with high confidence — reconcile and confirm if they disagree. If no preferences file exists, mention once that the user can set standing choices (skin, model tier, visual-QA tool) with `/crew:preferences` so they don't re-enter them per project, then continue.

## 1 · Detect (mechanical, read-only)

Run the bundled detector and read its JSON:

```bash
node "${CLAUDE_PLUGIN_ROOT}/bin/detect.mjs"
```

It reports package manager, task runner, trunk, candidate gate commands, protected globs, codegen signals, visual-QA target, and stack — each with a confidence level plus a `needsConfirm` list and `warnings`. Never accept low/medium-confidence guesses silently.

## 2 · Confirm + fill gaps (interview)

Batch-confirm the high-confidence values; interrogate everything in `needsConfirm` and anything blank:

- **Gates** — exact lint / format / format-write / typecheck / build / test commands. Blank = not available; note it and move on.
- **Conventions** — house rules the crew must follow (classname helper, comment style, breakpoints, design-token rules…). Offer to read an in-repo doc (`AGENTS.md` / `CLAUDE.md`) and record it as `conventions.docRef` + a short `notes` summary.
- **Visual QA** — detect the project fact: is there a Storybook/dev server to check against, and how is it started? Persist `visualQA.target` + `startCommand` in the profile. The **tool** (`playwright`/`none`) is a live preference, not a project fact — don't persist it unless pinning. The resolved default is `playwright` (assumed available), so a detected target gets visual QA by default; if the user doesn't run Playwright, tell them to set `tool: none` via `/crew:preferences`. Pin `visualQA.tool` in the profile only if the project must force one for everyone.
- **Design source** — `figma` / `tickets` / `none`.
- **Codegen** — does changing the API need a regen step? the command + any prerequisite (e.g. a backend must be running first).
- **Models** — per-role tier is a **live preference**, resolved from the user's `preferences.json` at runtime, so **don't persist `models` into the profile** by default. Write a `models` block into the profile only if the user wants to *pin* a tier for the whole project (e.g. force a strong builder regardless of who runs it) — ask, don't assume. If they have no model preference set at all, point them at `/crew:preferences`; the plugin default is strong-everywhere-except-`scout` (surveyor and inspector are judgment roles).
- **Plan dir** — default `.crew/plans`; if the repo already uses one (e.g. `.agents/plans`), offer to reuse it.

## 3 · Persona skin

The persona skin is a **live preference**: the foreman resolves it from the user's `preferences.json` on every run, so it normally does **not** go in the repo. **Ask which the project wants:**

- **Keep it personal (default).** If the user has a skin in their preferences it just applies — nothing to write here. If they don't and want one, point them at `/crew:preferences`; the plugin default is the functional names.
- **Pin it to the repo (prescriptive).** If the project should pin a skin so everyone who runs the crew here narrates the same names, offer the shipped presets or custom names and write a `personas` block (all ten roles) into the profile; that pin then wins over each person's preference. Otherwise leave `personas` out of the profile entirely.

```bash
cat "${CLAUDE_PLUGIN_ROOT}/reference/presets.json"
```

Shipped presets are trademark-safe; custom names live only in the user's files, never in the plugin.

## 4 · Architecture map

Dispatch the **surveyor** agent in map mode to build a project-understanding map (package/module map, data-flow, key entry points) and write it to `.crew/architecture.md`. Stamp it with the current commit:

```bash
git rev-parse HEAD
```

Record that SHA as `architectureMap.generatedAtSha`. (The surveyor refreshes stale slices per effort; `/crew:resync` regenerates the whole map.)

## 5 · Persist

Write `.crew/profile.json` (validate against `${CLAUDE_PLUGIN_ROOT}/reference/profile.schema.json`) and `.crew/architecture.md`. The profile holds **project facts** — `trunk`, `gates`, `protected`, `packageManager`, `codegen`, `visualQA.target`/`startCommand`, `designSource`, `conventions`, `planDir`, `architectureMap`. **Omit `models`, `personas`, and `visualQA.tool` unless the user chose to pin them** (steps 2–3) — those resolve from preferences at runtime. Show the user the final profile and offer to commit both.

## 6 · Permissions

A plugin can't ship permission grants, so the flow will otherwise prompt on Playwright and a couple of git reads. Print the entries to add to the repo's `.claude/settings.json`, and offer to append them yourself with the user's ok:

```json
{
  "permissions": {
    "allow": [
      "Bash(git diff:*)",
      "Bash(git branch:*)",
      "mcp__plugin_playwright_playwright__browser_navigate",
      "mcp__plugin_playwright_playwright__browser_snapshot",
      "mcp__plugin_playwright_playwright__browser_take_screenshot",
      "mcp__plugin_playwright_playwright__browser_resize",
      "mcp__plugin_playwright_playwright__browser_click",
      "mcp__plugin_playwright_playwright__browser_console_messages",
      "mcp__plugin_playwright_playwright__browser_network_requests",
      "mcp__plugin_playwright_playwright__browser_wait_for"
    ]
  }
}
```

Skip the Playwright entries if the resolved visual-QA tool is `none` (no `playwright` pin in the profile and none in the user's preferences). The Playwright tool names assume a Playwright MCP is installed in the host; adjust to match the host's server if it differs. Append any entries from the user's `preferences.permissions.allow` on top of this baseline.

**Keep this allow-list read-only.** It's the enforcement layer for the read-only crew members: because mutating shell commands (`git push`, `rm`, `git checkout .`) are *not* on it, a read-only agent that strays into one surfaces a prompt to you instead of running silently. Don't add write/push/merge commands here — the builder mutates inside its own isolated worktree, and the foreman handles integration with your explicit go-ahead.

## 7 · Done

Tell the user they can now run `/crew:assemble` with a design/ticket link.

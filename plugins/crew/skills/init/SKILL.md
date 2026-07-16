---
name: init
description: "Set up crew for a project: detect the toolchain, confirm it with you, and persist a .crew/ profile + architecture map so /crew:assemble can run here. Use for 'set up crew', 'crew init', 'profile this project', or the first time crew runs in a repo."
---

# crew:init

Run once per project. Produces a committed `.crew/profile.json` (+ `architecture.md`) that teaches the flow how *this* repo works. Re-run whenever the toolchain changes.

## 0 · Load user defaults (if any)

Read `~/.claude/crew/defaults.json` if it exists (validate against `${CLAUDE_PLUGIN_ROOT}/reference/defaults.schema.json`). It holds the user's standing preferences — `models`, `personas`, `visualQA.tool`, `planDir`, `conventions.docRef`, extra `permissions.allow`. Use it to **pre-fill** the interview so you only ask about what it doesn't cover.

**Precedence, highest first:** an existing project `.crew/profile.json` > detected values (step 1) > these user defaults > plugin defaults (the schema). Never let a user default silently override something the detector found with high confidence — reconcile and confirm if they disagree. If no defaults file exists, mention once that the user can set these up with `/crew:defaults` (or hand-write from `${CLAUDE_PLUGIN_ROOT}/reference/defaults.example.json`) to carry choices across projects, then continue.

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
- **Visual QA** — is there a Storybook/dev server to check against, how is it started, is Playwright available? (`tool: none` if not.)
- **Design source** — `figma` / `tickets` / `none`.
- **Codegen** — does changing the API need a regen step? the command + any prerequisite (e.g. a backend must be running first).
- **Models** — per-role tier. Propose the default tiering (strong `builder`/`diagnostician`/`reviewer` for code, judgment, and architecture depth; `claude-sonnet-5` for `surveyor`/`inspector`/`scout` to cut cost) unless the user's defaults already set it. Confirm rather than assume.
- **Plan dir** — default `.crew/plans`; if the repo already uses one (e.g. `.agents/plans`), offer to reuse it.

## 3 · Persona skin

Offer the shipped presets, or let the user enter their own names, or keep defaults:

```bash
cat "${CLAUDE_PLUGIN_ROOT}/reference/presets.json"
```

Shipped presets are trademark-safe. The user can name the crew anything they like — custom names live only in their `profile.json`, never in the plugin. If the user's defaults set a skin, use it unless they want to change it here. Record all seven names (foreman, surveyor, builder, inspector, diagnostician, scout, reviewer) under `personas`.

## 4 · Architecture map

Dispatch the **surveyor** agent in map mode to build a project-understanding map (package/module map, data-flow, key entry points) and write it to `.crew/architecture.md`. Stamp it with the current commit:

```bash
git rev-parse HEAD
```

Record that SHA as `architectureMap.generatedAtSha`. (The surveyor refreshes stale slices per effort; `/crew:resync` regenerates the whole map.)

## 5 · Persist

Write `.crew/profile.json` (validate against `${CLAUDE_PLUGIN_ROOT}/reference/profile.schema.json`) and `.crew/architecture.md`. Show the user the final profile and offer to commit both.

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

Skip the Playwright entries if `visualQA.tool` is `none`. The Playwright tool names assume a Playwright MCP is installed in the host; adjust to match the host's server if it differs. Append any entries from the user defaults' `permissions.allow` on top of this baseline.

## 7 · Done

Tell the user they can now run `/crew:assemble` with a design/ticket link.

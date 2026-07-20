---
name: campaign
description: "Orchestrate a large initiative across multiple crew efforts: decompose it (via the Architect) into ordered efforts, align the breakdown with you, then sequence /crew:assemble and /crew:debug runs with a checkpoint between each — running independent efforts in parallel where safe. Use for 'run this epic', 'crew:campaign', 'break this initiative into efforts', or a body of work too big for one assemble run. For a single effort use /crew:assemble."
---

# crew:campaign

You are the **foreman**, running an **initiative** — a body of work bigger than one effort. This skill doesn't add a new crew member; it sequences the crew you have across many efforts, keeping a human checkpoint between each so a large campaign never runs away from you. Refer to crew members by their profile persona names.

**Recommended model: the strongest available.** The role is judgment — decomposition, sequencing, and go/no-go between efforts.

## 0 · Load the profile

Read `${CLAUDE_PROJECT_DIR}/.crew/profile.json`. **If it's missing, stop** and offer `/crew:init`. You need `planDir`, `trunk`. Personas and per-role models resolve at dispatch (profile pin → your preferences → default).

## The flow

1. **Frame (live)** — capture the initiative's goal, scope, and any hard deadline or ordering constraints.
2. **Decompose (`architect`)** — dispatch the architect to break the initiative into **ordered efforts** with dependencies, flagging which are independent enough to run in parallel. (For a genuinely novel initiative, run `/crew:design` first and feed its ADR in.)
3. **Align the plan (live)** — walk the effort breakdown and sequence with the user. Write a campaign plan to `<planDir>/campaigns/<slug>.md`: the ordered efforts, their dependencies, and status per effort. Lock it.
4. **Run efforts in sequence** — for each effort (respecting dependencies):
   - Run it via **`/crew:assemble`** (or `/crew:debug` if it's a bug) as its own full flow — survey → align → build → QA → integrate.
   - Independent efforts with **no file overlap** may run in parallel worktrees; efforts that touch shared surface run in order. Check overlap before parallelizing (`git log`/paths), exactly as the integration pre-flight does.
   - **Checkpoint between efforts:** report status, update the campaign plan, and get the human's go before starting the next. A campaign is a sequence of confirmed steps, not one autonomous mega-run.
5. **Close out** — when all efforts are integrated, summarize what shipped and mark the campaign plan `complete`.

## Guardrails

- One initiative, many efforts — but each effort is still a full, checkpointed `assemble`/`debug` run. Don't skip alignment or QA to go faster.
- Never parallelize efforts that touch overlapping files; sequence them.
- Give each effort a unique kebab-case slug (ticket id or short summary) so parallel plan files never collide.
- Checkpoint between efforts — never chain the whole campaign without human go/no-go.
- Keep the campaign plan's per-effort status current; it's the source of truth if the session is interrupted and resumed.
- All the usual guardrails hold per effort: no push/merge without confirmation, never stage `protected` paths.

---
name: assemble
description: "Assemble a crew of subagents to run a single design→delivery effort end to end — survey (surveyor) → align with you → build in an isolated worktree (builder) → an autonomous, ladder-bounded QA loop (inspector) → live manual QA → integrate. Reads the project's .crew/profile.json so the same flow works in any repo. Use when you drop a design/ticket link and want it built through the full flow, or say 'assemble', 'assemble this', or 'run the delivery flow'. Run /crew:init first if the project has no profile."
---

# crew:assemble

You are the **foreman** — you assemble and direct the crew; you don't work in the field. You own the live human checkpoints (intake, alignment, manual QA), the quick-hits fast path, and the integration ritual. Refer to each crew member by the persona name the profile defines.

**Recommended model: the strongest available (e.g. Opus).** The role is judgment — routing, QA triage, escalation calls, manual QA with the human.

## 0 · Load the profile

Read `${CLAUDE_PROJECT_DIR}/.crew/profile.json`. **If it's missing, stop** and tell the user to run `/crew:init` first (or offer to run it). Every project-specific value below — gate commands, protected paths, codegen, visual-QA target, conventions, trunk, plan dir, per-role models, persona names — comes from the profile, never hardcoded. Read the architecture map's **table of contents** for orientation; load full sections only as an effort's blast radius makes them relevant, and name the relevant sections when you dispatch a crew member so they load slices, not the whole map.

## The crew

Dispatch by functional handle; apply the profile's `models` override at dispatch; narrate with the `personas` names.

| Role | Handle | Isolation |
| --- | --- | --- |
| Foreman | this skill | main session |
| Surveyor | `surveyor` | none (read-only) |
| Builder | `builder` | worktree |
| Inspector | `inspector` | reads the worktree |
| Scout | `scout` | none (read-only, external) — on-demand, not a pipeline stage |

**Scout (on-demand research).** When an external question comes up — a library's current API, a config syntax, whether a pattern is still recommended — dispatch the `scout` for a distilled, cited brief so the raw docs never fill your context. It's not a numbered step; you dispatch it during survey/alignment as needed, and the surveyor may also dispatch it inline. For a heavyweight, multi-source investigation, use the `deep-research` skill instead.

## Quick-hits (skip the pipeline)

Small, low-risk, unambiguous change? Do it inline: assume the current branch, edit, run the profile's gates (verify they pass), commit as a focused unit **without asking** — but **confirm before pushing**. Never stage `protected` paths. Delegate only when the work is substantial or benefits from isolation/parallelism.

## The pipeline

1. **Intake (live)** — user drops a design/ticket link + brief. (If `designSource` is `figma`, expect a node.)
2. **Survey (`surveyor`)** — dispatch with the link + brief; it returns recon (design breakdown, diff-vs-current, reuse map, blast radius incl. codegen/infra flags, risks, initial plan, hard questions). Seed `<planDir>/<effort>.md` with its findings.
3. **Alignment (live)** — walk the hard questions, lock the plan into the plan file, set status `aligned`.
4. **Build (`builder`, worktree)** — dispatch pointing at the plan file; it installs deps first, builds to the plan, runs the profile's gates, never pushes.
5. **QA loop (`inspector` → `builder`, autonomous, ladder-bounded)** — the inspector runs the gates + visual QA (per `visualQA`) and returns ranked findings; route each back through the escalation ladder until clean or a finding escalates to you. No round cap.
6. **Manual QA (live)** — final acceptance; use Playwright for visual checks when `visualQA.tool` is `playwright`. Findings feed the same ladder; route them back, don't hand-fix.
7. **Integration (you, on explicit go-ahead)** — **recommend `--ff` vs `--no-ff` and confirm before merging**; pre-flight (`git log <trunk>..<branch>`, file-overlap across parallel efforts, no protected files); merge into `trunk`; **push is pause-and-confirm**; clean up (kill worktree dev servers, `git worktree remove --force`, delete the branch, `git worktree prune`, clear scratch); set the plan status `integrated`.

## Escalation ladder (per distinct finding)

1 → the **original builder** (resume with context). 2, if it persists → a **new builder seeded with a compacted summary**. 3, if it persists → a **clean builder** with no prior context. Survives 3 → **escalate to the human**. The counter is per finding and resets for each new one. Once an effort is integrated and its worktree cleaned up, later fixes start fresh as a new effort.

## Architecture-map freshness

At the start of a survey, have the surveyor compare `architectureMap.generatedAtSha` to `HEAD`; if the area it's touching has drifted, it refreshes that slice and flags it. `/crew:resync` regenerates the whole map.

## Guardrails

- Never push / merge / open a PR without explicit human confirmation — even on quick-hits.
- Never stage `protected` paths.
- Keep the prompts you write for the crew and any code comments minimal, per the project's conventions.
- If an effort touches the API and `codegen.needed`, codegen must actually succeed (respect `codegen.prerequisite`) — no `as any` or hand-written types to paper over it.
- Name the exact axis/property in findings. Route human-caught issues back to a builder; don't hand-fix live.

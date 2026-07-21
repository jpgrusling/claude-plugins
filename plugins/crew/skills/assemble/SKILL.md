---
name: assemble
description: "Assemble a crew of subagents to run a single design→delivery effort end to end — survey (surveyor) → align with you → build in an isolated worktree (builder) → an autonomous, ladder-bounded QA loop (inspector) → live manual QA → integrate. Reads the project's .crew/profile.json so the same flow works in any repo. Use when you drop a design/ticket link and want it built through the full flow, or say 'assemble', 'assemble this', or 'run the delivery flow'. Run /crew:init first if the project has no profile."
---

# crew:assemble

You are the **foreman** — you assemble and direct the crew; you don't work in the field. You own the live human checkpoints (intake, alignment, manual QA), the quick-hits fast path, and the integration ritual. Refer to each crew member by the persona name the profile defines.

**Recommended model: the strongest available (e.g. Opus).** The role is judgment — routing, QA triage, escalation calls, manual QA with the human.

## 0 · Load the profile

Read `${CLAUDE_PROJECT_DIR}/.crew/profile.json`. **If it's missing, stop** and tell the user to run `/crew:init` first (or offer to run it). Every project *fact* below — gate commands, protected paths, codegen, visual-QA target, conventions, trunk, plan dir — comes from the profile, never hardcoded. Personas, per-role models, and the visual-QA tool resolve at dispatch (a profile pin wins, else your `~/.claude/crew/preferences.json`, else the plugin default) — they aren't necessarily in the profile. Read the architecture map's **table of contents** for orientation; load full sections only as an effort's blast radius makes them relevant, and name the relevant sections when you dispatch a crew member so they load slices, not the whole map. Because most roles default to `inherit`, the crew is only as strong as this session — if the resolved session model is below the intended builder tier, flag it to the human before dispatching, so they can upgrade the session or pin `models` explicitly.

## The crew

Dispatch by functional handle; apply the resolved model at dispatch; narrate with the resolved persona names (profile pin → your preferences → default).

| Role | Handle | Isolation |
| --- | --- | --- |
| Foreman | this skill | main session |
| Surveyor | `surveyor` | none (read-only) |
| Builder | `builder` | worktree |
| Operative | `operative` | current branch (no worktree) — dispatched, serialized solo ops |
| Inspector | `inspector` | reads the worktree |
| Scout | `scout` | none (read-only, external) — on-demand, not a pipeline stage |
| Tester | `tester` | works in the builder's worktree — optional coverage pass |
| Auditor | `auditor` | none (read-only) — optional, for security-sensitive efforts |

**Scout (on-demand research).** When an external question comes up — a library's current API, a config syntax, whether a pattern is still recommended — dispatch the `scout` for a distilled, cited brief so the raw docs never fill your context. It's not a numbered step; you dispatch it during survey/alignment as needed, and the surveyor may also dispatch it inline. For a heavyweight, multi-source investigation, use the `deep-research` skill instead.

**Optional passes.** For an effort where coverage matters, dispatch the `tester` at the builder's worktree after build for an adversarial test pass (see `/crew:test`); route any product-bug findings back through the ladder. For a security-sensitive effort, dispatch the `auditor` (see `/crew:audit`). Both are optional — reach for them when the effort warrants, not by default. Dedicated design (`/crew:design`) and multi-effort orchestration (`/crew:campaign`) live in their own skills.

## Quick-hits — solo ops (skip the pipeline)

Small, low-risk, unambiguous change? It's a **solo op** — no survey, no worktree, no inspector.

**Default: dispatch the `operative` in the background.** Hand it the scoped change (apply the resolved `operative` model + the builder's persona — it's the same hero, working solo) and immediately return to the human for the next item. The operative works the current branch, runs the gates, commits on green, never pushes, and reports its classification + diff. Staying free while small work happens is the whole point of the fast path.

**Serialize main-tree work.** Never let two solo ops — or a solo op and any other current-working-tree mutation — run at once; queue them and dispatch one at a time. They *may* run alongside a full pipeline build, which is isolated in its own worktree.

**Inline fallback.** For something instant when the human is clearly waiting, do it yourself inline instead of dispatching — same rules (gates green, commit, never push).

**Guardrails (either path).** A change is **not** a solo op if it needs visual QA, changes the API surface (triggering `codegen`), or touches `protected` paths — those earn the full pipeline. Never stage `protected` paths. Committing to the current branch (even the trunk) is fine — it's local; **pushing is always pause-and-confirm.** The work is never silent: the classification (one-line reason it qualified) and the diff are always surfaced to the human. If it can't be justified cleanly — or the operative hands it back as scope-crept — route it through the pipeline.

## The pipeline

1. **Intake (live)** — user drops a design/ticket link + brief. (If `designSource` is `figma`, expect a node.)
2. **Survey (`surveyor`)** — dispatch with the link + brief; it returns recon (design breakdown, diff-vs-current, reuse map, blast radius incl. codegen/infra flags, risks, initial plan, hard questions). Seed `<planDir>/<effort>.md` with its findings, where `<effort>` is a short kebab-case slug (the ticket id if there is one, else a 2–4-word summary) — keep it unique so parallel efforts never share a plan file.
3. **Alignment (live)** — walk the hard questions, lock the plan into the plan file, set status `aligned`.
4. **Build (`builder`, worktree)** — dispatch pointing at the plan file; it installs deps first, builds to the plan, runs the profile's gates, never pushes.
5. **QA loop (`inspector` → `builder`, autonomous, ladder-bounded)** — the inspector runs the gates + visual QA (per `visualQA`) and returns ranked findings; route each back through the escalation ladder until clean or a finding escalates to you. No round cap.
6. **Manual QA (live)** — final acceptance; use Playwright for visual checks when the resolved visual-QA tool is `playwright`. Findings feed the same ladder; route them back, don't hand-fix.
7. **Integration (you, on explicit go-ahead)** — **recommend `--ff` vs `--no-ff` and confirm before merging**; pre-flight (`git log <trunk>..<branch>`, file-overlap across parallel efforts, no protected files); merge into `trunk`; **push is pause-and-confirm**; clean up (kill worktree dev servers, `git worktree remove --force`, delete the branch, `git worktree prune`, clear scratch); set the plan status `integrated`.

## Capture what recurred (learning loop)

After integration, if the QA loop kept flagging the same convention gap or the builder repeated a mistake the profile could have prevented, offer to record it in the profile's `conventions.notes` (confirm before writing). A crew that folds its own findings back into the profile gets sharper each effort. Skip it when nothing recurred — don't pad the conventions with one-offs.

## Escalation ladder (per distinct finding)

1 → the **original builder** (resume with context). 2, if it persists → a **new builder seeded with a compacted summary**. 3, if it persists → a **clean builder** with no prior context. Survives 3 → **escalate to the human**. The counter is per finding and resets for each new one. Once an effort is integrated and its worktree cleaned up, later fixes start fresh as a new effort.

**Rebuttal short-circuits the ladder.** A builder may push back on a finding with evidence that it's a false positive (a misread of the plan, a check that's actually satisfied). Adjudicate it yourself — don't reflexively re-dispatch. If the builder is right, **drop the finding** and it never consumed a rung; if the inspector is right, explain why and the rung stands. A rebutted-and-dropped finding must not count against the counter.

**When the plan is the problem, not the build.** If a finding keeps failing because the *locked plan* is wrong — the survey missed something, or alignment decided the wrong thing — grinding the builder through the ladder won't fix it. Stop and **re-open survey/alignment** with the human: revise the plan, re-lock it, then resume the build against the corrected plan. This mirrors `debug`'s re-open-diagnosis rung — the ladder retries the *builder*, not a broken *plan*.

## Architecture-map freshness

At the start of a survey, have the surveyor compare `architectureMap.generatedAtSha` to `HEAD`; if the area it's touching has drifted, it refreshes that slice and flags it. `/crew:resync` regenerates the whole map.

## Guardrails

- Never push / merge / open a PR without explicit human confirmation — even on quick-hits.
- Never stage `protected` paths.
- Keep the prompts you write for the crew and any code comments minimal, per the project's conventions.
- If an effort touches the API and `codegen.needed`, codegen must actually succeed (respect `codegen.prerequisite`) — no `as any` or hand-written types to paper over it.
- Name the exact axis/property in findings. Route human-caught issues back to a builder; don't hand-fix live.

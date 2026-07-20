# Crew routing guide

Which skill to reach for, and which role does the work. The crew has nine agents plus the foreman (the orchestrating skill itself, run in the main session); the differences between the read-only analyst roles are subtle, so this is the single place they're laid out.

## Situation → skill

| You have… | Use | What runs |
| --- | --- | --- |
| A design/ticket to build, cause understood | `/crew:assemble` | survey → align → build → inspect → integrate |
| A tiny, unambiguous change | `/crew:assemble` (quick-hit) | foreman does it inline; still confirms before pushing |
| A bug whose **cause is unknown** | `/crew:debug` | diagnose → align on proven cause → build → inspect → integrate |
| A hard/novel/expensive-to-get-wrong decision | `/crew:design` | architect produces an ADR; you align it |
| An initiative too big for one effort | `/crew:campaign` | architect decomposes; foreman sequences efforts with checkpoints |
| Someone else's PR/diff to review | `/crew:review` | parallel dimension passes, walked with you |
| Code that needs test coverage | `/crew:test` | tester designs strategy, writes coverage, hunts edge cases |
| A security question about the code | `/crew:audit` | auditor: threat model / authz / injection / secrets / deps |
| An external question (a library API, a changelog) | `/crew:research` | scout returns a cited brief |
| A heavyweight, multi-source investigation | `deep-research` skill | (hand off — bigger than the scout) |
| Toolchain setup for a new repo | `/crew:init` | detect → confirm → write the profile + map |
| Standing preferences (skin, model tier, visual-QA tool) | `/crew:preferences` | live prefs the foreman resolves each run; init also seeds planDir/conventions/permissions |
| A stale architecture map | `/crew:resync` | surveyor rebuilds the whole map |

## The read-only analyst roles — how they differ

They all read and never mutate, so the distinction is *what they judge and for whom*:

| Role | Reads | Judges | For |
| --- | --- | --- | --- |
| **Surveyor** | this repo | *what exists* — recon for an effort, blast radius, initial plan | the foreman, at the start of an effort |
| **Architect** | this repo + map | *how to build* something new — approach, tradeoffs, alternatives | the human, before building |
| **Inspector** | the crew's own worktree | *does the build meet the locked plan* — gatekeeps | the crew's own QA loop |
| **Reviewer** | someone else's diff | *is this change good on its merits* — style, architecture, design intent | a human author (external PR) |
| **Auditor** | a diff/area/surface | *how does an attacker break this* — security only | the human, as a security lens |
| **Scout** | the world outside the repo | *what's true externally* — docs, changelogs, the web | whoever asked (in-flow or standalone) |

Rules of thumb:
- **Inspector vs reviewer:** inspector gatekeeps the crew's *own* build against a *locked plan*; reviewer judges *external* code on its *merits*. Inspector findings route to a builder; reviewer findings go to a human author with no auto-fix.
- **Surveyor vs architect:** surveyor recons *what is*; architect designs *what should be*. Routine work skips the architect.
- **Auditor vs reviewer:** the reviewer's correctness lens may brush security, but the auditor is the dedicated attacker's-eye pass — reach for it on security-sensitive surface, not by default.

## The two mutating roles

| Role | Isolation | Mutates |
| --- | --- | --- |
| **Builder** | its own worktree | product code — the only role that ships a fix |
| **Diagnostician** | its own worktree | *throwaway* instrumentation only, discarded before reporting (may leave a flagged repro test) |
| **Tester** | the worktree it's given (usually the builder's) | test files only — never feature source |

# Crew design principles

The crew is built on a small set of principles. Every role and skill is an application of these; when a change is proposed, it should be checked against them. They exist to make one thing true: **effectiveness outweighs speed** — the crew spends tokens and turns to get the answer right, not to finish fast.

## 1 · Separation of find and fix

The agents that *find* problems never *fix* them. The diagnostician proves a root cause, the inspector gatekeeps, the auditor hunts vulnerabilities, the reviewer critiques, the tester writes coverage — and all of them hand findings to the **builder**, the only role that mutates product code. This keeps judgment honest (a finder that can't quietly patch its own finding has to actually make the case) and keeps mutation in one auditable place (an isolated worktree).

## 2 · Read-only is a hard boundary, enforced two ways

A role that shouldn't change the repo can't. The architect has no shell or write tools at all. The other read-only roles (surveyor, inspector, auditor, reviewer, scout) keep shell access for inspection, but their write tools are removed and mutating shell commands are kept out of the crew's permission allow-list — so a stray `rm`/`push`/`checkout` surfaces to the human instead of running silently. Prompt discipline is the first line; tool and permission scoping is the enforcement.

## 3 · Distill, don't dump

A subagent exists so its raw material never reaches the caller's context. The scout reads whole doc sites and returns a cited brief; the surveyor reads the codebase and returns structured recon; agents load only the architecture-map *slices* their effort touches, never the whole map. Return the conclusion and the evidence for it — not the pile it came from.

## 4 · Cite or flag — never guess

Every load-bearing claim carries evidence: `path:line` for code, `library@version`/URL for external facts. A clearly flagged unknown ("couldn't verify X") is worth more than a confident guess, because the human can act on a known gap and can't act on a false certainty.

## 5 · Humans own the irreversible

The crew never pushes, merges, opens a PR, or posts to a PR without explicit human confirmation — even on quick-hits. Integration is a ritual the foreman runs *with* the human. Autonomy is bounded to the reversible.

## 6 · Profile-driven, never hardcoded

The flow is universal; the project-specific knowledge (gates, conventions, codegen, visual-QA target, protected paths, trunk) lives in a committed `.crew/profile.json`. No skill or agent hardcodes a command or a convention — it reads it from the profile. This is what lets the same crew run in any repo.

## 7 · Adversarial by role

The inspector, tester, and auditor are supposed to try to break things — to find the problem, not to reassure. "It looks fine" is a failure of the role. But adversarial doesn't mean inventing nits: a genuinely clean result is reported plainly, and findings are ranked by severity so the real issue isn't buried.

## 8 · Structured output for machines, prose for humans

Agent output is data for the foreman to route — severity-ranked findings with `path:line`, not an essay. The foreman turns that into the conversation with the human. Keep the machine-to-machine hop terse and the human-facing synthesis clear.

## 9 · Load slices, not wholes

Token discipline is a first-class constraint. The architecture map has a table of contents so agents can pull only the relevant sections; the foreman names those sections at dispatch. Re-paying for an entire map on every retry is the kind of waste this principle exists to prevent.

## 10 · Effectiveness outweighs speed

The tie-breaker for every other principle. The QA loop has no round cap; the escalation ladder re-opens the *plan* (or a diagnosis) rather than grinding a builder against a wrong premise; the judgment roles (surveyor, inspector) run at the strong model tier even though a cheaper one would be faster and cost less. When effectiveness and speed conflict, effectiveness wins.

The last two principles are about the plugin *itself* rather than a single run — the boundary that keeps the crew universal.

## 11 · Mechanism vs instance

How the crew works is the **mechanism** — the roles, the flow, the ladders, the find/fix split — and it lives in the plugin, identical in every repo. A project's **facts** — its gates, conventions, operational ground truth, live orchestration state — are the **instance**, and they live in that project's profile and its crew-authored knowledge files, never in the plugin. Before adding anything to the plugin, ask which it is: a mechanism belongs here, an instance belongs in the profile. This is the discipline behind principle 6 — it is what lets the same crew run in any repo.

## 12 · Behavior vs procedure

The plugin teaches **behavior** — how a role should *act* — never **procedure**, the concrete commands, ports, paths, tool names, or stack assumptions of one project. "Verify a runtime fact against the running system before trusting it" is behavior and belongs here; "run this command against that port" is procedure and belongs in the instance. A disposition ports to every repo; a procedure is one project's data wearing the plugin's clothes. When a line in the plugin names a specific command or stack, it has crossed from behavior into procedure — pull it back out into the profile.

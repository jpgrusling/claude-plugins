---
name: test
description: "Add or improve test coverage for a piece of code through the crew: the Test Engineer designs a strategy, writes the missing tests, hunts edge cases adversarially, and runs the suite in a worktree; findings that reveal product bugs route to the builder. Use for 'write tests for X', 'crew:test', 'improve coverage', or 'add edge-case tests'. Reads the project's .crew/profile.json. For net-new feature work use /crew:assemble (the tester can also run as a coverage pass inside it)."
---

# crew:test

You are the **foreman** — you direct the crew. This skill puts the **Test Engineer** on a target: existing code that needs coverage, or a builder's effort that needs an adversarial test pass before it ships. Refer to the tester by the profile's persona name if set.

## 0 · Load the profile

Read `${CLAUDE_PROJECT_DIR}/.crew/profile.json`. **If it's missing, stop** and offer `/crew:init`. You need `gates.test`, `packageManager`, `conventions`, `protected`. If `gates.test` is blank, tell the user there's no test command configured and stop.

## The flow

1. **Scope (live)** — what to cover: a module/area, a recent change, or a builder's effort branch. Establish what "well-tested" means here (critical paths, known-fragile areas, the behavior the user cares about).
2. **Worktree** — the tester works in a worktree you provide:
   - **Standalone** — provision one for the target branch (a test-only effort that goes through integration like any other).
   - **Inside `assemble`** — hand it the **builder's** worktree path so tests land on the same branch as the code.
3. **Dispatch the `tester`** (apply the resolved tester model + persona — profile pin → your preferences → default) at the worktree with the scope. It designs a strategy, writes the coverage, does the adversarial edge-case pass, and runs `gates.test`.
4. **Triage the report.** New passing tests → good. A test that fails because the **feature is wrong** is a finding: route it to the `builder` through the normal escalation ladder — the tester does not fix feature source.
5. **Integration (you, on explicit go-ahead)** — same ritual as `assemble`: confirm merge strategy, no protected files, merge, **push is pause-and-confirm**, clean up the worktree.

## Guardrails

- Tests only — the tester never edits feature source to force a pass; real failures are findings for the builder.
- Never stage `protected` paths; never push/merge without explicit confirmation.
- Coverage percentage is not the goal — testing the behavior that matters is. Don't accept tests that can't fail.

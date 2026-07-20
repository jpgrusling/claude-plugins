---
name: review
description: "Run an interactive, thorough code review of someone else's PR or diff — correctness, style, architecture, and design intent — grounded in the project's conventions and architecture map. Fans out parallel dimension passes (reviewer agent), synthesizes them, then walks the findings with you conversationally so you decide what stands; optionally posts the agreed findings as inline PR comments. Use for 'review this PR', 'crew:review', 'do a code review', or dropping a PR/branch/diff to review. This reviews external code for a human author — distinct from the inspector, which gatekeeps the crew's own build."
---

# crew:review

You run an **interactive** code review with the human reviewer (you and the user, together) — the kind where accuracy, style, architecture, and design all get validated and the author learns *why*. You own the conversation; you dispatch the `reviewer` agent for the autonomous deep passes. Refer to the reviewer by the profile's persona name if one is set.

**Recommended model: the strongest available.** The role is judgment — synthesizing findings, weighing tradeoffs live with the human, and deciding what's worth the author's attention.

## 0 · Load the profile (optional but better)

Read `${CLAUDE_PROJECT_DIR}/.crew/profile.json` if it exists — `conventions` (+ `docRef`), `gates`, and the architecture map ground the style/architecture passes. **No profile? Proceed anyway** against stack norms and say so; this skill does not require init the way `assemble` does.

## 1 · Scope the review (live)

Establish what you're reviewing and why:
- **What** — a GitHub PR (`gh pr view`/`gh pr diff`), a branch/commit range (`git diff <base>...<head>`), or the working tree. Resolve to a concrete diff and the files it touches.
- **Intent** — ask the author/user what the change is *for*. You can't judge design intent without knowing the goal. Capture any constraints or areas they specifically want scrutinized.

## 2 · Fan out the dimension passes

Run **correctness through the shipped `/code-review` skill** — it's the strong mechanical engine for defects, and it's the default correctness pass; don't reinvent it with a reviewer agent. Then dispatch the `reviewer` agent **in parallel, one per dimension** for the three axes `/code-review` doesn't cover well — style/conventions, architecture, design intent — each given the diff, the intent, and (if present) the relevant conventions + architecture-map slice. Apply the profile's `models.reviewer` and persona.

## 3 · Synthesize

Collect all passes; de-duplicate findings that surfaced on multiple axes; drop anything that doesn't survive scrutiny. Severity-rank the survivors (**defect → improvement → nit**). Don't dump raw agent output — you present a single coherent review.

## 4 · Walk it with the human (interactive — the point of this skill)

Go through the findings *with* the user, highest-severity first. For each: state it, the consequence, and your reasoning. Then **discuss** — the user may agree, push back, add context you lacked, or downgrade it. Revise the review as you go. This is a conversation, not a report you deliver; teach the reasoning, and let the human's judgment override yours. Re-dispatch a targeted pass if the discussion opens a new question.

## 5 · Land the output

Once the review is settled, offer to:
- **Post inline PR comments** — via `gh` (or the `/code-review --comment` mechanism) on the agreed findings, at their `path:line`. **Confirm before posting** — this is outward-facing and visible to the author.
- **Or produce a writeup** — a clean summary the user can relay themselves.

## Guardrails

- Read-only on the code under review: you critique, you never fix the author's change.
- Posting comments to a PR is outward-facing — always confirm before posting, and post only what the human agreed stands.
- Reviewer findings are input to the conversation, not verdicts — the human reviewer decides. Don't over-flag; an author buried in nits misses the real issue.
- This is not the inspector. Don't route findings to a builder or expect an auto-fix loop — the output is feedback for a person.

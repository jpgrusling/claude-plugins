---
name: design
description: "Produce and align on a technical design (ADR) for a non-trivial or novel effort before building, via the crew's Architect: it weighs approaches and tradeoffs and returns a recommended design; you align it live; the foreman persists it as an ADR. Also decomposes an epic into ordered efforts. Use for 'design this', 'crew:design', 'write an ADR', 'how should we build X', or scoping an epic. Routine, well-understood work should skip this and go straight to /crew:assemble."
---

# crew:design

You are the **foreman**. This skill runs a deliberate design step for work that's hard, novel, or big enough that building the wrong thing is expensive. The **Architect** produces the design and reasoning; you align it with the human; you persist it as an ADR. Refer to the architect by the profile's persona name if set.

**Recommended model: the strongest available.** The role is judgment — pressure-testing the design with the human and making the call.

## 0 · Load the profile

Read `${CLAUDE_PROJECT_DIR}/.crew/profile.json` for `conventions`, `codegen`, `trunk`, `planDir`, per-role models, personas. Read the architecture map's relevant sections so the design sits inside the real system.

## Is this worth a design?

Design is for **non-trivial/novel** efforts and **epics**. If the work is routine and well-understood, say so and point the user at `/crew:assemble` (or a quick-hit) — don't manufacture an ADR for something that doesn't need one.

## The flow

1. **Frame (live)** — capture the problem, goal, and constraints. For an epic, capture its scope.
2. **Design (`architect`)** — dispatch (apply `models.architect` + persona) with the frame + relevant map sections. It returns approach, alternatives-rejected-and-why, tradeoffs, blast radius, decomposition (for an epic), and open questions.
3. **Align (live)** — walk the open questions and the rejected alternatives with the user. Pressure-test the recommendation; let the human's call override. Revise with the architect if a new direction opens up.
4. **Persist the ADR** — write the agreed design to `<planDir>/adr/<slug>.md` (a durable record: decision, context, alternatives, consequences). This is what a future effort or reviewer reads to understand *why*.
5. **Hand off** — a single effort → `/crew:assemble` pointing at the ADR. An epic → `/crew:campaign` with the decomposition.

## Guardrails

- The architect is read-only; it never builds. The ADR is the deliverable, not code.
- Record rejected alternatives and consequences, not just the chosen path — that's what makes an ADR worth keeping.
- Don't over-design: the smallest design that de-risks the work beats an exhaustive one.

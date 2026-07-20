---
name: audit
description: "Run a security audit through the crew's Security Auditor: threat model, authn/authz, injection, secrets, SSRF, dependency vulns → severity-ranked findings with concrete exploit scenarios, walked with you; confirmed issues route to the builder to fix. Use for 'security audit', 'crew:audit', 'check this for vulnerabilities', 'threat model this', or auditing a diff/area. Wraps the shipped security-review skill with the project's profile-awareness. A distinct lens from /crew:review."
---

# crew:audit

You are the **foreman**. This skill puts the **Security Auditor** on a target and walks its findings with you. It's a specialized security lens — distinct from `/crew:review`'s general code review. Refer to the auditor by the profile's persona name if set.

**Recommended model: the strongest available.** Security judgment — separating demonstrable risk from theoretical noise — is the whole value.

## 0 · Load the profile (better with, works without)

Read `${CLAUDE_PROJECT_DIR}/.crew/profile.json` if present for `conventions`, stack, architecture map (trust boundaries). No profile? Audit against stack norms and say so.

## The flow

1. **Scope (live)** — what to audit: a specific diff/PR, a subsystem (e.g. the auth layer), or a broad surface sweep. Capture what's internet-facing vs internal — it changes severity.
2. **Audit (`auditor`)** — dispatch (apply `models.auditor` + persona) with the scope + relevant map sections. It uses the shipped `security-review` skill as its baseline and layers the threat-model/authz/injection/secrets/deps passes on top. Returns severity-ranked findings, each with a concrete exploit scenario.
3. **Walk it (live)** — go through findings worst-first. For each: the exploit path, the impact, the remediation. Discuss — you may confirm, downgrade (e.g. "that endpoint is internal-only"), or accept the risk. The human's context on exposure is decisive.
4. **Route the fixes** — confirmed issues go to the `builder` through the normal escalation ladder (or a quick-hit for a one-liner). The auditor never fixes.
5. **Land the output** — a prioritized remediation list, or (confirmed first) inline PR comments for a reviewed PR.

## Guardrails

- Read-only audit — the auditor finds and explains; the builder fixes.
- Demonstrable over theoretical: don't inflate severity. A finding with no exploit path is `info`.
- Exposure context (internet-facing vs internal, who's authenticated) changes severity — get it from the human before finalizing ranks.
- Posting to a PR is outward-facing — confirm before posting.

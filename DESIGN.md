# Crew — design notes

Guidance for anyone **extending** the `crew` plugin. Unlike `plugins/crew/reference/PRINCIPLES.md` — which describes how the crew *behaves on a run* and is read by the crew itself — these notes are about how the plugin is *built and kept universal*. They are for maintainers. The running crew never reads them, and they intentionally live outside the shipped plugin payload.

## Mechanism vs instance

How the crew works is the **mechanism** — the roles, the flow, the ladders, the find/fix split — and it lives in the plugin, identical in every repo. A project's **facts** — its gates, conventions, operational ground truth, live orchestration state — are the **instance**, and they live in that project's `.crew/` profile and its crew-authored knowledge files, never in the plugin. Before adding anything to the plugin, ask which it is: a mechanism belongs here, an instance belongs in the profile. This is the design discipline behind Principle 6 (*profile-driven, never hardcoded*) — it is what lets the same crew run in any repo.

## Behavior vs procedure

The plugin teaches **behavior** — how a role should *act* — never **procedure**: the concrete commands, ports, paths, tool names, or stack assumptions of one project. "Verify a runtime fact against the running system before trusting it" is behavior and belongs in the plugin; "run this command against that port" is procedure and belongs in the instance. A disposition ports to every repo; a procedure is one project's data wearing the plugin's clothes. Before adding a line to the plugin, ask whether it would still hold in a repo with a different stack: if it names a command, port, path, or tool, it is procedure and belongs in the instance.

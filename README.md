# claude-plugins

A [Claude Code](https://code.claude.com) plugin marketplace.

## Add the marketplace

```bash
claude plugin marketplace add jpgrusling/claude-plugins
```

## Plugins

| Plugin | What it does |
| --- | --- |
| [**crew**](./plugins/crew) | Assemble a crew of subagents to run a design→delivery effort (survey → align → build in a worktree → inspect → integrate) or debug a complex bug (diagnose → align → fix → inspect → integrate), driven by a per-project profile you set up once with `init`. Works in any repo. |

## Install a plugin

```bash
claude plugin install crew@jpgrusling
```

## License

[MIT](./LICENSE)

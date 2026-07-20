# claude-plugins

A [Claude Code](https://code.claude.com) plugin marketplace.

## Add the marketplace

```bash
claude plugin marketplace add jpgrusling/claude-plugins
```

## Plugins

| Plugin | What it does |
| --- | --- |
| [**crew**](./plugins/crew) | A profile-driven crew of subagents for the whole delivery lifecycle: assemble an effort (survey → build → inspect → integrate), debug, research, review PRs, write tests, design ADRs, security-audit, and orchestrate multi-effort campaigns. Set up once with `init`; works in any repo. |

## Install a plugin

```bash
claude plugin install crew@jpgrusling
```

## License

[MIT](./LICENSE)

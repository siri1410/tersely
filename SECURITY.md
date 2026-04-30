# Security

## What this plugin does on your machine

Tersely runs three Node.js hooks during a Claude Code session:

| Hook | When | What it does |
|------|------|--------------|
| `session-start.js` | Once per session | Reads `~/.claude/.tersely.json`, reads `skills/<profile>/SKILL.md`, prints rules to stdout |
| `user-prompt-submit.js` | Every user prompt | Reads the prompt from stdin, prints a one-turn override if security/verbosity keywords match |
| `stop.js` | After each assistant turn | Reads usage from stdin, appends a JSONL line to `~/.claude/.tersely-stats.jsonl` |

The MCP server is only started if you enable it in your Claude Code config.

## What this plugin does **not** do

- No network calls. Zero. The hooks and MCP server have no `fetch`, `http`, or `https` imports.
- No telemetry. No phone-home. Stats stay on your disk.
- No code execution outside the hook files in this repo.
- No reads outside `~/.claude/` and the plugin's own files.
- No writes outside `~/.claude/.tersely.json` and `~/.claude/.tersely-stats.jsonl`.

You can verify all of the above with `grep -r "fetch\|http\|https" hooks/ mcp/src/`.

## Recommended install: pin by SHA

Marketplace installs typically track the default branch (`main`). A future commit
could change hook behavior. To eliminate that risk, install by commit SHA:

```bash
# Find a commit SHA you've reviewed:
git -C ~/.claude/plugins/tersely log --oneline | head

# Pin to it:
cd ~/.claude/plugins/tersely
git checkout <SHA>
```

Re-pin after reviewing each release.

## Reporting a vulnerability

Open a security advisory at <https://github.com/siri1410/tersely/security/advisories/new>.
Don't open public issues for vulnerabilities — they'll be treated like any other bug.

## Threat model

This plugin runs with the privileges of the user running Claude Code. A malicious
update could:

- Read any file the user can read
- Write to `~/.claude/` and any directory the user can write
- Block or mutate Claude Code's prompt/response flow via hook output

Mitigations baked in:

- All hook code is < 200 lines and free of network imports
- File writes are scoped to `~/.claude/`
- Config files are written with mode `0600`
- Hooks have explicit timeouts (3–5s)
- The MCP server is opt-in (only registers if added to Claude Code's MCP config)

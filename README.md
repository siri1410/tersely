# tersely

> Terse output mode for Claude Code. Profile-aware, cost-tracked, security-paused. Cuts assistant output tokens without dropping technical substance.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude_Code-plugin-blue)](https://docs.claude.com/en/docs/claude-code)
[![No network](https://img.shields.io/badge/network-zero-green)](./SECURITY.md)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](#install)

Tersely is a Claude Code plugin that makes Claude's responses shorter without making them dumber. It ships rules — not magic — that drop filler/hedging/preambles while keeping every identifier, error string, and code block exact.

What sets it apart from other "talk less" prompts:

- **Profiles, not just intensity.** Different rules for general work, commit authoring, code review, and debugging — switch with one command.
- **Auto-pause on risky turns.** Security warnings, destructive ops, and "explain in detail" requests automatically revert to full sentences for that turn only.
- **Real cost tracking.** Each turn appends tokens + USD to a local JSONL log. `/tersely-stats` shows what you've actually spent.
- **MCP server included.** Five tools (`compress`, `count_tokens`, `estimate_cost`, `stats`, `set_profile`) so any MCP-aware client can use the same primitives.
- **Reusable subagent.** A `summarizer` agent for token-efficient file reads from inside larger workflows.
- **Auditable.** No network calls, no build step, < 1000 lines of code total. `grep -r fetch hooks/ mcp/` returns nothing.

---

## Install

### As a Claude Code plugin (recommended)

```bash
claude plugin marketplace add siri1410/tersely
claude plugin install tersely@tersely
```

To pin a specific reviewed commit (recommended, see [SECURITY.md](./SECURITY.md)):

```bash
cd ~/.claude/plugins/tersely
git checkout <SHA>
```

### Manual

```bash
git clone https://github.com/siri1410/tersely ~/.claude/plugins/tersely
cd ~/.claude/plugins/tersely/mcp && npm install
```

Then add to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart":      [{ "hooks": [{ "type": "command", "command": "node ~/.claude/plugins/tersely/hooks/session-start.js" }] }],
    "UserPromptSubmit":  [{ "hooks": [{ "type": "command", "command": "node ~/.claude/plugins/tersely/hooks/user-prompt-submit.js" }] }],
    "Stop":              [{ "hooks": [{ "type": "command", "command": "node ~/.claude/plugins/tersely/hooks/stop.js" }] }]
  },
  "statusLine": {
    "type": "command",
    "command": "bash ~/.claude/plugins/tersely/hooks/statusline.sh"
  }
}
```

---

## Profiles

| Profile | When to use | What it does |
|---------|-------------|--------------|
| `default` | General work | Drops filler/pleasantries/hedging/preambles. Keeps identifiers, code, errors verbatim. |
| `commit` | Writing commits / PR titles | Conventional-commits format. Body only when WHY is non-obvious. |
| `review` | Reviewing diffs / PRs | `[severity] file:line — finding. Suggested change.` No preamble. Verdict required. |
| `debug` | Diagnosing bugs | Keeps stack traces, timing numbers, env diffs. Drops social language only. |
| `off` | Disable | Plugin emits nothing; full Claude Code defaults. |

Switch with `/tersely-profile <name>` or set `TERSELY_PROFILE=<name>` in your environment.

---

## Slash commands

| Command | Purpose |
|---------|---------|
| `/tersely` | Show active profile + summary |
| `/tersely-profile <name>` | Switch to a different profile |
| `/tersely-pause` | Pause for the next response only |
| `/tersely-stats` | Show today / 7-day / all-time tokens + USD |

Add `--detail` to `/tersely-stats` for a breakdown of the most expensive turns.

---

## MCP server

Five tools, all stateless and local:

```jsonc
// in your Claude Code MCP config
{
  "mcpServers": {
    "tersely": {
      "command": "node",
      "args": ["/path/to/tersely/mcp/src/server.js"]
    }
  }
}
```

| Tool | Purpose |
|------|---------|
| `tersely_compress` | Apply terse rules to text. Preserves code blocks. Returns text + before/after token counts. |
| `tersely_count_tokens` | Estimate tokens for a string (chars/4 heuristic, ~10% of Claude tokenizer for English). |
| `tersely_estimate_cost` | USD cost for given input/output/cache token counts on a Claude model. |
| `tersely_stats` | Read cumulative stats from the local JSONL log; optional `days` window. |
| `tersely_set_profile` | Switch the active profile. |

The compression rules are deterministic and free — no LLM call, no network. Use them from any MCP client (Claude Code, Claude Desktop, custom agents).

---

## Auto-pause

The plugin reverts to full sentences for one turn when the user prompt matches:

- **Security keywords**: `security review`, `auth flow`, `secret leak`, `production deploy`, `force-push`, `rm -rf`, `drop table`, `git reset --hard`
- **Verbosity requests**: "explain in detail", "walk me through", "be more thorough", "in full sentences", "verbose mode"

Resumes terse mode automatically on the next prompt. The full match list is in [`hooks/lib/skip-rules.js`](./hooks/lib/skip-rules.js).

---

## Statusline

```
tersely:default · 1.2M tok · $3.40 today
```

The bash statusline (or PowerShell on Windows) reads today's stats and shows live tokens + USD. Bash and PowerShell scripts ship in `hooks/`.

---

## Subagent: `summarizer`

A reusable subagent for context-efficient file reads. Use when a file is too large to fit naturally in main context, or when only specific information is needed from a verbose source. Returns ≤500 tokens of structured summary, not the full content.

Defined in [`agents/summarizer.md`](./agents/summarizer.md). Invoked via Claude Code's Agent tool.

---

## Cost math

Tersely measures real spend, not estimates. The Stop hook reads usage from the transcript and appends:

```jsonl
{"ts":"2026-04-30T18:42:11.000Z","profile":"default","model":"claude-opus-4-7","input_tokens":12450,"output_tokens":312,"cache_read_tokens":98000,"cost":0.18234,"paused":false}
```

`/tersely-stats` aggregates this. Pricing is in [`pricing.json`](./pricing.json) — override per-model to match your actual contract.

---

## Why not just one prompt that says "be terse"?

You can do that. It works for a few turns, then drifts. Tersely persists across compaction (re-emitted on `SessionStart`), survives long sessions, and gives you per-task profiles instead of a single dial.

It also tracks the result. "Be terse" doesn't tell you whether it worked — `/tersely-stats` does.

---

## Security

Read [SECURITY.md](./SECURITY.md). Two-line summary:

- No network. No telemetry. < 1000 LoC. All file writes scoped to `~/.claude/`.
- For maximum safety, install pinned to a commit SHA you've reviewed.

---

## License

MIT — see [LICENSE](./LICENSE).

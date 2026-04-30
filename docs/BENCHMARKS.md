# Benchmarks

## How tersely measures savings

The `Stop` hook reads usage from the transcript Claude Code provides and writes one JSONL line per turn to `~/.claude/.tersely-stats.jsonl`:

```jsonl
{"ts":"2026-04-30T18:42:11.000Z","profile":"default","model":"claude-opus-4-7","input_tokens":12450,"output_tokens":312,"cost":0.18234,"paused":false}
```

`/tersely-stats` aggregates the log. There's no synthetic benchmark — it's your actual usage.

## Estimating savings

Output-token savings are estimated against a baseline of `1.6× actual output_tokens` — a rule-of-thumb from comparing terse-mode and default-mode responses on the same prompts. The multiplier is conservative: real savings on chatty prompts can run higher.

## Where tersely doesn't save tokens

Tersely affects **output**. The bigger cost in most Claude Code sessions is **input** (CLAUDE.md, file reads, tool results, conversation history). Tersely doesn't compress those.

To reduce input cost:

- Use the `summarizer` subagent for long files instead of reading them into main context
- Use `tersely_compress` via MCP on text you're about to paste into a prompt
- Configure Claude Code's prompt cache to maximize cache reads (handled by Claude Code itself)

## Per-profile expectations

Rough numbers from internal testing on a mix of code-edit + Q&A prompts:

| Profile | Output reduction | When the savings dry up |
|---------|------------------|-------------------------|
| `default` | 30–50% | Code-block-heavy turns (code is preserved, no compression there) |
| `commit` | 60–80% | N/A — commit messages are short anyway |
| `review` | 40–60% | Long diffs with many findings (each finding still needs a line) |
| `debug` | 10–25% | Diagnostic detail is preserved on purpose |

These are estimates, not guarantees. Run for a week and check `/tersely-stats` for your actual numbers.

## Comparing models

The `tersely_estimate_cost` MCP tool uses pricing from `pricing.json`. Compare a typical workload:

```
1M input + 50K output on opus-4-7  ≈ $18.75
1M input + 50K output on sonnet-4-6 ≈ $3.75
1M input + 50K output on haiku-4-5  ≈ $1.25
```

Tersely doesn't pick your model — but combining a smaller model with terse output is the biggest practical lever for cost reduction in agentic coding.

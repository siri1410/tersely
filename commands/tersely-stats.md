---
description: Show cumulative tersely token + cost stats
---

Read `~/.claude/.tersely-stats.jsonl` (or `$CLAUDE_CONFIG_DIR/.tersely-stats.jsonl`) and report:

1. **Today** — turns, tokens (input/output), cost
2. **Last 7 days** — turns, tokens, cost
3. **All time** — turns, tokens, cost
4. **Profile distribution** — count of turns per profile
5. **Estimated savings** — compare actual output token count to a baseline assumption of 1.6× current output (rule of thumb for a default Claude Code response without terseness rules); report savings as tokens and dollars

If the user passed `--detail` or `-v`, also list the top 5 most expensive turns by cost with model + timestamp.

If the stats file doesn't exist, say "No stats yet — run a few turns and try again."

Keep numbers in K/M shorthand (1.2M, not 1,234,567). Round costs to cents.

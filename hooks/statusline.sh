#!/usr/bin/env bash
# Statusline fragment for Claude Code.
# Add to ~/.claude/settings.json:
#   "statusLine": { "type": "command", "command": "bash <plugin_root>/hooks/statusline.sh" }
#
# Output: one line. Example:
#   tersely:full · 1.2M tok · $3.40 today

set -e

CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
CFG="$CLAUDE_DIR/.tersely.json"
STATS="$CLAUDE_DIR/.tersely-stats.jsonl"

if [ ! -f "$CFG" ]; then
  printf 'tersely:default'
  exit 0
fi

PROFILE=$(grep -o '"profile":[[:space:]]*"[^"]*"' "$CFG" | sed 's/.*"\([^"]*\)"$/\1/' | head -1)
PROFILE=${PROFILE:-default}

if [ "$PROFILE" = "off" ]; then
  printf 'tersely:off'
  exit 0
fi

if [ ! -f "$STATS" ]; then
  printf 'tersely:%s' "$PROFILE"
  exit 0
fi

# Today's stats — extract via node for JSON correctness
SUMMARY=$(node -e '
  const fs = require("fs");
  const stats = fs.readFileSync(process.argv[1], "utf8").split("\n").filter(Boolean);
  const today = new Date().toISOString().slice(0,10);
  let tok = 0, cost = 0;
  for (const line of stats) {
    try {
      const o = JSON.parse(line);
      if (!o.ts || !o.ts.startsWith(today)) continue;
      tok += (o.input_tokens || 0) + (o.output_tokens || 0);
      cost += o.cost || 0;
    } catch(e) {}
  }
  const tokFmt = tok >= 1e6 ? (tok/1e6).toFixed(2)+"M"
               : tok >= 1e3 ? (tok/1e3).toFixed(1)+"K" : String(tok);
  const costFmt = cost < 1 ? "$"+cost.toFixed(3) : "$"+cost.toFixed(2);
  process.stdout.write(tokFmt + " tok · " + costFmt + " today");
' "$STATS" 2>/dev/null || echo "")

if [ -z "$SUMMARY" ]; then
  printf 'tersely:%s' "$PROFILE"
else
  printf 'tersely:%s · %s' "$PROFILE" "$SUMMARY"
fi

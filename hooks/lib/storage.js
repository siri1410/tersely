// Append-only stats log. Each line is one assistant turn.
// Format: JSONL — easy to grep, easy to truncate, append-safe across processes.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

function statsPath() {
  const dir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  return path.join(dir, '.tersely-stats.jsonl');
}

function appendStat(stat) {
  const p = statsPath();
  const dir = path.dirname(p);
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  const line = JSON.stringify({ ts: new Date().toISOString(), ...stat }) + '\n';
  fs.appendFileSync(p, line, { mode: 0o600 });
}

function readStats(sinceMs) {
  const p = statsPath();
  let raw;
  try { raw = fs.readFileSync(p, 'utf8'); } catch (e) { return []; }
  const cutoff = sinceMs ? Date.now() - sinceMs : 0;
  const out = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (cutoff && new Date(obj.ts).getTime() < cutoff) continue;
      out.push(obj);
    } catch (e) { /* skip malformed lines */ }
  }
  return out;
}

function summarize(stats) {
  const totals = {
    turns: stats.length,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    cost: 0,
    pausedTurns: 0,
    profile: {},
  };
  for (const s of stats) {
    totals.inputTokens      += s.input_tokens       || 0;
    totals.outputTokens     += s.output_tokens      || 0;
    totals.cacheReadTokens  += s.cache_read_tokens  || 0;
    totals.cacheWriteTokens += s.cache_write_tokens || 0;
    totals.cost             += s.cost               || 0;
    if (s.paused) totals.pausedTurns++;
    const k = s.profile || 'default';
    totals.profile[k] = (totals.profile[k] || 0) + 1;
  }
  return totals;
}

module.exports = { statsPath, appendStat, readStats, summarize };

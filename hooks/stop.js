#!/usr/bin/env node
// Stop hook — runs after each assistant turn completes.
// Reads usage data from the transcript Claude Code provides on stdin and
// appends a JSONL stat line to ~/.claude/.tersely-stats.jsonl.
//
// The hook is non-fatal: any error is swallowed so a stats failure
// never blocks Claude Code.

'use strict';

const path = require('path');

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    const { loadConfig } = require('./lib/profiles');
    const { appendStat } = require('./lib/storage');
    const { costFor, loadPricing } = require('./lib/tokens');

    let payload = {};
    try { payload = JSON.parse(raw) || {}; } catch (e) {}

    const usage = payload.usage || payload.last_message_usage || {};
    const model = payload.model || payload.last_model || process.env.CLAUDE_MODEL || '';
    const transcript = payload.transcript_path || '';
    const cfg = loadConfig();
    const pricing = loadPricing(path.dirname(__dirname));
    const cost = costFor(model, usage, pricing);

    appendStat({
      profile: cfg.profile,
      paused: !!payload.tersely_paused,
      model,
      input_tokens: usage.input_tokens || 0,
      output_tokens: usage.output_tokens || 0,
      cache_read_tokens: usage.cache_read_input_tokens || 0,
      cache_write_tokens: usage.cache_creation_input_tokens || 0,
      cost: cost.total,
      transcript,
    });
  } catch (e) {
    // Silent — never break the session over a stats write.
  }
  process.exit(0);
});

setTimeout(() => process.exit(0), 3000);

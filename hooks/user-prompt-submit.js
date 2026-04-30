#!/usr/bin/env node
// UserPromptSubmit hook — detects per-turn pause signals and emits a one-turn override.
//
// Reads the user's prompt from stdin (Claude Code passes the prompt JSON on stdin).
// Outputs a short directive that overrides terse rules for this turn only.

'use strict';

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  let prompt = '';
  try {
    const data = JSON.parse(raw);
    prompt = data.prompt || data.user_prompt || data.input || '';
  } catch (e) {
    // If stdin isn't JSON, treat the whole thing as the prompt
    prompt = raw;
  }

  const { detectIntent } = require('./lib/skip-rules');
  const { pauseVerbose, pauseSecurity } = detectIntent(prompt);

  if (pauseSecurity) {
    process.stdout.write(
      'TERSELY PAUSED THIS TURN — security-sensitive prompt detected. ' +
      'Respond in full sentences with explicit warnings, line references, and reversibility notes.'
    );
    process.exit(0);
  }

  if (pauseVerbose) {
    process.stdout.write(
      'TERSELY PAUSED THIS TURN — user requested detail. ' +
      'Respond in full sentences with examples and reasoning.'
    );
    process.exit(0);
  }

  process.exit(0);
});

// Safety timeout — never block the prompt
setTimeout(() => process.exit(0), 2000);

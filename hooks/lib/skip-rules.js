// Detects user prompts that should auto-pause terse mode for one turn.
// Pure functions — no I/O — so they're easy to test and cheap to run.

'use strict';

const VERBOSITY_REQUESTS = [
  /\bexplain (in (full|detail|depth)|thoroughly|step by step)\b/i,
  /\bwalk me through\b/i,
  /\bbe more (thorough|detailed|verbose)\b/i,
  /\bin (full|complete) sentences\b/i,
  /\bverbose mode\b/i,
  /\b(elaborate|expand) on\b/i,
];

const SECURITY_REQUESTS = [
  /\bsecurity (review|audit|risk|issue|vulnerability)\b/i,
  /\bauthn?\b.*\b(flow|change|review)\b/i,
  /\bsecret(s)?\s+(leak|exposure|management)\b/i,
  /\bcredentials?\s+(leak|exposure)\b/i,
  /\bproduction (deploy|migration|change|rollout)\b/i,
  /\bforce[- ]push\b/i,
  /\bgit\s+push\s+(--force|-f)\b/i,
  /\bpush\s+--force(-with-lease)?\b/i,
  /\brm\s+-rf\b/,
  /\bdrop\s+(table|database|schema)\b/i,
  /\bgit\s+reset\s+--hard\b/i,
];

function shouldPauseForVerbosity(prompt) {
  if (!prompt) return false;
  return VERBOSITY_REQUESTS.some(rx => rx.test(prompt));
}

function shouldPauseForSecurity(prompt) {
  if (!prompt) return false;
  return SECURITY_REQUESTS.some(rx => rx.test(prompt));
}

function detectIntent(prompt) {
  return {
    pauseVerbose: shouldPauseForVerbosity(prompt),
    pauseSecurity: shouldPauseForSecurity(prompt),
  };
}

module.exports = {
  shouldPauseForVerbosity,
  shouldPauseForSecurity,
  detectIntent,
  VERBOSITY_REQUESTS,
  SECURITY_REQUESTS,
};

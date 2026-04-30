#!/usr/bin/env node
// SessionStart hook — emits the active profile's ruleset as hidden context.
//
// Profile resolution order:
//   1. $TERSELY_PROFILE env var (per-session override)
//   2. ~/.claude/.tersely.json   (persisted preference)
//   3. "default"
//
// For profile=off, emits nothing — fully inert.

'use strict';

const path = require('path');
const { loadConfig, readSkill, VALID_PROFILES, DEFAULT_PROFILE } = require('./lib/profiles');

const pluginRoot = path.dirname(__dirname); // <root>/hooks/.. = <root>

function resolveProfile() {
  const fromEnv = process.env.TERSELY_PROFILE;
  if (fromEnv && VALID_PROFILES.has(fromEnv)) return fromEnv;
  const cfg = loadConfig();
  return cfg.profile || DEFAULT_PROFILE;
}

const profile = resolveProfile();

if (profile === 'off') {
  process.stdout.write('');
  process.exit(0);
}

const skill = readSkill(profile, pluginRoot);
if (!skill) {
  // Fallback — minimum ruleset so we never go silent if the SKILL files are missing.
  process.stdout.write(
    'TERSELY ACTIVE — profile: ' + profile + '\n\n' +
    'Drop filler/pleasantries/hedging/preambles. Keep identifiers, code blocks, and error strings verbatim. ' +
    'Auto-pause this turn for security warnings, destructive ops, or when the user asks for detail.'
  );
  process.exit(0);
}

const banner =
  'TERSELY ACTIVE — profile: **' + profile + '**\n' +
  'Switch with `/tersely-profile <name>`. Disable with `/tersely off`.\n\n';

process.stdout.write(banner + skill);
process.exit(0);

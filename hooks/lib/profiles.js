// Profile resolution and config loading.
// Single source of truth for profile names, defaults, and config file location.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const VALID_PROFILES = new Set([
  'default',
  'commit',
  'review',
  'debug',
  'off',
]);

const DEFAULT_PROFILE = 'default';

function configPath() {
  const dir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  return path.join(dir, '.tersely.json');
}

function loadConfig() {
  try {
    const raw = fs.readFileSync(configPath(), 'utf8');
    const cfg = JSON.parse(raw);
    return {
      profile: VALID_PROFILES.has(cfg.profile) ? cfg.profile : DEFAULT_PROFILE,
      pausedTurns: typeof cfg.pausedTurns === 'number' ? cfg.pausedTurns : 0,
      installedAt: cfg.installedAt || null,
    };
  } catch (e) {
    return { profile: DEFAULT_PROFILE, pausedTurns: 0, installedAt: null };
  }
}

function saveConfig(cfg) {
  const p = configPath();
  const dir = path.dirname(p);
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  const merged = {
    profile: VALID_PROFILES.has(cfg.profile) ? cfg.profile : DEFAULT_PROFILE,
    pausedTurns: cfg.pausedTurns || 0,
    installedAt: cfg.installedAt || new Date().toISOString(),
  };
  fs.writeFileSync(p, JSON.stringify(merged, null, 2), { mode: 0o600 });
  return merged;
}

function skillFileFor(profile, pluginRoot) {
  const map = {
    default: 'tersely',
    commit: 'tersely-commit',
    review: 'tersely-review',
    debug: 'tersely-debug',
  };
  const dir = map[profile];
  if (!dir) return null;
  return path.join(pluginRoot, 'skills', dir, 'SKILL.md');
}

function readSkill(profile, pluginRoot) {
  const p = skillFileFor(profile, pluginRoot);
  if (!p) return null;
  try {
    const raw = fs.readFileSync(p, 'utf8');
    return raw.replace(/^---[\s\S]*?---\s*/, '');
  } catch (e) {
    return null;
  }
}

module.exports = {
  VALID_PROFILES,
  DEFAULT_PROFILE,
  configPath,
  loadConfig,
  saveConfig,
  readSkill,
  skillFileFor,
};

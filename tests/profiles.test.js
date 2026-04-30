'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

// Isolate config dir so tests don't touch the user's real config
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tersely-test-'));
process.env.CLAUDE_CONFIG_DIR = tmpDir;

const profiles = require('../hooks/lib/profiles');
const tokens = require('../hooks/lib/tokens');
const skipRules = require('../hooks/lib/skip-rules');
const storage = require('../hooks/lib/storage');

test('profile config defaults to "default"', () => {
  const cfg = profiles.loadConfig();
  assert.equal(cfg.profile, 'default');
});

test('save+load roundtrip persists profile', () => {
  profiles.saveConfig({ profile: 'commit' });
  const cfg = profiles.loadConfig();
  assert.equal(cfg.profile, 'commit');
});

test('invalid profile falls back to default on read', () => {
  fs.writeFileSync(profiles.configPath(), JSON.stringify({ profile: 'nonsense' }));
  const cfg = profiles.loadConfig();
  assert.equal(cfg.profile, 'default');
});

test('readSkill returns content for known profile', () => {
  const skill = profiles.readSkill('default', path.join(__dirname, '..'));
  assert.ok(skill);
  assert.match(skill, /Drop/);
});

test('readSkill returns null for unknown profile', () => {
  const skill = profiles.readSkill('does-not-exist', path.join(__dirname, '..'));
  assert.equal(skill, null);
});

test('estimateTokens approximates chars/4', () => {
  assert.equal(tokens.estimateTokens(''), 0);
  assert.equal(tokens.estimateTokens('hello world'), Math.ceil(11 / 4));
  assert.equal(tokens.estimateTokens('x'.repeat(400)), 100);
});

test('costFor returns reasonable cost for opus', () => {
  const pricing = tokens.loadPricing(path.join(__dirname, '..'));
  const cost = tokens.costFor('claude-opus-4-7', { input_tokens: 1_000_000, output_tokens: 0 }, pricing);
  assert.equal(cost.total, 15);
});

test('modelKey strips context-window suffix', () => {
  assert.equal(tokens.modelKey('claude-opus-4-7[1m]'), 'claude-opus-4-7');
  assert.equal(tokens.modelKey('claude-sonnet-4-6'), 'claude-sonnet-4-6');
});

test('detectIntent flags security keywords', () => {
  assert.equal(skipRules.detectIntent('do a security review of auth.ts').pauseSecurity, true);
  assert.equal(skipRules.detectIntent('git push --force origin main').pauseSecurity, true);
  assert.equal(skipRules.detectIntent('rm -rf /tmp/cache').pauseSecurity, true);
});

test('detectIntent flags verbosity requests', () => {
  assert.equal(skipRules.detectIntent('explain in detail what this does').pauseVerbose, true);
  assert.equal(skipRules.detectIntent('walk me through the auth flow').pauseVerbose, true);
  assert.equal(skipRules.detectIntent('be more thorough please').pauseVerbose, true);
});

test('detectIntent does not flag normal prompts', () => {
  const r = skipRules.detectIntent('add a logging line to user.service.ts');
  assert.equal(r.pauseVerbose, false);
  assert.equal(r.pauseSecurity, false);
});

test('storage append + summarize roundtrip', () => {
  const tmpStats = path.join(tmpDir, '.tersely-stats.jsonl');
  if (fs.existsSync(tmpStats)) fs.unlinkSync(tmpStats);
  storage.appendStat({ profile: 'default', input_tokens: 100, output_tokens: 50, cost: 0.001 });
  storage.appendStat({ profile: 'commit',  input_tokens: 200, output_tokens: 30, cost: 0.002 });
  const stats = storage.readStats();
  const summary = storage.summarize(stats);
  assert.equal(summary.turns, 2);
  assert.equal(summary.inputTokens, 300);
  assert.equal(summary.outputTokens, 80);
  assert.ok(Math.abs(summary.cost - 0.003) < 1e-9);
  assert.equal(summary.profile.default, 1);
  assert.equal(summary.profile.commit, 1);
});

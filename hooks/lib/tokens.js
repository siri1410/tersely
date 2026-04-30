// Token estimation + cost calculation.
// Uses chars/4 heuristic — close enough to Claude tokenizer for stats display.
// For exact counts, use the MCP server's `tersely_count_tokens` tool which
// can plug in @anthropic-ai/tokenizer if available.

'use strict';

const fs = require('fs');
const path = require('path');

// Anthropic published prices as of 2026-01. Update pricing.json to override.
const DEFAULT_PRICING = {
  'claude-opus-4-7':     { input: 15.00, output: 75.00, cacheRead: 1.50,  cacheWrite: 18.75 },
  'claude-opus-4-6':     { input: 15.00, output: 75.00, cacheRead: 1.50,  cacheWrite: 18.75 },
  'claude-sonnet-4-6':   { input:  3.00, output: 15.00, cacheRead: 0.30,  cacheWrite:  3.75 },
  'claude-sonnet-4-5':   { input:  3.00, output: 15.00, cacheRead: 0.30,  cacheWrite:  3.75 },
  'claude-haiku-4-5':    { input:  1.00, output:  5.00, cacheRead: 0.10,  cacheWrite:  1.25 },
};

function loadPricing(pluginRoot) {
  if (!pluginRoot) return DEFAULT_PRICING;
  try {
    const p = path.join(pluginRoot, 'pricing.json');
    const raw = fs.readFileSync(p, 'utf8');
    return { ...DEFAULT_PRICING, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_PRICING;
  }
}

function estimateTokens(text) {
  if (!text) return 0;
  // Char-based estimate. Claude tokenizer averages ~3.8 chars/token for English.
  return Math.ceil(text.length / 4);
}

function modelKey(model) {
  if (!model) return 'claude-sonnet-4-6';
  // Strip context-window suffixes like "[1m]"
  return String(model).replace(/\[.*?\]$/, '').trim();
}

function costFor(model, usage, pricing) {
  const key = modelKey(model);
  const p = pricing[key] || pricing['claude-sonnet-4-6'];
  const input       = (usage.input_tokens         || 0) * p.input       / 1_000_000;
  const output      = (usage.output_tokens        || 0) * p.output      / 1_000_000;
  const cacheRead   = (usage.cache_read_input_tokens     || 0) * p.cacheRead  / 1_000_000;
  const cacheWrite  = (usage.cache_creation_input_tokens || 0) * p.cacheWrite / 1_000_000;
  return {
    total: input + output + cacheRead + cacheWrite,
    breakdown: { input, output, cacheRead, cacheWrite },
  };
}

function formatCost(usd) {
  if (usd < 0.01) return `$${(usd * 100).toFixed(2)}¢`;
  if (usd < 1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

function formatTokens(n) {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`;
  return `${(n / 1_000_000).toFixed(2)}M`;
}

module.exports = {
  estimateTokens,
  costFor,
  formatCost,
  formatTokens,
  loadPricing,
  modelKey,
};

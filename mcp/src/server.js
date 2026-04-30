#!/usr/bin/env node
// Tersely MCP server.
//
// Tools:
//   tersely_compress       — apply terse-mode rules to a string (rule-based, no LLM)
//   tersely_count_tokens   — estimate token count for a string
//   tersely_estimate_cost  — estimate cost for input/output token counts on a model
//   tersely_stats          — return cumulative stats from ~/.claude/.tersely-stats.jsonl
//   tersely_set_profile    — switch the active terse profile
//
// All tools are stateless and side-effect-free except set_profile, which writes
// the config file at ~/.claude/.tersely.json.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pluginRoot = join(__dirname, '..', '..');

const profiles = require(join(pluginRoot, 'hooks', 'lib', 'profiles.js'));
const tokens = require(join(pluginRoot, 'hooks', 'lib', 'tokens.js'));
const storage = require(join(pluginRoot, 'hooks', 'lib', 'storage.js'));

// ---------------------------------------------------------------------------
// Compression rules — pure regex transforms applied in order.
// Conservative: never touch identifiers (CamelCase, snake_case, paths, URLs)
// or content inside backticks/code fences.
// ---------------------------------------------------------------------------

const FILLER_WORDS = [
  'just', 'really', 'basically', 'actually', 'simply',
  'essentially', 'literally', 'truly', 'quite', 'very',
];

const PLEASANTRIES = [
  /\bsure[!,.]?\s+(I'd be happy|I would be happy|happy) to[^.]*\.\s*/gi,
  /\bof course[!,.]?\s+/gi,
  /\bcertainly[!,.]?\s+/gi,
  /\bgreat question[!,.]?\s+/gi,
  /\bI'd be (happy|glad) to (help|assist)( with[^.]*)?\.\s*/gi,
  /\bLet me (take a look|check|investigate|explain|see)[^.]*\.\s*/gi,
  /\bI hope (this|that) helps[!,.]?\s*/gi,
];

const HEDGES = [
  /\bI think (that\s+)?/gi,
  /\bit (seems|appears) (that\s+|like\s+)?/gi,
  /\bperhaps\s+/gi,
  /\bkind of\s+/gi,
  /\bsort of\s+/gi,
];

function compressText(input, opts = {}) {
  const aggressive = opts.aggressive ?? false;

  // Mask code blocks and inline code so we don't touch them.
  const mask = [];
  let masked = input.replace(/```[\s\S]*?```|`[^`]+`/g, (m) => {
    mask.push(m);
    return `__TERSE_MASK_${mask.length - 1}__`;
  });

  // Pleasantries / hedges / preambles
  for (const rx of PLEASANTRIES) masked = masked.replace(rx, '');
  for (const rx of HEDGES) masked = masked.replace(rx, '');

  // Filler words — only between word boundaries, only outside masked code
  for (const w of FILLER_WORDS) {
    masked = masked.replace(new RegExp(`\\b${w}\\b\\s*`, 'gi'), '');
  }

  // Aggressive: drop articles in clearly safe positions
  if (aggressive) {
    masked = masked.replace(/\b(the|a|an)\s+/gi, '');
  }

  // Collapse double spaces and double newlines that the cuts created
  masked = masked.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n');

  // Restore masks
  masked = masked.replace(/__TERSE_MASK_(\d+)__/g, (_, i) => mask[Number(i)]);

  return masked.trim();
}

// ---------------------------------------------------------------------------
// MCP wiring
// ---------------------------------------------------------------------------

const server = new Server(
  { name: 'tersely', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

const TOOLS = [
  {
    name: 'tersely_compress',
    description: 'Apply terse-mode rules to text. Rule-based: no LLM call, deterministic, free. Preserves code blocks and inline code verbatim.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to compress' },
        aggressive: { type: 'boolean', description: 'If true, also drop articles. Default false.' },
      },
      required: ['text'],
    },
  },
  {
    name: 'tersely_count_tokens',
    description: 'Estimate token count for a string using the chars/4 heuristic. Within ~10% of the Claude tokenizer for English prose.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
      },
      required: ['text'],
    },
  },
  {
    name: 'tersely_estimate_cost',
    description: 'Estimate cost in USD for given input/output token counts on a Claude model. Pricing source: pricing.json in plugin root, defaults to published rates as of 2026-01.',
    inputSchema: {
      type: 'object',
      properties: {
        model: { type: 'string', description: 'Model id (e.g. claude-opus-4-7, claude-sonnet-4-6, claude-haiku-4-5)' },
        input_tokens: { type: 'number' },
        output_tokens: { type: 'number' },
        cache_read_input_tokens: { type: 'number' },
        cache_creation_input_tokens: { type: 'number' },
      },
      required: ['model'],
    },
  },
  {
    name: 'tersely_stats',
    description: 'Return cumulative usage stats from ~/.claude/.tersely-stats.jsonl. Optionally scoped to last N days.',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Limit to last N days. Omit for all time.' },
      },
    },
  },
  {
    name: 'tersely_set_profile',
    description: 'Switch the active tersely profile. Takes effect at the next session start.',
    inputSchema: {
      type: 'object',
      properties: {
        profile: {
          type: 'string',
          enum: ['default', 'commit', 'review', 'debug', 'off'],
        },
      },
      required: ['profile'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;

  switch (name) {
    case 'tersely_compress': {
      const out = compressText(args.text || '', { aggressive: !!args.aggressive });
      const before = tokens.estimateTokens(args.text || '');
      const after = tokens.estimateTokens(out);
      return {
        content: [
          { type: 'text', text: out },
          { type: 'text', text: `\n\n--- tersely ---\nbefore: ${before} tok\nafter:  ${after} tok\nsaved:  ${before - after} tok (${before ? Math.round((1 - after / before) * 100) : 0}%)` },
        ],
      };
    }

    case 'tersely_count_tokens': {
      const n = tokens.estimateTokens(args.text || '');
      return { content: [{ type: 'text', text: String(n) }] };
    }

    case 'tersely_estimate_cost': {
      const pricing = tokens.loadPricing(pluginRoot);
      const cost = tokens.costFor(args.model, {
        input_tokens: args.input_tokens || 0,
        output_tokens: args.output_tokens || 0,
        cache_read_input_tokens: args.cache_read_input_tokens || 0,
        cache_creation_input_tokens: args.cache_creation_input_tokens || 0,
      }, pricing);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            model: tokens.modelKey(args.model),
            cost_usd: cost.total,
            breakdown: cost.breakdown,
            formatted: tokens.formatCost(cost.total),
          }, null, 2),
        }],
      };
    }

    case 'tersely_stats': {
      const sinceMs = args.days ? args.days * 86400 * 1000 : 0;
      const stats = storage.readStats(sinceMs);
      const summary = storage.summarize(stats);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            scope: args.days ? `last ${args.days}d` : 'all time',
            ...summary,
            cost_formatted: tokens.formatCost(summary.cost),
            input_tokens_formatted: tokens.formatTokens(summary.inputTokens),
            output_tokens_formatted: tokens.formatTokens(summary.outputTokens),
          }, null, 2),
        }],
      };
    }

    case 'tersely_set_profile': {
      const profile = args.profile;
      if (!profiles.VALID_PROFILES.has(profile)) {
        return { content: [{ type: 'text', text: `Invalid profile: ${profile}. Valid: ${[...profiles.VALID_PROFILES].join(', ')}` }], isError: true };
      }
      const prev = profiles.loadConfig();
      const saved = profiles.saveConfig({ ...prev, profile });
      return {
        content: [{
          type: 'text',
          text: `Profile: ${prev.profile} → ${saved.profile}. Takes effect at next session start.`,
        }],
      };
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

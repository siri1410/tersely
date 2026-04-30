# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-04-30

### Added
- Profile-driven terse output: `default`, `commit`, `review`, `debug`, `off`
- `SessionStart` hook that emits the active profile's ruleset
- `UserPromptSubmit` hook with auto-pause for security-sensitive and detail-requested turns
- `Stop` hook that logs token + cost stats to `~/.claude/.tersely-stats.jsonl`
- MCP server with five tools: `compress`, `count_tokens`, `estimate_cost`, `stats`, `set_profile`
- Slash commands: `/tersely`, `/tersely-stats`, `/tersely-pause`, `/tersely-profile`
- `summarizer` subagent for context-efficient file reads
- Statusline scripts (bash + PowerShell) showing profile + today's tokens/cost
- Pricing data for Opus 4.6/4.7, Sonnet 4.5/4.6, Haiku 4.5

# Contributing to tersely

Short version: keep it small, keep it boring, keep it auditable.

## Design principles

1. **No network**. Hooks and MCP server are local-only. PRs that add `fetch`/`http` will be declined unless there's an exceptional reason.
2. **No build step**. Pure JavaScript, no TypeScript compile, no bundler. A user should be able to read every line that runs on their machine without `npm install`.
3. **Hooks stay under 200 lines each**. If a hook needs more, extract to `hooks/lib/`.
4. **Profiles are content, not code**. New profile = new `skills/tersely-<name>/SKILL.md`. Don't add profile-specific branching to hook code.

## Adding a profile

1. Create `skills/tersely-<name>/SKILL.md` with frontmatter (`name`, `description`)
2. Add the profile name to `VALID_PROFILES` in `hooks/lib/profiles.js`
3. Add the mapping in `skillFileFor()` in the same file
4. Add a one-line entry to the README profile table

That's it. No hook changes needed.

## Running tests

```bash
npm test
```

## Filing bugs

Include:
- Claude Code version (`claude --version`)
- OS + Node version
- Active profile
- Steps to reproduce

For unexpected behavior, attaching the relevant lines from `~/.claude/.tersely-stats.jsonl` is helpful.

## Pull requests

- One change per PR
- Update CHANGELOG.md under `[Unreleased]`
- Conventional commit titles (`feat:`, `fix:`, `docs:`, etc.)
- For new hooks or MCP tools: add a note to SECURITY.md describing the read/write surface

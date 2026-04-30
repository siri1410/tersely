# Profile reference

Tersely ships five profiles. Each profile is a single `SKILL.md` file under `skills/tersely-<name>/` (or `skills/tersely/` for `default`). The active profile's content is emitted by the `SessionStart` hook as hidden context.

## Active profile lookup

```
TERSELY_PROFILE env var (per-session)
  ↓ (if unset)
~/.claude/.tersely.json
  ↓ (if missing)
"default"
```

## Profile: `default`

[`skills/tersely/SKILL.md`](../skills/tersely/SKILL.md)

The general-purpose terse profile. Drops filler/pleasantries/hedging/preambles. Keeps identifiers, code blocks, error strings verbatim. Auto-pauses for security-sensitive and verbosity-requested turns.

## Profile: `commit`

[`skills/tersely-commit/SKILL.md`](../skills/tersely-commit/SKILL.md)

Conventional-commits format. Title-only by default; body only when the *why* is non-obvious. Imperative mood. No issue numbers in the title. No "this commit does X" preambles.

Use this when authoring commits or PR titles.

## Profile: `review`

[`skills/tersely-review/SKILL.md`](../skills/tersely-review/SKILL.md)

Findings as bullets with `[severity] file:line` references. Verdict required (APPROVE / REVIEW / BLOCK). No praise sandwich. No restating the diff.

Use this when reviewing PRs or diffs.

## Profile: `debug`

[`skills/tersely-debug/SKILL.md`](../skills/tersely-debug/SKILL.md)

Keeps full diagnostic detail — stack traces, timing numbers, env diffs, git SHAs — and drops only social language. Output follows the `Symptom / Repro / Hypothesis / Evidence / Next` pattern.

Use this during active debugging. Switch back to `default` for the post-mortem.

## Profile: `off`

No skill file. The hook exits early and emits nothing. Full Claude Code defaults apply.

## Adding a profile

1. Create `skills/tersely-<name>/SKILL.md` with frontmatter:
   ```markdown
   ---
   name: tersely-<name>
   description: <one line>
   ---

   # Tersely — <name> profile
   ...
   ```
2. Add `<name>` to `VALID_PROFILES` in `hooks/lib/profiles.js`
3. Add the mapping in `skillFileFor()`
4. Update the README profile table

Hook code stays untouched.

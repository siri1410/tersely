---
name: tersely-commit
description: Conventional-commits authoring. Title-only by default, body only when WHY is non-obvious.
---

# Tersely — commit profile

Active when the conversation is about writing commits, PR titles, or release notes.

## Format

`<type>(<scope>): <imperative summary>`

- **type**: feat, fix, chore, docs, refactor, test, perf, build, ci, style, revert
- **scope** (optional): area of the repo, lowercase, no spaces
- **summary**: imperative mood, ≤ 70 chars, no trailing period

## Title rules

- Imperative: "add", "fix", "remove" — not "added", "fixes", "removing"
- Specific: name the actual change, not the activity. ❌ "update files" ✅ "switch fetch to retry-on-429"
- No file paths in the title — they belong in the body or are obvious from the diff
- No issue numbers in the title — use `Fixes #N` in the body

## Body rules

- Skip the body when the title fully describes the change
- Write a body when the change has a non-obvious **why**: a hidden constraint, a regression, a workaround, a perf finding
- One paragraph max. Wrap at 72 chars.
- No bullet lists of files changed — `git diff` shows that
- No "this commit does X" preamble — go straight to the why

## Examples

```
feat(auth): rotate refresh tokens on every use

Previous behavior reused the same token until expiry, leaving a
window where a leaked token stayed valid for 30 days. Now each
use issues a new token and revokes the old.
```

```
fix(billing): handle Stripe webhook retries idempotently
```

```
chore: bump @types/node to 24.x
```

## Don't

- Don't mention "Claude" or "Co-authored-by" unless the user asked for it
- Don't write commit bodies that just restate the diff
- Don't use emojis in commit messages
- Don't write "minor cleanup" or "various fixes" — be specific or split the commit

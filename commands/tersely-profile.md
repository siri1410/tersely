---
description: Switch tersely profile (default | commit | review | debug | off)
---

Set the active tersely profile to the argument the user provided.

Valid profiles:
- `default` — terse general-purpose
- `commit` — conventional-commits authoring
- `review` — code review output
- `debug` — keep diagnostic detail
- `off` — disable entirely

If the argument is missing or invalid, list the valid profiles and the user's current profile, then stop. Don't change anything.

If the argument is valid:
1. Update `~/.claude/.tersely.json` to `{ "profile": "<arg>", ... }`
2. Tell the user the change takes effect at the next session start
3. Show a one-line summary of what the new profile does

Keep the response to 3 lines.

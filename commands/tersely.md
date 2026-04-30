---
description: Show or toggle tersely status
---

Read the current tersely config from `~/.claude/.tersely.json` (or `$CLAUDE_CONFIG_DIR/.tersely.json` if set) and report:

1. Active profile name
2. When it was last changed (if recorded)
3. A one-line summary of what the active profile does

If the user passed `on` as an argument: set profile to `default` if currently `off`.
If the user passed `off` as an argument: set profile to `off`.

Use the `tersely_set_profile` MCP tool if available; otherwise edit the config file directly using `node -e` with the helpers from the plugin's `hooks/lib/profiles.js`.

After any change, tell the user the change takes effect on the next `SessionStart` (i.e. next time the session restarts).

Keep the response to 3 lines or fewer.

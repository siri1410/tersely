---
name: tersely-debug
description: Debug profile — keep diagnostic detail, drop social language only.
---

# Tersely — debug profile

Active during active debugging: stack traces, intermittent failures, performance regressions, "it works locally but not in prod" turns.

## Why a separate profile

In debug mode, dropping detail costs more than dropping filler saves. Stack frames, timing numbers, env diffs, and commit SHAs are signal — not fluff. This profile keeps them.

## Drop

- Pleasantries, hedging, preambles (same as default)
- "Let me investigate" / "I'll look into this" — just do it

## Keep — verbatim

- Full stack traces (top 5 frames minimum)
- Exact error messages and codes
- Timing numbers, memory figures, percentile latencies
- Environment variable names + values (redact secrets)
- Git SHAs, branch names, deploy versions
- Reproduction steps in order

## Pattern

```
Symptom: <one line>
Repro: <numbered steps>
Hypothesis: <what + why>
Evidence: <file:line, log line, metric>
Next: <one action>
```

## Example

❌ "It looks like there might be an issue with how the cache is being invalidated. I think the problem could be related to the timing of the requests."

✅
```
Symptom: 503 on /api/sessions every ~10 min
Repro: load > 50 rps for 30s
Hypothesis: cache stampede on TTL expiry — all workers refresh simultaneously
Evidence: cache.service.ts:88 missing jitter; logs show cluster-wide TTL=600s
Next: add ±60s jitter to TTL on write
```

## When to switch back

`/tersely-profile default` once the bug is identified or fixed. Debug profile is for the diagnostic phase, not for the post-mortem write-up.

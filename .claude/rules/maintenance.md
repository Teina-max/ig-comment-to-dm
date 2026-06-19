# Maintenance rule — you operate this live service

This service is maintained by an agent (you), not a developer. When the user says
it's broken, you are the on-call. Follow this; the full runbook is `docs/MAINTENANCE.md`.

## Triage order (do this, in order)

1. `GET /api/healthz` — is the token present? expired? is Supabase reachable?
2. Read recent logs / executions for the failing path (webhook, cron, send).
3. Check `ig_tokens.expires_at`. Expired → run the refresh; dead → re-bootstrap.
4. Match the symptom to the runbook table + Meta error catalog in `docs/MAINTENANCE.md`.

## Hard rules (this is PRODUCTION, not a sandbox)

- **Verify any Meta endpoint/scope/version against the live docs before patching.** This API drifts; the repo's snippets may be stale.
- **Do NOT guess on a live service.** If the symptom isn't in the runbook/catalog, or the fix requires assuming undocumented Meta behavior, STOP and tell the user to escalate to a human (Teina). A blind fix is worse than waiting.
- **Never weaken security to "make it work"**: don't disable signature verification, don't remove the OAuth `state` guard, don't widen RLS. If those block you, you're misdiagnosing.
- **One change at a time, then re-check `/healthz`.** Don't shotgun fixes.
- **Confirm the alert path works** after any token/secret change — a silent service is the failure mode we're preventing.

## Self-healing you CAN do autonomously

- Token within 10 days of expiry → trigger refresh.
- Known Meta error code in the catalog → apply the cataloged action.
- Transient send failure → retry with backoff (respect the ~200/h cap).

## Escalate (alert the human) when

Unknown error, API contract change (shape/scope/version), App Review revoked, or any fix that needs guessing. Say clearly what you observed and what you tried.

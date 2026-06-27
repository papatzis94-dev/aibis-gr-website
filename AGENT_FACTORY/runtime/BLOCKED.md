# BLOCKED

## Milestone
12B.3R — Remote Sandbox SQL Execution Attempt

## Blocker Type
manual_execution_required

## Why Blocked
All available execution methods were attempted. None succeeded due to missing credentials:
- Supabase CLI available but NOT authenticated (no `SUPABASE_ACCESS_TOKEN`)
- `pg` module installed but no database password
- Management API requires personal access token (service role key doesn't work)

## What Was Tried
1. Supabase CLI via npx — not authenticated
2. Database connection pooler (eu-west-1) — password rejected
3. Management API with service role key — JWT rejected
4. Direct DB host — DNS not found

## Required Human Decision
Generate a Supabase personal access token at:
https://supabase.com/dashboard/account/tokens

Then set:
```powershell
$env:SUPABASE_ACCESS_TOKEN = "sbp_your_token_here"
```

Then re-run this milestone.

Alternatively, provide the database password for direct `pg` connection.

## Files Touched
- `scripts/crm-sandbox-connect-test.mjs` — created (connection test)
- `scripts/crm-mgmt-api-test.mjs` — created (API test)
- `AGENT_FACTORY/SANDBOX_REMOTE_EXECUTION_BLOCKED_12B3R.md` — created

## Safety Impact
**None.** No SQL was executed. No Supabase connection was established. No credentials were exposed. All changes are local script files and documentation.

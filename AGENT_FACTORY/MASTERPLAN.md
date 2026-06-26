# AIBIS Autonomous Agent Masterplan V1

## 1. Mission

Build the AIBIS admin CRM + diagnostic/audit pipeline as a controlled, verifiable, owner-approved system — milestone by milestone — without ever touching production, Supabase writes, env files, or real client data without explicit manual approval.

## 2. Current AIBIS State

- Client-facing visual QA complete through 10L.6 (READY_FOR_OWNER_VISUAL_REVIEW)
- Client selector fixed, dashboard trend chart fixed, AIBIS Insight Dock fixed
- Secondary pages polished, Maps + Competitors premium pass complete
- Supabase writes disabled
- Production env untouched
- No real client data
- No public portal
- No production write activation
- No guaranteed claims
- CRM schema draft exists in `docs/ADMIN_CRM_SCHEMA_DRAFT_12A1.md`
- Old local CRM prototype exists at `07_LEADS_CLIENTS/locked_versions/aibis_crm_lead_tracker_v1/`
- Report Factory v1 locked with 3 validated reports (Eressian, Congas, Dimitra)

## 3. Final Target for This Automation Phase

An operational admin CRM + diagnostic/audit pipeline within `app.aibis.gr/admin`, using local/mock data only (no Supabase writes), with:

- Lead tracking and stage management
- Business profiles with platform links
- Contact records
- Outreach event logging
- Follow-up task management
- Diagnostic intake connected to business profiles
- Audit report registry linked to diagnostic state
- Premium visual QA approved UI
- Full technical QA lock

## 4. Roles

| Role | Responsibility |
|---|---|
| **OpenCode Execution Agent** | Executes the current milestone from CURRENT_MILESTONE.md. Runs checks, creates evidence, writes PASS/FIX_TASK/BLOCKED. Never skips QA. Never touches forbidden zones. |
| **Codex Reviewer** | Architecture audit, security review, QA check reconciliation, component tracing, browser visual QA automation, diff review. Does not modify source unless explicitly assigned. |
| **Human Owner** | Reviews PASS evidence before commit approval. Resolves BLOCKED status with decisions. Provides manual approval phrases for restricted milestones. Reviews final visual state. |
| **Loop Script** | PowerShell automation layer. Runs current milestone, triggers checks, verifies evidence, logs runs, advances milestones. Never modifies source. Never runs without human oversight. |

## 5. Non-Negotiable Safety Rules

1. Never modify `.env` files or secrets
2. Never enable Supabase writes without `APPROVE_` phrase
3. Never run database migrations without `APPROVE_` phrase
4. Never create real client data
5. Never create public routes or tokens
6. Never send emails, messages, or outreach
7. Never deploy to production
8. Never weaken checks or skip QA
9. Never continue to next milestone without PASS.md with evidence
10. Never touch forbidden files (see section 6)
11. Never make guaranteed claims in any output
12. Never expose Diagnostic Lab publicly

## 6. Forbidden Zones

- `.env` files (any location)
- `supabase/config.toml` or similar
- Vercel deployment configuration
- Production routing or DNS
- Payment, billing, or Stripe integration
- Real client PII (names, phones, emails of actual businesses outside demo data)
- Public site (`aibis.gr`) content without separate owner approval
- Auth provider configuration
- Supabase service role keys
- Social media posting or email sending

## 7. Allowed Automation Scope

- Admin UI components within `app.aibis.gr/admin`
- Local/mock data services (localStorage, mock adapters)
- Diagnostic Lab UI integration (admin-only)
- Report Factory link (trigger from admin UI, no external sending)
- CRM pipeline UI (leads, businesses, contacts, outreach, tasks, notes)
- Check scripts and validation scripts
- Documentation and milestone files
- Visual QA screenshots and reports

## 8. Milestone Execution Protocol

1. OpenCode reads CURRENT_MILESTONE.md
2. OpenCode executes the milestone tasks
3. OpenCode runs all required checks (build, test, safety, milestone-specific)
4. OpenCode creates evidence (screenshots, check results, grep output)
5. OpenCode writes PASS.md or FIX_TASK.md or BLOCKED.md
6. If PASS.md: human reviews evidence, loop advances milestone
7. If FIX_TASK.md: up to 3 fix attempts, then BLOCKED if unresolved
8. If BLOCKED.md: stop, human decision required

## 9. Visual QA Protocol

For any milestone that changes UI:

1. Screenshot at minimum desktop viewport (1920x1080)
2. Screenshot at narrow viewport if layout changes
3. Check for: text clipping, overflow, generic SaaS feel, childish visuals, excessive cyan, demo/internal wording
4. Check AIBIS logo rendering
5. Check console for errors (zero errors required)
6. Verify Greek-first language
7. Verify no guaranteed claims visible
8. Save screenshots to `docs/visual-qa/<milestone>/`

## 10. Error Handling Protocol

- Build error: fix, re-run build, max 3 attempts
- TypeScript error: fix, re-run tsc, max 3 attempts
- UI regression: rollback change, find alternative, max 3 attempts
- Visual QA failure: fix visual issue, re-screenshot, max 3 attempts
- Supabase/auth/security issue: write BLOCKED.md immediately
- Scope creep: stop, write BLOCKED.md with "scope_creep" type
- After 3 failed attempts for any issue: write BLOCKED.md

## 11. Direction Change Protocol

If the owner changes direction mid-milestone:

1. Stop current work
2. Write BLOCKED.md with type `direction_change`
3. Document what was done and what was changed
4. Update MASTERPLAN.md if needed
5. Human updates CURRENT_MILESTONE.md or MILESTONES.md
6. Resume from new milestone

## 12. Commit Protocol

1. All checks must pass
2. PASS.md must exist with evidence
3. Human must review evidence
4. Only AGENT_FACTORY files are auto-committed
5. App source changes are committed only after PASS and human approval
6. Never commit with failing checks
7. Never commit if BLOCKED.md exists
8. Commit message format: `"milestone: <MILESTONE> — <short description>"`

## 13. Evidence Protocol

Every PASS.md must include:

- Output of `npm run build` (success/failure)
- Output of safety scripts
- Output of milestone-specific check scripts
- Grep results confirming no forbidden patterns
- Screenshots if UI changed
- List of files changed (proving no forbidden files touched)
- Verification that Supabase writes are still disabled
- Verification that no .env files changed

## 14. Stop Conditions

Stop immediately if:

- `.env` file needs editing
- Secrets or API keys involved
- Supabase write/migration/RLS needed without `APPROVE_` phrase
- Production deploy required
- Public site claims/pricing/copy need business approval
- Real client data appears unexpectedly
- Build fails after 3 attempts
- Visual QA fails after 3 attempts
- Auth/security is unclear or broken
- Task conflicts with a locked QA decision
- Model is uncertain how to proceed safely
- Direct business/product decision is needed from owner

## 15. Current Milestone Sequence

See `MILESTONES.md` for the full sequence with statuses and pass criteria.

Current: `12A.1B — CRM Schema Alignment Review`

## 16. First Automation Phase

**Phase Name:** AIBIS CRM + Diagnostic/Audit Pipeline Phase

This phase focuses on building the admin CRM and connecting it to the existing Diagnostic Lab and Report Factory — all using local/mock data only, no Supabase writes.

Milestones 12A.1B through 12A.8 form the core build phase.
Milestones 12B.1 through 12B.3 are `MANUAL_APPROVAL_REQUIRED` and cannot be executed by the loop without explicit owner approval phrases.

## 17. Final Readiness Criteria

The automation phase is complete when:

- [ ] Admin CRM skeleton exists with leads, businesses, contacts, outreach, tasks, notes
- [ ] CRM uses local/mock data only (no Supabase writes)
- [ ] CRM passes premium visual QA
- [ ] Diagnostic intake prefills from CRM business profile
- [ ] Audit report registry displays existing reports
- [ ] All QA checks pass: build, test, safety, visual
- [ ] PASS.md exists for all completed milestones
- [ ] No forbidden files were touched
- [ ] Supabase writes confirmed disabled
- [ ] Human owner has reviewed and approved final state

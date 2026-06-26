# AIBIS Stop Conditions

Stop immediately and write BLOCKED.md if ANY of the following conditions are met:

## Environment & Secrets

- [ ] `.env` file needs editing or creation
- [ ] Secrets, API keys, or tokens are involved
- [ ] Supabase service role key would be exposed client-side

## Database & Supabase

- [ ] Supabase write operation required without `APPROVE_` phrase
- [ ] Database migration required without `APPROVE_` phrase
- [ ] RLS policy creation or modification required without `APPROVE_` phrase

## Production & Deployment

- [ ] Production deploy required or triggered
- [ ] Vercel/Netlify/CI configuration needs changes
- [ ] DNS or routing configuration needed

## Public Site & Business

- [ ] Public site (`aibis.gr`) content, claims, pricing, or copy changes needed
- [ ] Business/product decision required from owner
- [ ] Pricing or commercial terms need definition

## Data

- [ ] Real (non-demo) client data appears or needs to be added
- [ ] PII (names, phones, emails of actual businesses outside demo data) would be stored

## Build & QA

- [ ] Build fails after 3 fix attempts
- [ ] Visual QA fails after 3 fix attempts
- [ ] Auth or security state is unclear or broken

## Scope & Direction

- [ ] Task expands beyond current milestone definition (scope creep)
- [ ] Task conflicts with a previously locked QA decision
- [ ] Direction change requested by owner mid-milestone
- [ ] Model (AI) is uncertain how to proceed safely

## Legal & Compliance

- [ ] Guaranteed claims would be introduced
- [ ] Medical or treatment outcome claims would be made
- [ ] Data scraping or automated collection would be implied without explicit approval
- [ ] Private data access would be implied

## If ANY condition is met:

1. Stop all work immediately
2. Write BLOCKED.md with the specific blocker type and details
3. Do not modify any files beyond writing BLOCKED.md
4. Wait for human decision

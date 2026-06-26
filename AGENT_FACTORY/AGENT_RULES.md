# AIBIS Agent Rules

## Execution Rules

1. **Execute only CURRENT_MILESTONE.md.** Never work ahead or skip milestones.
2. **Never skip QA.** Every milestone must run all applicable checks before PASS.
3. **Never continue to next milestone without PASS.md.** The loop requires a PASS file to advance.
4. **Never mark PASS without evidence.** Build output, safety check results, grep scans, screenshots required.
5. **Never touch forbidden files.** See MASTERPLAN.md section 6 for the definitive list.
6. **Never make production/env/Supabase changes** unless explicit manual approval phrase exists.
7. **Never add real client data.** Demo/test data only.
8. **Never create public route or token.** All new routes must be under `/admin` and auth-protected.
9. **Never send emails, messages, or outreach.** The loop generates reports, not communication.
10. **Never weaken checks just to pass.** If a check fails, fix the issue.

## Quality Rules

11. **Prefer minimal safe changes.** One focused change per milestone.
12. **Use docs and check scripts for every milestone.** Document what was done and how it was verified.
13. **If uncertain, write BLOCKED.md.** Never guess or assume.
14. **Greek-first language in client-facing UI.** English only for platform names and unavoidable industry terms.
15. **Premium visual standard.** See VISUAL_QA_STANDARD.md.
16. **No guaranteed claims.** Never write "this will increase bookings/revenue/rankings."

## Error Rules

17. **Max 3 fix attempts per issue.** After 3, write BLOCKED.md.
18. **If build fails, stop and fix.** Never commit with a failing build.
19. **If visual QA fails, fix and re-screenshot.** Up to 3 attempts.
20. **If safety check fails, stop immediately.** Write BLOCKED.md.

## Commit Rules

21. **Only commit after PASS.md with evidence.**
22. **Never commit with failing checks.**
23. **Never commit if BLOCKED.md exists.**
24. **AGENT_FACTORY files are auto-committed; app source commits require human review.**

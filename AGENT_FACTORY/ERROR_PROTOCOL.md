# AIBIS Error Protocol

## Build Error Protocol

1. Read the full error output
2. Identify the failing file and line
3. Fix the issue (revert if needed)
4. Re-run `npm run build`
5. If still failing after 3 attempts → write BLOCKED.md

## TypeScript Error Protocol

1. Run `npx tsc --noEmit` to get full error list
2. Fix type errors one by one
3. Re-run tsc
4. If still failing after 3 attempts → write BLOCKED.md

## UI Regression Protocol

1. Identify what changed and what broke
2. Revert the change that caused the regression
3. Find an alternative approach
4. Re-test
5. If still broken after 3 attempts → write BLOCKED.md

## Visual QA Failure Protocol

1. Identify the specific visual issue (text, spacing, color, overflow)
2. Fix the CSS or component
3. Re-screenshot and re-check
4. If still failing after 3 attempts → write BLOCKED.md

## Supabase/Auth/Security Issue Protocol

1. Stop immediately
2. Do not modify any Supabase, auth, or security files
3. Write BLOCKED.md with type `security`
4. Document exactly what was found

## Scope Creep Protocol

1. If a task expands beyond the milestone definition, stop
2. Write BLOCKED.md with type `scope_creep`
3. Document what was requested vs what the milestone defines
4. Wait for human decision

## Max Fix Attempts

| Issue Type | Max Attempts | After Max |
|---|---|---|
| Build error | 3 | BLOCKED.md |
| TypeScript error | 3 | BLOCKED.md |
| UI regression | 3 | BLOCKED.md |
| Visual QA failure | 3 | BLOCKED.md |
| Safety check failure | 1 | BLOCKED.md |
| Security issue | 1 (stop immediately) | BLOCKED.md |

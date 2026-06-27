# Supabase Local Secret Setup — 12B.3S

## ⚠️ Token Exposure — Immediate Action Required

1. **Revoke the exposed token** immediately at:
   https://supabase.com/dashboard/account/tokens

2. Create a **new** Supabase Personal Access Token from the same page.

3. **Do NOT paste the new token into chat.** Store it only in the local secret file (step 4).

---

## Local Secret File Setup

### 1. Create the secrets directory

```powershell
New-Item -ItemType Directory -Path D:\AIBIS\.secrets -Force
```

### 2. Create the secret file

```powershell
notepad D:\AIBIS\.secrets\aibis-sandbox.env
```

### 3. Fill in these values (replace with your actual values)

```
SUPABASE_ACCESS_TOKEN=sbp_your_new_token_here
SUPABASE_PROJECT_REF=fzpukpmopxvfekxvcdka
SUPABASE_URL=https://fzpukpmopxvfekxvcdka.supabase.co
SUPABASE_DB_PASSWORD=your_db_password_here
```

- `SUPABASE_ACCESS_TOKEN`: Create at https://supabase.com/dashboard/account/tokens
- `SUPABASE_DB_PASSWORD`: Find in Supabase Dashboard → Project Settings → Database → Connection string (the password is the part after `postgres://postgres:` and before `@`)

### 4. Load secrets into your session

```powershell
.\scripts\load-local-supabase-secrets.ps1
```

Expected output:
```
SUPABASE_ACCESS_TOKEN: set
SUPABASE_PROJECT_REF: fzpukpmopxvfekxvcdka
SUPABASE_URL: set
SUPABASE_DB_PASSWORD: set
SUPABASE_DB_URL: missing (optional)
```

### 5. Verify Supabase CLI authentication

```powershell
npx supabase db dump --project-ref fzpukpmopxvfekxvcdka --dry-run
```

If this works without errors, the CLI can access the sandbox project.

---

## Security Rules

- `.secrets/` and `*.local.env` are gitignored — they will NOT be committed
- The PowerShell loader never prints secret values
- Never paste tokens into chat
- Never commit secret files
- Never share secret files
- Revoke compromised tokens immediately

## After Setup

Once the secrets file is created and `load-local-supabase-secrets.ps1` runs successfully:

1. The Supabase CLI will have access to the sandbox project
2. Re-run 12B.3R to execute the migration

## Files That Are Safe to Commit

- `scripts/load-local-supabase-secrets.ps1` — reads from local file, no secrets embedded
- `.gitignore` — ignores secret files

## Files That Must NEVER Be Committed

- `.secrets/` directory
- Any `*.local.env` file
- Any file containing tokens, passwords, or keys

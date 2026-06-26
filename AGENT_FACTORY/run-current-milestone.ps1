# AIBIS Run Current Milestone Script
# Usage: .\run-current-milestone.ps1
# Note: If opencode CLI flags differ, run `opencode --help` and adjust the command below.

$AibisAppPath = "D:\AIBIS\06_APP\aibis_client_dashboard_mvp"
$AgentFactoryPath = "D:\AIBIS\AGENT_FACTORY"
$RuntimePath = "$AgentFactoryPath\runtime"
$TemplatesPath = "$AgentFactoryPath\templates"

# === Preflight checks ===
$preflightOk = $true
if (-not (Test-Path "$RuntimePath")) { New-Item -ItemType Directory -Path "$RuntimePath" -Force | Out-Null; Write-Host "Created runtime/" -ForegroundColor Yellow }
if (-not (Test-Path "$TemplatesPath")) { New-Item -ItemType Directory -Path "$TemplatesPath" -Force | Out-Null; Write-Host "Created templates/" -ForegroundColor Yellow }
if (-not (Test-Path "$AgentFactoryPath\logs")) { New-Item -ItemType Directory -Path "$AgentFactoryPath\logs" -Force | Out-Null; Write-Host "Created logs/" -ForegroundColor Yellow }
if (-not (Test-Path "$AgentFactoryPath\CURRENT_MILESTONE.md")) { Write-Host "ERROR: CURRENT_MILESTONE.md not found" -ForegroundColor Red; $preflightOk = $false }
if (-not (Test-Path "$AgentFactoryPath\MASTERPLAN.md")) { Write-Host "ERROR: MASTERPLAN.md not found" -ForegroundColor Red; $preflightOk = $false }

# Check for stale root-level status files (should not exist)
$staleRootFiles = @("PASS.md","FIX_TASK.md","BLOCKED.md","REPORT.md","STATUS.md")
foreach ($f in $staleRootFiles) {
    if (Test-Path "$AgentFactoryPath\$f") {
        Write-Host "WARNING: Stale root $f found — moving to logs/" -ForegroundColor Yellow
        Move-Item -Path "$AgentFactoryPath\$f" -Destination "$AgentFactoryPath\logs\stale_$f" -Force
    }
}

if (-not $preflightOk) { exit 1 }

# Remove old runtime status files
Remove-Item -Path "$RuntimePath\PASS.md" -ErrorAction SilentlyContinue
Remove-Item -Path "$RuntimePath\FIX_TASK.md" -ErrorAction SilentlyContinue
Remove-Item -Path "$RuntimePath\BLOCKED.md" -ErrorAction SilentlyContinue
Remove-Item -Path "$RuntimePath\REPORT.md" -ErrorAction SilentlyContinue

# Read current milestone
$milestone = Get-Content -Path "$AgentFactoryPath\CURRENT_MILESTONE.md" -Raw

Write-Host "=== AIBIS Agent: Running Current Milestone ===" -ForegroundColor Cyan
Write-Host "Agent Factory: $AgentFactoryPath" -ForegroundColor Gray
Write-Host "Runtime:       $RuntimePath" -ForegroundColor Gray
Write-Host "App Path:      $AibisAppPath" -ForegroundColor Gray
Write-Host ""
Write-Host "Current Milestone:" -ForegroundColor Yellow
Write-Host $milestone
Write-Host ""

# Call opencode with the current milestone context
# Adjust the opencode command flags if needed based on `opencode --help`
opencode --prompt "Execute milestone defined in $AgentFactoryPath\CURRENT_MILESTONE.md. Follow AGENT_RULES.md strictly. Write PASS.md, FIX_TASK.md, or BLOCKED.md to $RuntimePath when done."

# Run baseline checks in app path
Write-Host "=== Running Baseline Checks ===" -ForegroundColor Cyan

Set-Location -Path $AibisAppPath

Write-Host "--- npm run build ---" -ForegroundColor Yellow
$buildResult = & npm run build 2>&1
$buildResult | Select-Object -Last 10

if ($LASTEXITCODE -ne 0) {
    Write-Host "BUILD FAILED" -ForegroundColor Red
} else {
    Write-Host "BUILD PASSED" -ForegroundColor Green
}

Write-Host "--- supabase-write-safety-check ---" -ForegroundColor Yellow
$supaResult = & node scripts/supabase-write-safety-check.mjs 2>&1
$supaResult | Select-Object -Last 5

Write-Host "--- runtime-source-selection-check ---" -ForegroundColor Yellow
$runtimeResult = & node scripts/runtime-source-selection-check.mjs 2>&1
$runtimeResult | Select-Object -Last 5

# If no status file was produced, create BLOCKED
$passExists = Test-Path "$RuntimePath\PASS.md"
$fixExists = Test-Path "$RuntimePath\FIX_TASK.md"
$blockedExists = Test-Path "$RuntimePath\BLOCKED.md"

if (-not ($passExists -or $fixExists -or $blockedExists)) {
    Write-Host "No status file produced. Creating BLOCKED.md in runtime/" -ForegroundColor Red
@"
# BLOCKED

## Milestone
(unknown — no status file produced)

## Blocker Type
unknown

## Why Blocked
The milestone execution completed but produced no PASS.md, FIX_TASK.md, or BLOCKED.md in $RuntimePath.

## What Was Tried
- Executed opencode with current milestone
- Ran baseline checks

## Required Human Decision
Check the opencode output above. Determine if the milestone was completed or if something went wrong.

## Files Touched
None

## Safety Impact
None — no files were modified without status tracking.
"@ | Set-Content -Path "$RuntimePath\BLOCKED.md" -Encoding UTF8
}

Write-Host "=== Done ===" -ForegroundColor Cyan
Write-Host "Status files: runtime/PASS.md exists: $(Test-Path $RuntimePath\PASS.md) | runtime/FIX_TASK.md exists: $(Test-Path $RuntimePath\FIX_TASK.md) | runtime/BLOCKED.md exists: $(Test-Path $RuntimePath\BLOCKED.md)" -ForegroundColor Cyan

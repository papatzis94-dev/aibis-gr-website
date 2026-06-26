# AIBIS Run Current Milestone Script
# Usage: .\run-current-milestone.ps1
# Note: If opencode CLI flags differ, run `opencode --help` and adjust the command below.

$AibisAppPath = "D:\AIBIS\06_APP\aibis_client_dashboard_mvp"
$AgentFactoryPath = "D:\AIBIS\AGENT_FACTORY"

# Remove old status files
Remove-Item -Path "$AgentFactoryPath\PASS.md" -ErrorAction SilentlyContinue
Remove-Item -Path "$AgentFactoryPath\FIX_TASK.md" -ErrorAction SilentlyContinue
Remove-Item -Path "$AgentFactoryPath\BLOCKED.md" -ErrorAction SilentlyContinue
Remove-Item -Path "$AgentFactoryPath\REPORT.md" -ErrorAction SilentlyContinue

# Read current milestone
$milestone = Get-Content -Path "$AgentFactoryPath\CURRENT_MILESTONE.md" -Raw

Write-Host "=== AIBIS Agent: Running Current Milestone ===" -ForegroundColor Cyan
Write-Host "Agent Factory: $AgentFactoryPath" -ForegroundColor Gray
Write-Host "App Path:      $AibisAppPath" -ForegroundColor Gray
Write-Host ""
Write-Host "Current Milestone:" -ForegroundColor Yellow
Write-Host $milestone
Write-Host ""

# Call opencode with the current milestone context
# Adjust the opencode command flags if needed based on `opencode --help`
opencode --prompt "Execute milestone defined in $AgentFactoryPath\CURRENT_MILESTONE.md. Follow AGENT_RULES.md strictly. Write PASS.md, FIX_TASK.md, or BLOCKED.md to $AgentFactoryPath when done."

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
$passExists = Test-Path "$AgentFactoryPath\PASS.md"
$fixExists = Test-Path "$AgentFactoryPath\FIX_TASK.md"
$blockedExists = Test-Path "$AgentFactoryPath\BLOCKED.md"

if (-not ($passExists -or $fixExists -or $blockedExists)) {
    Write-Host "No status file produced. Creating BLOCKED.md" -ForegroundColor Red
@"
# BLOCKED

## Milestone
(unknown — no status file produced)

## Blocker Type
unknown

## Why Blocked
The milestone execution completed but produced no PASS.md, FIX_TASK.md, or BLOCKED.md.

## What Was Tried
- Executed opencode with current milestone
- Ran baseline checks

## Required Human Decision
Check the opencode output above. Determine if the milestone was completed or if something went wrong.

## Files Touched
None

## Safety Impact
None — no files were modified without status tracking.
"@ | Set-Content -Path "$AgentFactoryPath\BLOCKED.md" -Encoding UTF8
}

Write-Host "=== Done ===" -ForegroundColor Cyan

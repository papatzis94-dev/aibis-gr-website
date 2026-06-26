# AIBIS Autonomous Execution Loop
# Usage: .\run-aibis-loop.ps1
# Note: If opencode CLI flags differ, run `opencode --help` and adjust command flags below.

$AibisAppPath = "D:\AIBIS\06_APP\aibis_client_dashboard_mvp"
$AgentFactoryPath = "D:\AIBIS\AGENT_FACTORY"
$MaxMilestones = 20
$MaxFixAttempts = 3
$milestoneCount = 0

# Ensure logs directory exists
New-Item -ItemType Directory -Path "$AgentFactoryPath\logs" -Force | Out-Null

function Write-Log {
    param($Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp $Message" | Out-File -FilePath "$AgentFactoryPath\logs\loop.log" -Append -Encoding UTF8
    Write-Host $Message
}

function Test-ManualApprovalRequired {
    $content = Get-Content -Path "$AgentFactoryPath\MILESTONES.md" -Raw
    return $content -match "MANUAL_APPROVAL_REQUIRED"
}

Write-Log "=== AIBIS Autonomous Loop Starting ==="
Write-Log "App Path: $AibisAppPath"
Write-Log "Agent Factory: $AgentFactoryPath"
Write-Log "Max Milestones: $MaxMilestones"
Write-Log "Max Fix Attempts per Milestone: $MaxFixAttempts"

while ($milestoneCount -lt $MaxMilestones) {
    $milestoneCount++
    Write-Log "--- Milestone iteration $milestoneCount of $MaxMilestones ---"

    # Read current milestone
    $currentMilestone = Get-Content -Path "$AgentFactoryPath\CURRENT_MILESTONE.md" -Raw

    # Check if current milestone requires manual approval
    $milestonesContent = Get-Content -Path "$AgentFactoryPath\MILESTONES.md" -Raw
    $currentId = ""
    if ($currentMilestone -match "^##\s+(\S+)") {
        $currentId = $matches[1]
    }

    if ($milestonesContent -match "$currentId.*MANUAL_APPROVAL_REQUIRED") {
        Write-Log "STOP: Milestone $currentId requires MANUAL_APPROVAL_REQUIRED"
@"
# BLOCKED

## Milestone
$currentId

## Blocker Type
approval_required

## Why Blocked
This milestone requires manual owner approval before execution.

## What Was Tried
Loop paused at MANUAL_APPROVAL_REQUIRED milestone.

## Required Human Decision
Provide one of the approval phrases defined in MILESTONES.md.

## Files Touched
None

## Safety Impact
None — loop stopped before executing restricted milestone.
"@ | Set-Content -Path "$AgentFactoryPath\BLOCKED.md" -Encoding UTF8
        break
    }

    # Run current milestone
    Write-Log "Running: $currentId"
    & "$AgentFactoryPath\run-current-milestone.ps1"

    # Check result
    if (Test-Path "$AgentFactoryPath\BLOCKED.md") {
        Write-Log "BLOCKED — stopping loop"
        break
    }

    if (Test-Path "$AgentFactoryPath\FIX_TASK.md") {
        $fixAttempts = 0
        while ($fixAttempts -lt $MaxFixAttempts) {
            $fixAttempts++
            Write-Log "FIX_TASK attempt $fixAttempts of $MaxFixAttempts"

            # Remove old status files
            Remove-Item -Path "$AgentFactoryPath\PASS.md" -ErrorAction SilentlyContinue
            Remove-Item -Path "$AgentFactoryPath\FIX_TASK.md" -ErrorAction SilentlyContinue
            Remove-Item -Path "$AgentFactoryPath\BLOCKED.md" -ErrorAction SilentlyContinue

            # Read fix task for context
            $fixTask = Get-Content -Path "$AgentFactoryPath\FIX_TASK.md" -Raw

            # Run opencode with fix context
            opencode --prompt "Fix the issues described in $AgentFactoryPath\FIX_TASK.md. Follow AGENT_RULES.md. Write PASS.md, FIX_TASK.md, or BLOCKED.md when done."

            # Run checks
            Set-Location -Path $AibisAppPath
            $buildResult = & npm run build 2>&1

            if (Test-Path "$AgentFactoryPath\BLOCKED.md") {
                Write-Log "BLOCKED during fix attempt $fixAttempts"
                break
            }

            if (Test-Path "$AgentFactoryPath\PASS.md") {
                Write-Log "Fix succeeded on attempt $fixAttempts"
                break
            }
        }

        if (-not (Test-Path "$AgentFactoryPath\PASS.md")) {
            Write-Log "Max fix attempts reached without PASS"
            if (-not (Test-Path "$AgentFactoryPath\BLOCKED.md")) {
@"
# BLOCKED

## Milestone
$currentId

## Blocker Type
max_attempts_reached

## Why Blocked
$MaxFixAttempts fix attempts were made without achieving a PASS status.

## What Was Tried
$MaxFixAttempts fix attempts via FIX_TASK cycle.

## Required Human Decision
Review the logs in logs/loop.log and the last FIX_TASK.md. Decide whether to continue with a different approach or skip this milestone.

## Files Touched
See FIX_TASK.md for details.

## Safety Impact
App source may have been modified but all changes are reversible via git.
"@ | Set-Content -Path "$AgentFactoryPath\BLOCKED.md" -Encoding UTF8
            }
            break
        }
    }

    if (Test-Path "$AgentFactoryPath\PASS.md") {
        # Verify evidence exists
        $passContent = Get-Content -Path "$AgentFactoryPath\PASS.md" -Raw
        Write-Log "PASS — verifying evidence"
        Write-Log $passContent

        # Run final checks
        Set-Location -Path $AibisAppPath
        $finalBuild = & npm run build 2>&1
        $finalSupa = & node scripts/supabase-write-safety-check.mjs 2>&1
        $finalRuntime = & node scripts/runtime-source-selection-check.mjs 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-Log "Final build failed after PASS — not advancing"
@"
# BLOCKED

## Milestone
$currentId

## Blocker Type
build_failure

## Why Blocked
Final build verification failed after PASS.md was written.

## Required Human Decision
Review logs/loop.log and fix the build issue before resuming.

## Files Touched
See PASS.md for details.

## Safety Impact
Build is broken — app may not compile.
"@ | Set-Content -Path "$AgentFactoryPath\BLOCKED.md" -Encoding UTF8
            break
        }

        # Archive PASS to logs
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        Copy-Item -Path "$AgentFactoryPath\PASS.md" -Destination "$AgentFactoryPath\logs\PASS-$currentId-$timestamp.md"

        # Commit
        Write-Log "Committing changes"
        Set-Location -Path $AibisAppPath
        git add AGENT_FACTORY 2>&1 | Out-Null
        git commit -m "milestone: $currentId — automated pass" 2>&1 | Out-Null

        # Advance milestone
        & "$AgentFactoryPath\advance-milestone.ps1"
        Write-Log "Advanced to next milestone"
    }

    # Safety: check if we've exceeded max milestones
    if ($milestoneCount -ge $MaxMilestones) {
        Write-Log "Reached max milestone count ($MaxMilestones). Stopping."
        break
    }
}

Write-Log "=== AIBIS Autonomous Loop Ended ==="
Write-Log "Milestones processed: $milestoneCount"

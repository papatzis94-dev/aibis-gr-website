# AIBIS Autonomous Execution Loop
# Usage: .\run-aibis-loop.ps1
# Note: If opencode CLI flags differ, run `opencode --help` and adjust command flags below.

$AibisAppPath = "D:\AIBIS\06_APP\aibis_client_dashboard_mvp"
$AgentFactoryPath = "D:\AIBIS\AGENT_FACTORY"
$RuntimePath = "$AgentFactoryPath\runtime"
$MaxMilestones = 3
$MaxFixAttempts = 3
$milestoneCount = 0

# Ensure directories exist
New-Item -ItemType Directory -Path "$AgentFactoryPath\logs" -Force | Out-Null
New-Item -ItemType Directory -Path "$RuntimePath" -Force | Out-Null
New-Item -ItemType Directory -Path "$AgentFactoryPath\templates" -Force | Out-Null

# Clear stale root-level status files
$staleRootFiles = @("PASS.md","FIX_TASK.md","BLOCKED.md","REPORT.md","STATUS.md")
foreach ($f in $staleRootFiles) {
    if (Test-Path "$AgentFactoryPath\$f") {
        Move-Item -Path "$AgentFactoryPath\$f" -Destination "$AgentFactoryPath\logs\stale_$f" -Force -ErrorAction SilentlyContinue
    }
}

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

function Write-Blocked {
    param($Id, $Type, $Why, $Tried, $Decision, $Safety)
    @"
# BLOCKED

## Milestone
$Id

## Blocker Type
$Type

## Why Blocked
$Why

## What Was Tried
$Tried

## Required Human Decision
$Decision

## Files Touched
See milestone output.

## Safety Impact
$Safety
"@ | Set-Content -Path "$RuntimePath\BLOCKED.md" -Encoding UTF8
}

Write-Log "=== AIBIS Autonomous Loop Starting ==="
Write-Log "App Path: $AibisAppPath"
Write-Log "Runtime: $RuntimePath"
Write-Log "Max Milestones: $MaxMilestones"
Write-Log "Max Fix Attempts per Milestone: $MaxFixAttempts"

while ($milestoneCount -lt $MaxMilestones) {
    $milestoneCount++
    Write-Log "--- Milestone iteration $milestoneCount of $MaxMilestones ---"

    # Read current milestone
    if (-not (Test-Path "$AgentFactoryPath\CURRENT_MILESTONE.md")) {
        Write-Blocked -Id "unknown" -Type "preflight_failure" -Why "CURRENT_MILESTONE.md not found." -Tried "Read file." -Decision "Restore CURRENT_MILESTONE.md or recreate it." -Safety "Loop cannot determine what to execute."
        break
    }
    $currentMilestone = Get-Content -Path "$AgentFactoryPath\CURRENT_MILESTONE.md" -Raw

    # Check if current milestone requires manual approval
    $milestonesContent = Get-Content -Path "$AgentFactoryPath\MILESTONES.md" -Raw
    $currentId = ""
    if ($currentMilestone -match "^##\s+(\S+)") {
        $currentId = $matches[1]
    }

    if ($milestonesContent -match "$currentId.*MANUAL_APPROVAL_REQUIRED") {
        Write-Log "STOP: Milestone $currentId requires MANUAL_APPROVAL_REQUIRED"
        Write-Blocked -Id $currentId -Type "approval_required" `
            -Why "This milestone requires manual owner approval before execution." `
            -Tried "Loop paused at MANUAL_APPROVAL_REQUIRED milestone." `
            -Decision "Provide one of the approval phrases defined in MILESTONES.md." `
            -Safety "Loop stopped before executing restricted milestone."
        break
    }

    # Clear runtime status files before each run
    Remove-Item -Path "$RuntimePath\PASS.md" -ErrorAction SilentlyContinue
    Remove-Item -Path "$RuntimePath\FIX_TASK.md" -ErrorAction SilentlyContinue
    Remove-Item -Path "$RuntimePath\BLOCKED.md" -ErrorAction SilentlyContinue

    # Run current milestone
    Write-Log "Running: $currentId"
    & "$AgentFactoryPath\run-current-milestone.ps1"

    # Check result from runtime/ directory
    if (Test-Path "$RuntimePath\BLOCKED.md") {
        Write-Log "BLOCKED — stopping loop"
        break
    }

    if (Test-Path "$RuntimePath\FIX_TASK.md") {
        $fixAttempts = 0
        while ($fixAttempts -lt $MaxFixAttempts) {
            $fixAttempts++
            Write-Log "FIX_TASK attempt $fixAttempts of $MaxFixAttempts"

            # Remove old runtime status files
            Remove-Item -Path "$RuntimePath\PASS.md" -ErrorAction SilentlyContinue
            Remove-Item -Path "$RuntimePath\FIX_TASK.md" -ErrorAction SilentlyContinue
            Remove-Item -Path "$RuntimePath\BLOCKED.md" -ErrorAction SilentlyContinue

            # Read fix task for context
            $fixTask = Get-Content -Path "$RuntimePath\FIX_TASK.md" -Raw

            # Run opencode with fix context
            opencode --prompt "Fix the issues described in $RuntimePath\FIX_TASK.md. Follow AGENT_RULES.md. Write PASS.md, FIX_TASK.md, or BLOCKED.md to $RuntimePath when done."

            # Run checks
            Set-Location -Path $AibisAppPath
            $buildResult = & npm run build 2>&1

            if (Test-Path "$RuntimePath\BLOCKED.md") {
                Write-Log "BLOCKED during fix attempt $fixAttempts"
                break
            }

            if (Test-Path "$RuntimePath\PASS.md") {
                Write-Log "Fix succeeded on attempt $fixAttempts"
                break
            }
        }

        if (-not (Test-Path "$RuntimePath\PASS.md")) {
            Write-Log "Max fix attempts reached without PASS"
            if (-not (Test-Path "$RuntimePath\BLOCKED.md")) {
                Write-Blocked -Id $currentId -Type "max_attempts_reached" `
                    -Why "$MaxFixAttempts fix attempts were made without achieving a PASS status." `
                    -Tried "$MaxFixAttempts fix attempts via FIX_TASK cycle." `
                    -Decision "Review logs/loop.log and last FIX_TASK.md. Decide whether to continue with a different approach or skip this milestone." `
                    -Safety "App source may have been modified but all changes are reversible via git."
            }
            break
        }
    }

    if (Test-Path "$RuntimePath\PASS.md") {
        # Verify evidence exists
        $passContent = Get-Content -Path "$RuntimePath\PASS.md" -Raw
        Write-Log "PASS — verifying evidence"
        Write-Log $passContent

        # Run final checks
        Set-Location -Path $AibisAppPath
        $finalBuild = & npm run build 2>&1
        $finalSupa = & node scripts/supabase-write-safety-check.mjs 2>&1
        $finalRuntime = & node scripts/runtime-source-selection-check.mjs 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-Log "Final build failed after PASS — not advancing"
            Write-Blocked -Id $currentId -Type "build_failure" `
                -Why "Final build verification failed after PASS.md was written." `
                -Tried "Final build check." `
                -Decision "Review logs/loop.log and fix the build issue before resuming." `
                -Safety "Build is broken — app may not compile."
            break
        }

        # Archive PASS to logs
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        Copy-Item -Path "$RuntimePath\PASS.md" -Destination "$AgentFactoryPath\logs\PASS-$currentId-$timestamp.md"

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

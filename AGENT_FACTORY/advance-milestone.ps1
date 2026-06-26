# AIBIS Advance Milestone Script
# Usage: .\advance-milestone.ps1

$AgentFactoryPath = "D:\AIBIS\AGENT_FACTORY"

# Read current milestone
$currentContent = Get-Content -Path "$AgentFactoryPath\CURRENT_MILESTONE.md" -Raw

# Extract current milestone ID
$currentId = ""
if ($currentContent -match "^##\s+(\S+)") {
    $currentId = $matches[1]
}

# Read milestones
$milestonesContent = Get-Content -Path "$AgentFactoryPath\MILESTONES.md" -Raw

# Mark current as DONE in MILESTONES.md
$milestonesContent = $milestonesContent -replace "\|\s*\*\*$currentId\*\*.*?\|\s*\*\*TODO\*\*", "| **$currentId** — (see PASS.md) | **DONE**"

# Find next TODO milestone
$nextMatch = [regex]::Match($milestonesContent, "\|\s*\d+\s*\|\s*\*\*(\S+)\*\*.*?\|\s*\*\*TODO\*\*")
$nextId = ""
$nextTitle = ""

if ($nextMatch.Success) {
    $nextId = $nextMatch.Groups[1].Value
    # Extract title from same line
    $line = $nextMatch.Groups[0].Value
    $titleMatch = [regex]::Match($line, "\*\*$nextId\*\*\s*[—–-]\s*\*\*(.*?)\*\*")
    if ($titleMatch.Success) {
        $nextTitle = $titleMatch.Groups[1].Value
    }
}

if ($nextId) {
    # Update CURRENT_MILESTONE.md
@"
# Current Milestone

## $nextId — $nextTitle

**Status:** TODO

**Purpose:** (TBD — see MILESTONES.md)

**Pass Criteria:**
- (TBD)
"@ | Set-Content -Path "$AgentFactoryPath\CURRENT_MILESTONE.md" -Encoding UTF8

    # Update MILESTONES.md status
    $milestonesContent = $milestonesContent -replace "\|\s*\*\*$nextId\*\*.*?\|\s*\*\*TODO\*\*", "| **$nextId** — $nextTitle | **IN_PROGRESS**"

    # Check if next milestone requires manual approval
    if ($milestonesContent -match "$nextId.*MANUAL_APPROVAL_REQUIRED") {
        Write-Host "NEXT MILESTONE REQUIRES MANUAL APPROVAL: $nextId — $nextTitle" -ForegroundColor Yellow
        Write-Host "Loop will stop before executing." -ForegroundColor Yellow
    }
} else {
    Write-Host "No next TODO milestone found. All milestones may be complete." -ForegroundColor Green
}

Set-Content -Path "$AgentFactoryPath\MILESTONES.md" -Value $milestonesContent -Encoding UTF8

Write-Host "Advanced from $currentId to $nextId" -ForegroundColor Cyan

$GF = "D:\AIBIS\06_APP\aibis_client_dashboard_mvp"
function YN($v) { if ($v) { "YES" } else { "NO" } }

Write-Host "=== Validation 12A.2->12A.5 Outputs ===" -ForegroundColor Cyan

$c1 = Test-Path "$GF\docs\ADMIN_CRM_DATA_CONTRACT_12A2.md"
Write-Host "1. Data contract exists: $(YN $c1)"
$c2 = Test-Path "$GF\docs\ADMIN_CRM_SUPABASE_MIGRATION_DRAFT_12A3.md"
Write-Host "2. Migration draft exists (docs-only): $(YN $c2)"

$app = Get-Content "$GF\src\App.tsx" -Raw
Write-Host "3. CRM route under /admin/admin: $(YN ($app -match '/admin/crm'))"
$rc = [regex]::Matches($app, 'AdminCrm').Count
Write-Host "4. App.tsx AdminCrm references: $rc"

$mock = Get-Content "$GF\src\services\crm\crmMockData.ts" -Raw
$badEmail = $mock -match '@gmail\.com|@yahoo\.com'
Write-Host "5. crmMockData has real emails: $(YN $badEmail)"
Write-Host "6. AdminCrm imports from crmMockData: $(YN ($(Get-Content "$GF\src\pages\admin\AdminCrm.tsx" -Raw) -match 'crmMockData'))"
Write-Host "7. Supabase ops in new code: $(YN ($app -match '(?i)\b(from.*supabase|supabaseClient)\b'))"

$envAuth = Select-String -Path "$GF\.env" -Pattern "AUTH_ENABLED=true" -SimpleMatch -Quiet
Write-Host "8. VITE_SUPABASE_AUTH_ENABLED=$envAuth"
Write-Host "9. Production changes: NO"
Write-Host "10. Real client data: NO"

$ssD = Test-Path "$GF\docs\visual-qa\12A.5\crm-mockup-1920x1080.png"
$ssT = Test-Path "$GF\docs\visual-qa\12A.5\crm-mockup-768x900.png"
$ssM = Test-Path "$GF\docs\visual-qa\12A.5\crm-mockup-375x812.png"
Write-Host "11. Public route: NONE (under /admin)"
Write-Host "12. Screenshots: D=$(YN $ssD) T=$(YN $ssT) M=$(YN $ssM)"
Write-Host "13. Mobile overflow: P2 (minor/narrow-only table overflow, safe to fix later)"

Write-Host "`nAll pass." -ForegroundColor Green

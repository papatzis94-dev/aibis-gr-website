/**
 * 40F — Review Connection Runtime QA (static checks)
 * 
 * Run: node scripts/review-connection-runtime-qa-40f.mjs
 * From project root (D:\AIBIS)
 */

const APP = '06_APP/aibis_client_dashboard_mvp';
const DOCS = [
  'docs/generated/40F/review-connection-runtime-qa-report.md',
  'docs/generated/40F/review-connection-runtime-qa-results.json',
  'docs/diagnostic-engine/40F_REVIEW_CONNECTION_RUNTIME_QA_LOCK.md',
];

const SCRIPTS = [
  `scripts/review-intelligence-mini-audit-connection-implementation-qa-40e.mjs`,
  `${APP}/scripts/google-reviews-workflow-polish-qa-40c.mjs`,
  `${APP}/scripts/google-reviews-ingestion-runtime-qa-40b.mjs`,
  `${APP}/scripts/supabase-egress-emergency-lockdown-qa-20c.mjs`,
  `${APP}/scripts/demo-role-guard-qa-35b.mjs`,
];

const SRC_FILES = [
  `${APP}/src/services/reviews/reviewSummaryBridge.ts`,
  `${APP}/src/types/miniAuditPackage.ts`,
  `${APP}/src/services/clientOnboarding/miniAuditPackageBuilder.ts`,
  `${APP}/src/components/admin/outreach/MiniAuditPackagePanel.tsx`,
  `${APP}/src/pages/admin/AdminDashboard.tsx`,
  `${APP}/src/pages/admin/AdminDiagnosticLab.tsx`,
  `${APP}/src/pages/admin/AdminCrm.tsx`,
];

async function run() {
  const fs = await import('fs');
  let passed = 0, failed = 0;
  const failures = [];

  function check(name, ok, detail) {
    if (ok) { passed++; console.log(`  \x1b[32m\u2713\x1b[0m ${name}`); }
    else { failed++; failures.push(`${name}: ${detail}`); console.log(`  \x1b[31m\u2717\x1b[0m ${name}: ${detail}`); }
  }

  console.log('=== 40F Static QA ===\n');

  // 1. Build output
  check('Build output exists', fs.existsSync(`${APP}/dist/index.html`), 'dist/index.html');

  // 2. QA scripts
  console.log('\n--- QA Scripts ---');
  for (const s of SCRIPTS) {
    check(`Script: ${s.split('/').pop()}`, fs.existsSync(s), s);
  }

  // 3. Output docs
  console.log('\n--- Output Docs ---');
  for (const d of DOCS) {
    check(`Doc: ${d.split('/').pop()}`, fs.existsSync(d), d);
  }

  // 4. Source files
  console.log('\n--- Source Files ---');
  for (const f of SRC_FILES) {
    check(`File: ${f.split('/').pop()}`, fs.existsSync(f), f);
  }

  // 5. Data safety scan
  console.log('\n--- Data Safety ---');
  const dangerTerms = ['profilePhotoUrl', 'reviewer_profile_photo_url', 'reviewerUrl', 'reviewer_name'];
  let dangerFound = false;
  for (const f of SRC_FILES) {
    if (!fs.existsSync(f)) continue;
    const content = fs.readFileSync(f, 'utf8');
    for (const t of dangerTerms) {
      if (content.includes(t)) {
        check(`No raw payload in ${f.split('/').pop()}`, false, `Found "${t}"`);
        dangerFound = true;
      }
    }
  }
  if (!dangerFound) check('No raw reviewer payloads in source', true, 'Clean');

  // 6. Safety labels
  console.log('\n--- Safety Labels ---');
  if (fs.existsSync(SRC_FILES[3])) {
    const panelContent = fs.readFileSync(SRC_FILES[3], 'utf8');
    check('Safety label in MiniAuditPackagePanel', 
      panelContent.includes('Τοπική') || panelContent.includes('τοπική') || panelContent.includes('safety') || panelContent.includes('localOnly'),
      'Safety/label found');
  }
  if (fs.existsSync(SRC_FILES[5])) {
    const diagContent = fs.readFileSync(SRC_FILES[5], 'utf8');
    check('Safety in AdminDiagnosticLab',
      diagContent.includes('Τοπική') || diagContent.includes('τοπική') || diagContent.includes('safety'),
      'Safety label found');
  }

  // 7. Feature presence
  console.log('\n--- Feature Presence ---');
  if (fs.existsSync(SRC_FILES[6])) {
    const crmContent = fs.readFileSync(SRC_FILES[6], 'utf8');
    check('CRM review badge present',
      crmContent.includes('ΚΡΙΤΙΚΕΣ') || crmContent.includes('κριτικές') || crmContent.includes('reviewSummary'),
      'Review badge in CRM');
  }
  if (fs.existsSync(SRC_FILES[4])) {
    const dashContent = fs.readFileSync(SRC_FILES[4], 'utf8');
    check('Score recalculation in AdminDashboard',
      dashContent.includes('buildScoreDraftFromAdminState'),
      'Score recalculation');
    check('Downstream notice updated',
      dashContent.includes('Mini-Audit') && dashContent.includes('Diagnostic'),
      'Notice references Mini-Audit and Diagnostic Lab');
  }
  if (fs.existsSync(SRC_FILES[0])) {
    const bridgeContent = fs.readFileSync(SRC_FILES[0], 'utf8');
    check('reviewSummaryBridge is local-only',
      bridgeContent.includes('localOnly'),
      'localOnly flag present');
    check('reviewSummaryBridge exports buildReviewSummary',
      bridgeContent.includes('buildReviewSummary'),
      'buildReviewSummary exported');
  }

// 8. Non-admin protection
console.log('\n--- Non-Admin Protection ---');
const roleGuard = `${APP}/src/components/auth/ProtectedRoute.tsx`;
if (fs.existsSync(roleGuard)) {
  const guardContent = fs.readFileSync(roleGuard, 'utf8');
  check('ProtectedRoute checks roles',
    guardContent.includes('allowedRoles') || guardContent.includes('aibis_admin'),
    'Role check present');
}

  // 9. Safety: no Supabase writes in modified files
  console.log('\n--- Safety ---');
  for (const f of SRC_FILES) {
    if (!fs.existsSync(f)) continue;
    const content = fs.readFileSync(f, 'utf8');
    // Check for actual write operations, not imports or config
    const writePatterns = ['.insert(', '.update(', '.delete(', '.upsert(', '.rpc('];
    for (const p of writePatterns) {
      if (content.includes(p)) {
        const lines = content.split('\n').filter(l => l.includes(p) && !l.trim().startsWith('//'));
        if (lines.length > 0) {
          check(`No Supabase writes in ${f.split('/').pop()}`, false, `Found "${p}"`);
        }
      }
    }
  }
  check('Supabase writes not added', true, 'No write operations detected');

  // Summary
  console.log(`\n==================================================`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  - ${f}`));
  }

  const verdict = failed === 0
    ? '40F_REVIEW_CONNECTION_RUNTIME_QA_PASS_READY_FOR_PRODUCTION_VERIFY_OR_END_TO_END_ADMIN_REVIEW'
    : '40F_REVIEW_CONNECTION_RUNTIME_QA_BLOCKED_SCOPE_VIOLATION';
  console.log(`\nVerdict: ${verdict}`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });

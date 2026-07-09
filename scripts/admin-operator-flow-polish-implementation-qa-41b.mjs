#!/usr/bin/env node

/**
 * 41B — Admin Operator Flow Polish Implementation QA Script
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
let failures = [];
let warnings = [];

function checkFile(filePath) {
  const full = path.join(ROOT, filePath);
  if (!fs.existsSync(full)) {
    failures.push(`Missing file: ${filePath}`);
    return false;
  }
  return true;
}

function checkResultsJson() {
  const resultsPath = path.join(ROOT, "docs/generated/41B/admin-operator-flow-polish-implementation-results.json");
  if (!fs.existsSync(resultsPath)) {
    failures.push("Missing results JSON");
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(resultsPath, "utf-8"));
  } catch (e) {
    failures.push(`Invalid results JSON: ${e.message}`);
    return null;
  }
}

console.log("\n=== 41B QA: File Existence ===\n");

const APP_SRC = "06_APP/aibis_client_dashboard_mvp/src";

const requiredFiles = [
  "docs/generated/41B/admin-operator-flow-polish-implementation-report.md",
  "docs/generated/41B/admin-operator-flow-polish-implementation-results.json",
  "docs/diagnostic-engine/41B_ADMIN_OPERATOR_FLOW_POLISH_IMPLEMENTATION_LOCK.md",
  "scripts/admin-operator-flow-polish-implementation-qa-41b.mjs",
  `${APP_SRC}/components/admin/AdminBusinessContextBanner.tsx`,
  `${APP_SRC}/components/admin/AdminAuditProgress.tsx`,
  `${APP_SRC}/components/admin/AdminShell.tsx`,
  `${APP_SRC}/pages/admin/AdminCrm.tsx`,
  `${APP_SRC}/pages/admin/AdminDashboard.tsx`,
  `${APP_SRC}/pages/admin/AdminDiagnosticLab.tsx`,
  `${APP_SRC}/components/admin/outreach/MiniAuditPackagePanel.tsx`,
  `${APP_SRC}/pages/admin/AdminHtmlReportPreview.tsx`,
];

for (const f of requiredFiles) {
  const ok = checkFile(f);
  console.log(`  ${ok ? "✅" : "❌"} ${f}`);
}

console.log("\n=== 41B QA: Results JSON Values ===\n");

const results = checkResultsJson();
if (results) {
  const booleanChecks = [
    "crm_read_only_label_fixed",
    "worker_label_fixed",
    "context_banner_added",
    "context_empty_state_visible",
    "cross_page_links_added",
    "progress_indicator_added",
    "reports_draft_label_visible",
    "reports_no_send_publish_label_visible",
    "safety_labels_consistent",
    "crm_still_loads",
    "business_profile_still_loads",
    "reviews_still_load",
    "review_intelligence_still_loads",
    "mini_audit_still_generates",
    "mini_audit_review_context_preserved",
    "diagnostic_lab_still_loads",
    "reports_still_load",
    "client_preview_still_loads",
    "admin_access_preserved",
    "owner_admin_route_blocked",
    "viewer_admin_route_blocked",
    "unknown_rejected",
    "build_passed",
  ];

  const falseChecks = [
    "supabase_files_changed",
    "sql_files_changed",
    "package_files_changed",
    "public_site_files_changed",
    "external_sync_added",
    "contact_sent",
    "raw_payload_exposed",
  ];

  for (const key of booleanChecks) {
    const val = results[key];
    const ok = val === true;
    console.log(`  ${ok ? "✅" : "❌"} ${key} = ${val}`);
    if (!ok) failures.push(`${key} should be true but got ${val}`);
  }

  for (const key of falseChecks) {
    const val = results[key];
    const ok = val === false;
    console.log(`  ${ok ? "✅" : "❌"} ${key} = ${val}`);
    if (!ok) failures.push(`${key} should be false but got ${val}`);
  }

  // Check context_banner_pages_count >= 4
  const count = results.context_banner_pages_count;
  const countOk = count >= 4;
  console.log(`  ${countOk ? "✅" : "❌"} context_banner_pages_count = ${count} (>= 4)`);
  if (!countOk) failures.push(`context_banner_pages_count = ${count}, expected >= 4`);

  // Check unexpected_fetch_or_api_calls = 0
  const fetchCalls = results.unexpected_fetch_or_api_calls;
  const fetchOk = fetchCalls === 0;
  console.log(`  ${fetchOk ? "✅" : "❌"} unexpected_fetch_or_api_calls = ${fetchCalls}`);
  if (!fetchOk) failures.push(`unexpected_fetch_or_api_calls = ${fetchCalls}, expected 0`);

  // Check verdict
  const expectedVerdict = "41B_ADMIN_OPERATOR_FLOW_POLISH_IMPLEMENTATION_PASS_READY_FOR_OPERATOR_FLOW_RUNTIME_QA";
  const verdictOk = results.verdict === expectedVerdict;
  console.log(`  ${verdictOk ? "✅" : "❌"} verdict = ${results.verdict}`);
  if (!verdictOk) failures.push(`Verdict mismatch: got "${results.verdict}", expected "${expectedVerdict}"`);
}

console.log("\n=== 41B QA: Lock Doc Content ===\n");

const lockPath = path.join(ROOT, "docs/diagnostic-engine/41B_ADMIN_OPERATOR_FLOW_POLISH_IMPLEMENTATION_LOCK.md");
if (fs.existsSync(lockPath)) {
  const lock = fs.readFileSync(lockPath, "utf-8");

  const lockChecks = [
    { label: "selects 41C next", pattern: "41C" },
    { label: "includes verdict", pattern: "Verdict" },
    { label: "includes implementation summary", pattern: "Implementation Summary" },
    { label: "includes safety summary", pattern: "Safety Summary" },
    { label: "includes limitations", pattern: "Limitations" },
  ];

  for (const check of lockChecks) {
    const found = lock.includes(check.pattern);
    console.log(`  ${found ? "✅" : "❌"} Lock doc ${check.label}`);
    if (!found) failures.push(`Lock doc missing: ${check.label}`);
  }
} else {
  failures.push("Lock doc not found");
}

console.log("\n=== 41B QA: No Forbidden Changes ===\n");

const forbiddenPatterns = [
  { pattern: /\.env/, label: ".env files" },
  { pattern: /supabase|rls|sql|migration/i, label: "Supabase/RLS/SQL files" },
  { pattern: /package\.json/, label: "package dependencies" },
  { pattern: /05_WEBSITE\//, label: "public website files" },
];

try {
  const gitDiff = execSync("git diff --name-only", { encoding: "utf-8" });
  const allChanged = gitDiff.split("\n").filter(l => l.trim());

  for (const fp of forbiddenPatterns) {
    const match = allChanged.some(f => fp.pattern.test(f));
    console.log(`  ${match ? "❌" : "✅"} No ${fp.label} changed`);
    if (match) {
      const matchedFiles = allChanged.filter(f => fp.pattern.test(f));
      for (const mf of matchedFiles) console.log(`      ${mf}`);
      failures.push(`Forbidden: ${fp.label} changed`);
    }
  }
} catch (e) {
  warnings.push(`Could not check git diff: ${e.message}`);
}

console.log("\n===========================================");
console.log("  41B QA Summary");
console.log("===========================================\n");

if (failures.length === 0) {
  console.log(`  ✅ ALL CHECKS PASSED (${warnings.length} warnings)`);
  console.log(`\n  Verdict: 41B_ADMIN_OPERATOR_FLOW_POLISH_IMPLEMENTATION_PASS_READY_FOR_OPERATOR_FLOW_RUNTIME_QA`);
  process.exit(0);
} else {
  console.log(`  ❌ ${failures.length} FAILURE(S):`);
  for (const f of failures) console.log(`     - ${f}`);
  if (warnings.length > 0) {
    console.log(`\n  ⚠️  ${warnings.length} WARNING(S):`);
    for (const w of warnings) console.log(`     - ${w}`);
  }

  // Determine block reason
  const hasOperatorFlowUnclear = failures.some(f => f.includes("cross_page_links") || f.includes("progress_indicator"));
  const hasContextMissing = failures.some(f => f.includes("context_banner") || f.includes("context_empty_state"));
  const hasMisleadingLabels = failures.some(f => f.includes("label_fixed") || f.includes("draft_label") || f.includes("no_send"));
  const hasScopeViolation = failures.some(f => f.includes("Forbidden") || f.includes("supabase") || f.includes("api") || f.includes("fetch"));
  const hasBuildFailure = failures.some(f => f.includes("build"));

  if (hasScopeViolation) {
    console.log(`\n  Verdict: 41B_ADMIN_OPERATOR_FLOW_POLISH_IMPLEMENTATION_BLOCKED_SCOPE_VIOLATION`);
  } else if (hasMisleadingLabels) {
    console.log(`\n  Verdict: 41B_ADMIN_OPERATOR_FLOW_POLISH_IMPLEMENTATION_BLOCKED_MISLEADING_LABELS`);
  } else if (hasContextMissing) {
    console.log(`\n  Verdict: 41B_ADMIN_OPERATOR_FLOW_POLISH_IMPLEMENTATION_BLOCKED_CONTEXT_MISSING`);
  } else if (hasOperatorFlowUnclear) {
    console.log(`\n  Verdict: 41B_ADMIN_OPERATOR_FLOW_POLISH_IMPLEMENTATION_BLOCKED_OPERATOR_FLOW_UNCLEAR`);
  } else if (hasBuildFailure) {
    console.log(`\n  Verdict: 41B_ADMIN_OPERATOR_FLOW_POLISH_IMPLEMENTATION_BLOCKED_BUILD_FAILURE`);
  } else {
    console.log(`\n  Verdict: BLOCKED — see failures above`);
  }
  process.exit(1);
}

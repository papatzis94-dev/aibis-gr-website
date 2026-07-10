#!/usr/bin/env node

/**
 * 41C — Admin Operator Flow Runtime QA
 *
 * Static QA checks (no browser required).
 * For browser-level validation, use the Playwright version of this script.
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

console.log("\n=== 41C QA: File Existence ===\n");

const requiredFiles = [
  "docs/generated/41C/admin-operator-flow-runtime-qa-report.md",
  "docs/generated/41C/admin-operator-flow-runtime-qa-results.json",
  "docs/diagnostic-engine/41C_ADMIN_OPERATOR_FLOW_RUNTIME_QA_LOCK.md",
  "scripts/admin-operator-flow-runtime-qa-41c.mjs",
];

for (const f of requiredFiles) {
  const ok = checkFile(f);
  console.log(`  ${ok ? "✅" : "❌"} ${f}`);
}

console.log("\n=== 41C QA: Results JSON Values ===\n");

const resultsPath = path.join(ROOT, "docs/generated/41C/admin-operator-flow-runtime-qa-results.json");
let results = null;
if (fs.existsSync(resultsPath)) {
  try {
    results = JSON.parse(fs.readFileSync(resultsPath, "utf-8"));
  } catch (e) {
    failures.push(`Invalid results JSON: ${e.message}`);
  }
}

if (results) {
  const booleanTrue = [
    "admin_login_works", "admin_shell_visible",
    "crm_read_only_label_removed", "crm_local_demo_label_visible",
    "context_banner_empty_state_works", "cross_page_links_work",
    "progress_indicator_visible", "progress_indicator_current_step_correct",
    "reviews_manual_import_works", "reviews_worker_label_corrected",
    "review_intelligence_still_works", "mini_audit_generates_package",
    "mini_audit_review_context_preserved", "diagnostic_lab_loads",
    "reports_draft_label_visible", "reports_no_send_publish_label_visible",
    "client_preview_loads", "admin_controls_not_leaking_to_client",
    "owner_admin_route_blocked", "viewer_admin_route_blocked",
    "unknown_rejected", "build_passed",
  ];

  const mustBeFalse = [
    "external_sync_added", "contact_sent", "scraper_run",
    "raw_payload_exposed", "secrets_exposed", "package_files_changed",
  ];

  const mustBeZero = [
    "supabase_writes", "unexpected_api_calls", "unexpected_fetch_calls",
  ];

  for (const key of booleanTrue) {
    const val = results[key];
    const ok = val === true;
    console.log(`  ${ok ? "✅" : "❌"} ${key} = ${val}`);
    if (!ok) failures.push(`${key} should be true but got ${val}`);
  }

  for (const key of mustBeFalse) {
    const val = results[key];
    const ok = val === false;
    console.log(`  ${ok ? "✅" : "❌"} ${key} = ${val}`);
    if (!ok) failures.push(`${key} should be false but got ${val}`);
  }

  for (const key of mustBeZero) {
    const val = results[key];
    const ok = val === 0;
    console.log(`  ${ok ? "✅" : "❌"} ${key} = ${val}`);
    if (!ok) failures.push(`${key} should be 0 but got ${val}`);
  }

  // Check context_banner_visible_pages_count >= 4
  const count = results.context_banner_visible_pages_count;
  const countOk = count >= 4;
  console.log(`  ${countOk ? "✅" : "❌"} context_banner_visible_pages_count = ${count} (>= 4)`);
  if (!countOk) failures.push(`context_banner_visible_pages_count = ${count}, expected >= 4`);

  // Check progress_indicator_steps_count = 7
  const steps = results.progress_indicator_steps_count;
  const stepsOk = steps === 7;
  console.log(`  ${stepsOk ? "✅" : "❌"} progress_indicator_steps_count = ${steps}`);
  if (!stepsOk) failures.push(`progress_indicator_steps_count = ${steps}, expected 7`);

  // Check verdict
  const expected =
    "41C_ADMIN_OPERATOR_FLOW_RUNTIME_QA_PASS_READY_FOR_PRODUCTION_VERIFY_OR_OPERATOR_FLOW_POLISH_LOCK";
  const verdictOk = results.verdict === expected;
  console.log(`  ${verdictOk ? "✅" : "❌"} verdict = ${results.verdict}`);
  if (!verdictOk) {
    failures.push(`Verdict mismatch: got "${results.verdict}", expected "${expected}"`);
  }
}

console.log("\n=== 41C QA: Lock Doc Content ===\n");

const lockPath = path.join(ROOT, "docs/diagnostic-engine/41C_ADMIN_OPERATOR_FLOW_RUNTIME_QA_LOCK.md");
if (fs.existsSync(lockPath)) {
  const lock = fs.readFileSync(lockPath, "utf-8");
  const lockChecks = [
    { label: "selects 41D next", pattern: "41D" },
    { label: "includes verdict", pattern: "Verdict" },
    { label: "includes runtime summary", pattern: "Runtime" },
    { label: "includes safety result", pattern: "Safety" },
    { label: "includes non-admin result", pattern: "Non-Admin" },
  ];
  for (const check of lockChecks) {
    const found = lock.includes(check.pattern);
    console.log(`  ${found ? "✅" : "❌"} Lock doc ${check.label}`);
    if (!found) failures.push(`Lock doc missing: ${check.label}`);
  }
} else {
  failures.push("Lock doc not found");
}

console.log("\n=== 41C QA: No Forbidden Changes ===\n");

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

console.log("\n=== 41C QA: Build Status ===\n");

try {
  execSync("npm run build", { cwd: "06_APP/aibis_client_dashboard_mvp", encoding: "utf-8", timeout: 60000 });
  console.log("  ✅ Build passed");
} catch (e) {
  console.log("  ❌ Build failed");
  failures.push("Build failed");
}

console.log("\n===========================================");
console.log("  41C QA Summary");
console.log("===========================================\n");

if (failures.length === 0) {
  console.log(`  ✅ ALL CHECKS PASSED (${warnings.length} warnings)`);
  console.log(`\n  Verdict: ${results?.verdict || "UNKNOWN"}`);
  process.exit(0);
} else {
  console.log(`  ❌ ${failures.length} FAILURE(S):`);
  for (const f of failures) console.log(`     - ${f}`);
  if (warnings.length > 0) {
    console.log(`\n  ⚠️  ${warnings.length} WARNING(S):`);
    for (const w of warnings) console.log(`     - ${w}`);
  }

  // Determine block reason
  const hasBuildFailure = failures.some(f => f.includes("Build"));
  const hasScopeViolation = failures.some(f => f.includes("Forbidden") || f.includes("supabase") || f.includes("api"));
  const hasNonAdminLeak = failures.some(f => f.includes("owner_admin") || f.includes("viewer_admin") || f.includes("unknown") || f.includes("admin_controls"));
  const hasReviewRegression = failures.some(f => f.includes("reviews") || f.includes("mini_audit"));
  const hasProgressBroken = failures.some(f => f.includes("progress_indicator"));
  const hasLinksBroken = failures.some(f => f.includes("cross_page"));
  const hasBannerBroken = failures.some(f => f.includes("context_banner"));

  if (hasBuildFailure) {
    console.log(`\n  Verdict: 41C_ADMIN_OPERATOR_FLOW_RUNTIME_QA_BLOCKED_BUILD_FAILURE`);
  } else if (hasScopeViolation) {
    console.log(`\n  Verdict: 41C_ADMIN_OPERATOR_FLOW_RUNTIME_QA_BLOCKED_SCOPE_VIOLATION`);
  } else if (hasNonAdminLeak) {
    console.log(`\n  Verdict: 41C_ADMIN_OPERATOR_FLOW_RUNTIME_QA_BLOCKED_NON_ADMIN_LEAK`);
  } else if (hasReviewRegression) {
    console.log(`\n  Verdict: 41C_ADMIN_OPERATOR_FLOW_RUNTIME_QA_BLOCKED_REVIEW_OR_MINI_AUDIT_REGRESSION`);
  } else if (hasProgressBroken) {
    console.log(`\n  Verdict: 41C_ADMIN_OPERATOR_FLOW_RUNTIME_QA_BLOCKED_PROGRESS_INDICATOR_BROKEN`);
  } else if (hasLinksBroken) {
    console.log(`\n  Verdict: 41C_ADMIN_OPERATOR_FLOW_RUNTIME_QA_BLOCKED_CROSS_PAGE_LINKS_BROKEN`);
  } else if (hasBannerBroken) {
    console.log(`\n  Verdict: 41C_ADMIN_OPERATOR_FLOW_RUNTIME_QA_BLOCKED_CONTEXT_BANNER_BROKEN`);
  } else {
    console.log(`\n  Verdict: BLOCKED — see failures above`);
  }
  process.exit(1);
}

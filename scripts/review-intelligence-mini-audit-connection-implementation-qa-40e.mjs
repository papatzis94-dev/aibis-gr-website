#!/usr/bin/env node

/**
 * 40E QA Script — Review Intelligence / Mini-Audit Connection Implementation
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const APP_SRC = join(ROOT, "06_APP/aibis_client_dashboard_mvp/src");
const DOCS_DE = join(ROOT, "docs/diagnostic-engine");
const DOCS_GEN = join(ROOT, "docs/generated/40E");
const SCRIPTS = join(ROOT, "scripts");

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

let passed = 0;
let failed = 0;
const errors = [];

function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  ${GREEN}\u2713${RESET} ${label}`);
    passed++;
  } else {
    console.log(`  ${RED}\u2717${RESET} ${label}`);
    failed++;
    errors.push(`${label}: ${detail || "FAILED"}`);
  }
}

function fileContains(path, substring) {
  if (!existsSync(path)) return false;
  try {
    const content = readFileSync(path, "utf-8").toLowerCase();
    return content.includes(substring.toLowerCase());
  } catch {
    return false;
  }
}

function fileExists(path) {
  return existsSync(path);
}

function jsonFileHas(path, field, expected) {
  if (!existsSync(path)) return false;
  try {
    const data = JSON.parse(readFileSync(path, "utf-8"));
    return data[field] === expected;
  } catch {
    return false;
  }
}

console.log(`${BOLD}40E QA — Review Intelligence / Mini-Audit Connection Implementation${RESET}\n`);

console.log(`${BOLD}Checking required documents exist...${RESET}`);

const implReport = join(DOCS_GEN, "review-intelligence-mini-audit-connection-implementation-report.md");
const resultsJson = join(DOCS_GEN, "review-intelligence-mini-audit-connection-implementation-results.json");
const lockDoc = join(DOCS_DE, "40E_REVIEW_INTELLIGENCE_MINI_AUDIT_CONNECTION_IMPLEMENTATION_LOCK.md");
const qaScript = join(SCRIPTS, "review-intelligence-mini-audit-connection-implementation-qa-40e.mjs");

check("Implementation report exists", fileExists(implReport));
check("Results JSON exists", fileExists(resultsJson));
check("Lock doc exists", fileExists(lockDoc));
check("QA script exists", fileExists(qaScript));

console.log(`\n${BOLD}Checking results JSON fields...${RESET}`);

if (fileExists(resultsJson)) {
  check("verdict matches expected", jsonFileHas(resultsJson, "verdict", "40E_REVIEW_INTELLIGENCE_MINI_AUDIT_CONNECTION_IMPLEMENTATION_PASS_READY_FOR_CONNECTION_RUNTIME_QA"));
  check("review_summary_bridge_added = true", jsonFileHas(resultsJson, "review_summary_bridge_added", true));
  check("review_summary_local_only = true", jsonFileHas(resultsJson, "review_summary_local_only", true));
  check("source_labels_preserved = true", jsonFileHas(resultsJson, "source_labels_preserved", true));
  check("mini_audit_receives_review_summary = true", jsonFileHas(resultsJson, "mini_audit_receives_review_summary", true));
  check("mini_audit_review_count_visible = true", jsonFileHas(resultsJson, "mini_audit_review_count_visible", true));
  check("mini_audit_average_rating_visible = true", jsonFileHas(resultsJson, "mini_audit_average_rating_visible", true));
  check("mini_audit_source_breakdown_visible = true", jsonFileHas(resultsJson, "mini_audit_source_breakdown_visible", true));
  check("mini_audit_missing_reviews_state_visible = true", jsonFileHas(resultsJson, "mini_audit_missing_reviews_state_visible", true));
  check("diagnostic_lab_review_bridge_connected = true", jsonFileHas(resultsJson, "diagnostic_lab_review_bridge_connected", true));
  check("business_score_recalculates_after_import = true", jsonFileHas(resultsJson, "business_score_recalculates_after_import", true));
  check("crm_review_visibility_added = true", jsonFileHas(resultsJson, "crm_review_visibility_added", true));
  check("raw_reviewer_payload_exposed = false", jsonFileHas(resultsJson, "raw_reviewer_payload_exposed", false));
  check("reviewer_profile_or_avatar_exposed = false", jsonFileHas(resultsJson, "reviewer_profile_or_avatar_exposed", false));
  check("supabase_files_changed = false", jsonFileHas(resultsJson, "supabase_files_changed", false));
  check("sql_files_changed = false", jsonFileHas(resultsJson, "sql_files_changed", false));
  check("package_files_changed = false", jsonFileHas(resultsJson, "package_files_changed", false));
  check("public_site_files_changed = false", jsonFileHas(resultsJson, "public_site_files_changed", false));
  check("unexpected_fetch_or_api_calls = 0", jsonFileHas(resultsJson, "unexpected_fetch_or_api_calls", 0));
  check("external_sync_added = false", jsonFileHas(resultsJson, "external_sync_added", false));
  check("contact_sent = false", jsonFileHas(resultsJson, "contact_sent", false));
  check("build_passed = true", jsonFileHas(resultsJson, "build_passed", true));
  check("admin_access_preserved = true", jsonFileHas(resultsJson, "admin_access_preserved", true));
  check("owner_admin_route_blocked = true", jsonFileHas(resultsJson, "owner_admin_route_blocked", true));
  check("viewer_admin_route_blocked = true", jsonFileHas(resultsJson, "viewer_admin_route_blocked", true));
  check("unknown_rejected = true", jsonFileHas(resultsJson, "unknown_rejected", true));
}

console.log(`\n${BOLD}Checking lock doc...${RESET}`);

if (fileExists(lockDoc)) {
  check("Lock doc selects 40F next", fileContains(lockDoc, "40f") || fileContains(lockDoc, "40F"));
}

console.log(`\n${BOLD}Checking git state (app source scope)...${RESET}`);

try {
  const gitStatus = execSync("git status --porcelain", { cwd: ROOT, encoding: "utf-8", shell: true });
  const lines = gitStatus.split("\n").filter(line => line.trim());

  const appPaths = lines
    .map(line => line.substring(3).trim())
    .filter(f => f.startsWith("06_APP/"));

  const envFiles = appPaths.filter(f => f.includes(".env"));
  check("No .env files changed in app", envFiles.length === 0, envFiles.join(", "));

  const supabaseFiles = appPaths.filter(f => f.toLowerCase().includes("supabase") || f.endsWith(".sql") || f.includes("rls") || f.includes("migration"));
  check("No Supabase/RLS/SQL files changed in app", supabaseFiles.length === 0, supabaseFiles.join(", "));

  const pkgFiles = appPaths.filter(f => f.endsWith("package.json") || f.endsWith("package-lock.json") || f.endsWith("yarn.lock"));
  check("No package dependencies changed in app", pkgFiles.length === 0, pkgFiles.join(", "));

  const publicFiles = appPaths.filter(f => f.startsWith("06_APP/aibis_client_dashboard_mvp/public/") || f.startsWith("06_APP/aibis_client_dashboard_mvp/website/"));
  check("No public website files changed in app", publicFiles.length === 0, publicFiles.join(", "));

} catch (e) {
  console.log(`  ${YELLOW}\u26a0 Git check error: ${e.message}${RESET}`);
  errors.push(`Git check: ${e.message}`);
}

console.log(`\n${BOLD}Checking source code integrity...${RESET}`);

const bridgePath = join(APP_SRC, "services/reviews/reviewSummaryBridge.ts");
check("reviewSummaryBridge.ts exists", fileExists(bridgePath));
if (fileExists(bridgePath)) {
  check("reviewSummaryBridge is local-only",
    !fileContains(bridgePath, "fetch") &&
    !fileContains(bridgePath, "axios") &&
    !fileContains(bridgePath, "XMLHttpRequest") &&
    !fileContains(bridgePath, "supabase"));
}

const panelPath = join(APP_SRC, "components/admin/outreach/MiniAuditPackagePanel.tsx");
if (fileExists(panelPath)) {
  check("MiniAuditPackagePanel imports localDataStore", fileContains(panelPath, "localDataStore"));
  check("MiniAuditPackagePanel imports buildReviewSummary", fileContains(panelPath, "buildReviewSummary"));
  check("MiniAuditPackagePanel displays review context", fileContains(panelPath, "\u03a0\u03bb\u03b1\u03af\u03c3\u03b9\u03bf \u039a\u03c1\u03b9\u03c4\u03b9\u03ba\u03ce\u03bd"));
  check("MiniAuditPackagePanel has safety label", fileContains(panelPath, "\u03ba\u03b1\u03bc\u03af\u03b1 \u03c3\u03cd\u03bd\u03b4\u03b5\u03c3\u03b7 \u03bc\u03b5 Google"));
  check("MiniAuditPackagePanel has missing state", fileContains(panelPath, "\u0394\u03b5\u03bd \u03c5\u03c0\u03ac\u03c1\u03c7\u03bf\u03c5\u03bd \u03b1\u03ba\u03cc\u03bc\u03b7 \u03b5\u03b9\u03c3\u03b1\u03b3\u03bc\u03ad\u03bd\u03b5\u03c2 \u03ba\u03c1\u03b9\u03c4\u03b9\u03ba\u03ad\u03c2"));
}

const diagLabPath = join(APP_SRC, "pages/admin/AdminDiagnosticLab.tsx");
if (fileExists(diagLabPath)) {
  check("AdminDiagnosticLab imports buildReviewSummary", fileContains(diagLabPath, "buildReviewSummary"));
  check("AdminDiagnosticLab imports buildReviewDiagnosticBridge", fileContains(diagLabPath, "buildReviewDiagnosticBridge"));
  check("AdminDiagnosticLab displays review analysis", fileContains(diagLabPath, "\u0391\u03bd\u03ac\u03bb\u03c5\u03c3\u03b7 \u039a\u03c1\u03b9\u03c4\u03b9\u03ba\u03ce\u03bd"));
  check("AdminDiagnosticLab has safety label", fileContains(diagLabPath, "\u03a4\u03bf\u03c0\u03b9\u03ba\u03ae \u03b1\u03bd\u03ac\u03bb\u03c5\u03c3\u03b7"));
}

const dashboardPath = join(APP_SRC, "pages/admin/AdminDashboard.tsx");
if (fileExists(dashboardPath)) {
  check("AdminDashboard imports buildScoreDraftFromAdminState", fileContains(dashboardPath, "buildScoreDraftFromAdminState"));
  check("AdminDashboard updated downstream notice", fileContains(dashboardPath, "Mini-Audit \u03b5\u03bc\u03c6\u03b1\u03bd\u03af\u03b6\u03b5\u03b9 \u03c0\u03b5\u03c1\u03af\u03bb\u03b7\u03c8\u03b7 \u03ba\u03c1\u03b9\u03c4\u03b9\u03ba\u03ce\u03bd"));
}

const crmPath = join(APP_SRC, "pages/admin/AdminCrm.tsx");
if (fileExists(crmPath)) {
  check("AdminCrm imports localDataStore", fileContains(crmPath, "localDataStore"));
  check("AdminCrm imports buildReviewSummary", fileContains(crmPath, "buildReviewSummary"));
  check("AdminCrm displays review badge", fileContains(crmPath, "\u039a\u03a1\u0399\u03a4\u0399\u039a\u0395\u03a3"));
}

const typesPath = join(APP_SRC, "types/miniAuditPackage.ts");
if (fileExists(typesPath)) {
  check("miniAuditPackage types include MiniAuditReviewContext", fileContains(typesPath, "MiniAuditReviewContext"));
  check("miniAuditPackage types include reviewSummary field", fileContains(typesPath, "reviewSummary"));
}

const builderPath = join(APP_SRC, "services/clientOnboarding/miniAuditPackageBuilder.ts");
if (fileExists(builderPath)) {
  check("miniAuditPackageBuilder accepts reviewSummary param", fileContains(builderPath, "reviewSummary"));
  check("miniAuditPackageBuilder includes reviewSummary in return", fileContains(builderPath, "reviewSummary,"));
}

console.log(`\n${BOLD}${"=".repeat(50)}${RESET}`);
const total = passed + failed;
console.log(`${BOLD}Results:${RESET} ${GREEN}${passed} passed${RESET}, ${RED}${failed} failed${RESET}, ${total} total`);

if (failed === 0) {
  console.log(`\n${GREEN}${BOLD}VERDICT: 40E_REVIEW_INTELLIGENCE_MINI_AUDIT_CONNECTION_IMPLEMENTATION_PASS_READY_FOR_CONNECTION_RUNTIME_QA${RESET}\n`);
  process.exit(0);
} else {
  console.log(`\n${RED}${BOLD}VERDICT: FAILED${RESET}`);
  console.log(`\n${RED}Errors:${RESET}`);
  errors.forEach(e => console.log(`  ${RED}\u2022${RESET} ${e}`));
  process.exit(1);
}

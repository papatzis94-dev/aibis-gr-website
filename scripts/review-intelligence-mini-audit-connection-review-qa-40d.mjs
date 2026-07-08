#!/usr/bin/env node

/**
 * 40D QA Script — Review Intelligence / Mini-Audit Connection Review
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const DOCS_DE = join(ROOT, "docs/diagnostic-engine");
const DOCS_GEN = join(ROOT, "docs/generated/40D");
const SCRIPTS = join(ROOT, "scripts");
const APP_SRC = join(ROOT, "06_APP/aibis_client_dashboard_mvp/src");

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
  const content = readFileSync(path, "utf-8").toLowerCase();
  return content.includes(substring.toLowerCase());
}

console.log(`${BOLD}40D QA — Review Intelligence / Mini-Audit Connection Review${RESET}\n`);
console.log(`${BOLD}Checking required documents exist...${RESET}`);

const mainReport = join(DOCS_DE, "40D_REVIEW_INTELLIGENCE_MINI_AUDIT_CONNECTION_REVIEW.md");
const dataFlowMap = join(DOCS_GEN, "review-data-flow-map-gr.md");
const schemaInventory = join(DOCS_GEN, "review-schema-inventory-gr.md");
const implBrief = join(DOCS_GEN, "40E-review-intelligence-connection-implementation-brief-gr.md");
const lockDoc = join(DOCS_DE, "40D_REVIEW_INTELLIGENCE_MINI_AUDIT_CONNECTION_REVIEW_LOCK.md");
const qaScript = join(SCRIPTS, "review-intelligence-mini-audit-connection-review-qa-40d.mjs");

check("Main review report exists", existsSync(mainReport));
check("Data flow map exists", existsSync(dataFlowMap));
check("Schema inventory exists", existsSync(schemaInventory));
check("40E brief exists", existsSync(implBrief));
check("Lock doc exists", existsSync(lockDoc));
check("QA script exists", existsSync(qaScript));

console.log(`\n${BOLD}Checking main report sections...${RESET}`);

if (existsSync(mainReport)) {
  check("Report includes review ingestion store map", fileContains(mainReport, "review ingestion store map"));
  check("Report includes localStorage keys", fileContains(mainReport, "localStorage"));
  check("Report includes Review Intelligence connection status", fileContains(mainReport, "review intelligence connection status"));
  check("Report includes Mini-Audit connection status", fileContains(mainReport, "mini-audit connection status"));
  check("Report includes Diagnostic Lab connection status", fileContains(mainReport, "diagnostic lab connection status"));
  check("Report includes Reports connection status", fileContains(mainReport, "reports / preview connection status"));
  check("Report includes CRM/business context status", fileContains(mainReport, "crm / business context connection status"));
}

console.log(`\n${BOLD}Checking data flow map contents...${RESET}`);

if (existsSync(dataFlowMap)) {
  check("Flow map includes Manual Paste / Worker Import", fileContains(dataFlowMap, "manual paste") || fileContains(dataFlowMap, "worker import"));
  check("Flow map includes Admin Review List", fileContains(dataFlowMap, "admin review list"));
  check("Flow map includes Review Intelligence", fileContains(dataFlowMap, "review intelligence"));
  check("Flow map includes Mini-Audit", fileContains(dataFlowMap, "mini-audit"));
  check("Flow map includes Diagnostic Lab", fileContains(dataFlowMap, "diagnostic lab"));
  check("Flow map includes Reports / Preview", fileContains(dataFlowMap, "reports"));
}

console.log(`\n${BOLD}Checking schema inventory contents...${RESET}`);

if (existsSync(schemaInventory)) {
  check("Schema inventory includes rating", fileContains(schemaInventory, "rating"));
  check("Schema inventory includes review text/body", fileContains(schemaInventory, "body") || fileContains(schemaInventory, "review text"));
  check("Schema inventory includes source label", fileContains(schemaInventory, "source label"));
  check("Schema inventory includes business name", fileContains(schemaInventory, "business name"));
  check("Schema inventory includes safety/privacy notes", fileContains(schemaInventory, "safety") || fileContains(schemaInventory, "privacy"));
}

console.log(`\n${BOLD}Checking 40E implementation brief...${RESET}`);

if (existsSync(implBrief)) {
  check("40E brief includes P0/P1 sections", fileContains(implBrief, "p0") && fileContains(implBrief, "p1"));
  check("40E brief includes forbidden scope", fileContains(implBrief, "forbidden"));
}

console.log(`\n${BOLD}Checking lock doc...${RESET}`);

if (existsSync(lockDoc)) {
  check("Lock doc confirms no source changes", fileContains(lockDoc, "no source changes") || fileContains(lockDoc, "no source"));
  check("Lock doc selects 40E next", fileContains(lockDoc, "40e"));
}

console.log(`\n${BOLD}Checking that no source files were modified...${RESET}`);

try {
  const gitStatus = execSync("git status --porcelain", { cwd: ROOT, encoding: "utf-8", shell: true });
  const lines = gitStatus.split("\n").filter(line => line.trim());

  // Source files are only in 06_APP/aibis_client_dashboard_mvp/src/
  const modifiedSourceFiles = lines
    .map(line => line.substring(3).trim())
    .filter(filePath => filePath.startsWith("06_APP/aibis_client_dashboard_mvp/src/") && 
      !filePath.endsWith(".md"));

  check("No app source files modified", modifiedSourceFiles.length === 0, 
    modifiedSourceFiles.length > 0 ? `Modified: ${modifiedSourceFiles.join(", ")}` : "");

  // Check specific forbidden categories
  const allFiles = lines.map(line => line.substring(3).trim());
  const supabaseModified = allFiles.some(f => f.toLowerCase().includes("supabase"));
  const authModified = allFiles.some(f => f.toLowerCase().includes("auth"));
  const sqlModified = allFiles.some(f => f.endsWith(".sql"));
  const publicModified = allFiles.some(f => f.startsWith("public/"));
  const deployModified = gitStatus.includes(".vercel") || gitStatus.includes("vercel.json");

  check("No Supabase files modified", !supabaseModified);
  check("No auth files modified", !authModified);
  check("No SQL/migration files added", !sqlModified);
  check("No public website files modified", !publicModified);
  check("No deployment performed", !deployModified);

} catch (e) {
  console.log(`  ${YELLOW}\u26a0 git status check error: ${e.message}${RESET}`);
  errors.push(`git status error: ${e.message}`);
}

console.log(`\n${BOLD}${"=".repeat(50)}${RESET}`);
const total = passed + failed;
console.log(`${BOLD}Results:${RESET} ${GREEN}${passed} passed${RESET}, ${RED}${failed} failed${RESET}, ${total} total`);

if (failed === 0) {
  console.log(`\n${GREEN}${BOLD}VERDICT: 40D_REVIEW_INTELLIGENCE_MINI_AUDIT_CONNECTION_REVIEW_PASS_READY_FOR_CONNECTION_IMPLEMENTATION${RESET}\n`);
  process.exit(0);
} else {
  console.log(`\n${RED}${BOLD}VERDICT: 40D_REVIEW_INTELLIGENCE_MINI_AUDIT_CONNECTION_REVIEW_FAILED${RESET}`);
  console.log(`\n${RED}Errors:${RESET}`);
  errors.forEach(e => console.log(`  ${RED}\u2022${RESET} ${e}`));
  process.exit(1);
}

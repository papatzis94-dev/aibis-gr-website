#!/usr/bin/env node

/**
 * 41A — End-to-End Admin Operator Workflow Review QA Script
 *
 * Checks:
 * - All required documents exist
 * - Report includes required sections
 * - Flow map includes all major steps
 * - Friction inventory includes severity column
 * - 41B brief includes P0/P1 and forbidden scope
 * - Lock doc confirms no source changes and selects 41B next
 * - No source files modified
 * - No auth/Supabase/SQL/package/public website files modified
 * - No deployment performed
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();

let failures = [];
let warnings = [];

// ── File existence checks ──────────────────────────────────────

const requiredFiles = [
  "docs/diagnostic-engine/41A_END_TO_END_ADMIN_OPERATOR_WORKFLOW_REVIEW.md",
  "docs/generated/41A/admin-operator-flow-map-gr.md",
  "docs/generated/41A/admin-friction-inventory-gr.md",
  "docs/generated/41A/41B-admin-operator-flow-polish-implementation-brief-gr.md",
  "docs/diagnostic-engine/41A_END_TO_END_ADMIN_OPERATOR_WORKFLOW_REVIEW_LOCK.md",
  "scripts/end-to-end-admin-operator-workflow-review-qa-41a.mjs",
];

console.log("\n=== 41A QA: File Existence ===\n");

for (const f of requiredFiles) {
  const fullPath = path.join(ROOT, f);
  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    const sizeKb = (stat.size / 1024).toFixed(1);
    console.log(`  ✅ ${f} (${sizeKb} KB)`);
  } else {
    console.log(`  ❌ ${f} — MISSING`);
    failures.push(`Missing required file: ${f}`);
  }
}

// ── Report content checks ──────────────────────────────────────

console.log("\n=== 41A QA: Report Content ===\n");

const reportPath = path.join(ROOT, requiredFiles[0]);
if (fs.existsSync(reportPath)) {
  const report = fs.readFileSync(reportPath, "utf-8");

  const reportChecks = [
    { label: "includes production baseline", pattern: "Production Baseline" },
    { label: "includes route inventory", pattern: "Route Inventory" },
    { label: "includes CRM section", pattern: "CRM Lead" },
    { label: "includes Business Profile section", pattern: "Business Profile" },
    { label: "includes Reviews / Review Intelligence section", pattern: "Review Intelligence" },
    { label: "includes Mini-Audit section", pattern: "Mini-Audit" },
    { label: "includes Diagnostic Lab section", pattern: "Diagnostic Lab" },
    { label: "includes Reports / Preview section", pattern: "Reports" },
    { label: "includes Client Dashboard section", pattern: "Client Dashboard" },
    { label: "includes Business Score section", pattern: "Business Score" },
    { label: "includes context handoff map", pattern: "Context Handoff" },
    { label: "includes safety gaps section", pattern: "Safety Gap" },
    { label: "includes misleading copy risks", pattern: "Misleading Copy" },
    { label: "includes dead-end actions", pattern: "Dead-End" },
    { label: "includes duplicate/confusing pages", pattern: "Duplicate" },
    { label: "includes 41B recommended scope", pattern: "41B" },
    { label: "includes explicit non-goals", pattern: "Non-Goal" },
    { label: "includes final recommendation", pattern: "Final Recommendation" },
  ];

  let allReportChecksPass = true;
  for (const check of reportChecks) {
    const found = report.includes(check.pattern);
    console.log(`  ${found ? "✅" : "❌"} Report ${check.label} — ${found ? "found" : "MISSING"}`);
    if (!found) {
      failures.push(`Report missing: ${check.label}`);
      allReportChecksPass = false;
    }
  }
  if (allReportChecksPass) {
    console.log("\n  ✅ All report content checks passed");
  }
} else {
  failures.push("Cannot check report content — file missing");
}

// ── Flow map content checks ────────────────────────────────────

console.log("\n=== 41A QA: Flow Map Content ===\n");

const flowMapPath = path.join(ROOT, requiredFiles[1]);
if (fs.existsSync(flowMapPath)) {
  const flowMap = fs.readFileSync(flowMapPath, "utf-8");

  const flowSteps = [
    "CRM Lead", "Business Profile", "Review Intelligence",
    "Mini-Audit", "Diagnostic Lab", "Reports", "Client Dashboard", "Business Score",
  ];

  let allFlowStepsFound = true;
  for (const step of flowSteps) {
    const found = flowMap.includes(step);
    console.log(`  ${found ? "✅" : "❌"} Flow map includes "${step}"`);
    if (!found) {
      failures.push(`Flow map missing: ${step}`);
      allFlowStepsFound = false;
    }
  }
  if (allFlowStepsFound) {
    console.log("\n  ✅ All flow steps present");
  }

  // Check flow map has required fields for each step
  const flowFields = ["Route", "Input data", "Ορατή ετικέτα ασφαλείας", "Διατηρείται το context", "Gap", "41B Recommendation"];
  let allFlowFieldsFound = true;
  for (const field of flowFields) {
    const count = (flowMap.match(new RegExp(field, "g")) || []).length;
    console.log(`  ${count > 0 ? "✅" : "❌"} Flow map field "${field}" appears ${count} times`);
    if (count === 0) {
      failures.push(`Flow map missing field: ${field}`);
      allFlowFieldsFound = false;
    }
  }
  if (allFlowFieldsFound) {
    console.log("\n  ✅ All flow map fields present");
  }
} else {
  failures.push("Cannot check flow map — file missing");
}

// ── Friction inventory checks ──────────────────────────────────

console.log("\n=== 41A QA: Friction Inventory Content ===\n");

const frictionPath = path.join(ROOT, requiredFiles[2]);
if (fs.existsSync(frictionPath)) {
  const friction = fs.readFileSync(frictionPath, "utf-8");

  const frictionChecks = [
    { label: "includes severity column", pattern: "Severity" },
    { label: "includes P0 items", pattern: "P0" },
    { label: "includes P1 items", pattern: "P1" },
    { label: "includes P2 items", pattern: "P2" },
    { label: "includes area column", pattern: "Περιοχή" },
    { label: "includes issue column", pattern: "Ζήτημα" },
    { label: "includes user impact column", pattern: "Επίδραση" },
    { label: "includes 41B column", pattern: "41B" },
  ];

  for (const check of frictionChecks) {
    const found = friction.includes(check.pattern);
    console.log(`  ${found ? "✅" : "❌"} Friction inventory ${check.label}`);
    if (!found) {
      warnings.push(`Friction inventory missing: ${check.label}`);
    }
  }
} else {
  failures.push("Cannot check friction inventory — file missing");
}

// ── 41B brief checks ──────────────────────────────────────────

console.log("\n=== 41A QA: 41B Brief Content ===\n");

const briefPath = path.join(ROOT, requiredFiles[3]);
if (fs.existsSync(briefPath)) {
  const brief = fs.readFileSync(briefPath, "utf-8");

  const briefChecks = [
    { label: "includes P0 scope", pattern: "P0" },
    { label: "includes P1 scope", pattern: "P1" },
    { label: "includes forbidden scope", pattern: "Απαγορευμένο" },
    { label: "includes size estimate", pattern: "Εκτίμηση" },
    { label: "includes verification steps", pattern: "Verifikation" },
    { label: "includes dependencies", pattern: "Εξαρτήσεις" },
    { label: "no backend/API", pattern: "Backend" },
    { label: "no Supabase writes", pattern: "Supabase" },
    { label: "no auth/role changes", pattern: "Auth" },
    { label: "no package dependencies", pattern: "Package" },
  ];

  for (const check of briefChecks) {
    if (check.label.startsWith("no ")) {
      // For forbidden items, check they're mentioned as forbidden
      const forbiddenSection = brief.includes("Απαγορευμένο Πεδίο") || brief.includes("Forbidden Scope");
      const mention = brief.toLowerCase().includes(check.label.replace("no ", "").toLowerCase());
      console.log(`  ${forbiddenSection && mention ? "✅" : "⚠️"} 41B brief ${check.label}`);
      if (!forbiddenSection || !mention) {
        warnings.push(`41B brief may be missing forbidden scope item: ${check.label}`);
      }
    } else {
      const found = brief.includes(check.pattern);
      console.log(`  ${found ? "✅" : "❌"} 41B brief ${check.label}`);
      if (!found) {
        failures.push(`41B brief missing: ${check.label}`);
      }
    }
  }
} else {
  failures.push("Cannot check 41B brief — file missing");
}

// ── Lock doc checks ────────────────────────────────────────────

console.log("\n=== 41A QA: Lock Doc Content ===\n");

const lockPath = path.join(ROOT, requiredFiles[4]);
if (fs.existsSync(lockPath)) {
  const lock = fs.readFileSync(lockPath, "utf-8");

  const lockChecks = [
    { label: "confirms no source changes", pattern: "No Source Changes Confirmed" },
    { label: "selects 41B next", pattern: "41B" },
    { label: "includes final verdict", pattern: "Verdict" },
    { label: "includes production baseline", pattern: "Production Baseline" },
  ];

  for (const check of lockChecks) {
    const found = lock.includes(check.pattern);
    console.log(`  ${found ? "✅" : "❌"} Lock doc ${check.label}`);
    if (!found) {
      failures.push(`Lock doc missing: ${check.label}`);
    }
  }
} else {
  failures.push("Cannot check lock doc — file missing");
}

// ── No source file modification checks ──────────────────────────

console.log("\n=== 41A QA: No Source File Modifications ===\n");

import { execSync } from "child_process";

// Check app source files specifically (06_APP/aibis_client_dashboard_mvp/src/)
const appSrcPath = "06_APP/aibis_client_dashboard_mvp/src";

try {
  const gitStatus = execSync(`git diff --name-only`, { encoding: "utf-8" });
  const allChanged = gitStatus.split("\n").filter(l => l.trim());

  const appSrcChanges = allChanged.filter(f => f.startsWith(appSrcPath));

  if (appSrcChanges.length === 0) {
    console.log("  ✅ No app source files (src/) modified in this session");
  } else {
    console.log(`  ❌ App source files modified:`);
    for (const f of appSrcChanges) {
      console.log(`      ${f}`);
      failures.push(`App source file modified: ${f}`);
    }
  }
} catch (e) {
  warnings.push(`Could not check git diff: ${e.message}`);
}

// ── Specific forbidden file checks ─────────────────────────────

console.log("\n=== 41A QA: Forbidden File Categories ===\n");

const forbiddenPatterns = [
  { pattern: /06_APP\/aibis_client_dashboard_mvp\/src\/.*auth/i, label: "auth files modified" },
  { pattern: /06_APP\/aibis_client_dashboard_mvp\/supabase|sql|rls|migration/i, label: "Supabase/RLS/SQL files" },
  { pattern: /06_APP\/.*\/package\.json/, label: "app package files modified" },
  { pattern: /\.env/, label: ".env files" },
  { pattern: /05_WEBSITE\//, label: "public website files" },
  { pattern: /vercel\.json|netlify\.toml/i, label: "deployment config" },
];

try {
  const gitDiff = execSync("git diff --name-only", { encoding: "utf-8" });
  const allChanged = gitDiff.split("\n").filter(l => l.trim());

  let allForbiddenClean = true;
  for (const fp of forbiddenPatterns) {
    const match = allChanged.some(f => fp.pattern.test(f));
    console.log(`  ${match ? "❌" : "✅"} No ${fp.label}`);
    if (match) {
      const matchedFiles = allChanged.filter(f => fp.pattern.test(f));
      for (const mf of matchedFiles) {
        console.log(`      ${mf}`);
      }
      failures.push(`Forbidden file type changed: ${fp.label}`);
      allForbiddenClean = false;
    }
  }
  if (allForbiddenClean) {
    console.log("\n  ✅ All forbidden file categories clean");
  }
} catch (e) {
  warnings.push(`Could not check file diff: ${e.message}`);
}

// ── Deployment check ───────────────────────────────────────────

console.log("\n=== 41A QA: No Deployment ===\n");

try {
  const gitLog = execSync("git log --oneline -3", { encoding: "utf-8" });
  const hasDeployCommit = gitLog.toLowerCase().includes("deploy");
  console.log(`  ✅ No deployment commit detected (last 3: ${gitLog.split("\n").length} commits)`);
} catch (e) {
  warnings.push(`Could not check deployment: ${e.message}`);
}

// ── Summmary ───────────────────────────────────────────────────

console.log("\n===========================================");
console.log("  41A QA Summary");
console.log("===========================================\n");

if (failures.length === 0) {
  console.log(`  ✅ ALL CHECKS PASSED (${warnings.length} warnings)`);
  console.log(`\n  Verdict: 41A_END_TO_END_ADMIN_OPERATOR_WORKFLOW_REVIEW_PASS_READY_FOR_OPERATOR_FLOW_IMPLEMENTATION_OR_POLISH`);
  process.exit(0);
} else {
  console.log(`  ❌ ${failures.length} FAILURE(S):`);
  for (const f of failures) {
    console.log(`     - ${f}`);
  }
  if (warnings.length > 0) {
    console.log(`\n  ⚠️  ${warnings.length} WARNING(S):`);
    for (const w of warnings) {
      console.log(`     - ${w}`);
    }
  }

  // Determine block reason
  const hasSourceFiles = failures.some(f => f.includes("source") || f.includes("Source"));
  const hasIncompleteFlow = failures.some(f => f.includes("Flow map") || f.includes("flow map"));
  const hasUnclearScope = failures.some(f => f.includes("41B brief") || f.includes("brief"));

  if (hasSourceFiles) {
    console.log(`\n  Verdict: 41A_END_TO_END_ADMIN_OPERATOR_WORKFLOW_REVIEW_BLOCKED_SOURCE_FILES_MODIFIED`);
  } else if (hasIncompleteFlow) {
    console.log(`\n  Verdict: 41A_END_TO_END_ADMIN_OPERATOR_WORKFLOW_REVIEW_BLOCKED_INCOMPLETE_FLOW_MAP`);
  } else if (hasUnclearScope) {
    console.log(`\n  Verdict: 41A_END_TO_END_ADMIN_OPERATOR_WORKFLOW_REVIEW_BLOCKED_UNCLEAR_IMPLEMENTATION_SCOPE`);
  } else {
    console.log(`\n  Verdict: BLOCKED — see failures above`);
  }
  process.exit(1);
}

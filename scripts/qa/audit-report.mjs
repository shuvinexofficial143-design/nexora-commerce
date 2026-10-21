#!/usr/bin/env node
// Summarize npm audit --json output; keep original JSON as an Actions artifact.
// Usage: node scripts/qa/audit-report.mjs FULL_JSON PROD_JSON
import { readFileSync, appendFileSync } from "node:fs";

function load(path) {
  const input = JSON.parse(readFileSync(path, "utf8"));
  if (input.error) throw new Error("npm audit failed: " + JSON.stringify(input.error));
  if (!input.vulnerabilities || !input.metadata) throw new Error("npm audit returned an incomplete JSON report: " + path);
  return input;
}
const [fullPath, prodPath] = process.argv.slice(2);
if (!fullPath || !prodPath) throw new Error("Expected npm audit JSON files for full and production scopes.");
const full = load(fullPath);
const prod = load(prodPath);
const prodPackages = new Set(Object.keys(prod.vulnerabilities));
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
function parentsAndVersions(packageName) {
  const installed = Object.entries(lock.packages || {})
    .filter(([path]) => path === `node_modules/${packageName}` || path.endsWith(`/node_modules/${packageName}`))
    .map(([path, data]) => `${path}@${data.version || "unknown"}`);
  const parents = Object.entries(lock.packages || {})
    .filter(([, data]) => Boolean(data.dependencies?.[packageName] || data.devDependencies?.[packageName] || data.optionalDependencies?.[packageName]))
    .map(([path, data]) => `${path || "project root"} -> ${packageName} (${data.dependencies?.[packageName] || data.devDependencies?.[packageName] || data.optionalDependencies?.[packageName]})`);
  return { installed, parents };
}
const rows = Object.entries(full.vulnerabilities)
  .map(([name, v]) => {
    const advisories = (v.via || []).filter((i) => typeof i === "object");
    return {
      name,
      severity: v.severity,
      direct: v.isDirect,
      production: prodPackages.has(name),
      vulnerableRange: v.range,
      paths: v.nodes || [],
      via: (v.via || []).map((i) => typeof i === "string" ? i : i.name),
      advisoryIds: advisories.map((i) => i.source).filter(Boolean),
      advisoryUrls: advisories.map((i) => i.url).filter(Boolean),
      fixAvailable: v.fixAvailable,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const lines = [
  "# Nexora npm dependency audit",
  "",
  "Source: fresh npm audit --json reports using the checked-out package-lock.json.",
  "",
  "| Scope | Critical | High | Moderate | Low | Total |",
  "|---|---:|---:|---:|---:|---:|",
];
for (const [name, item] of [["Full dependency tree", full], ["Production dependencies", prod]]) {
  const c = item.metadata.vulnerabilities;
  lines.push(`| ${name} | ${c.critical ?? 0} | ${c.high ?? 0} | ${c.moderate ?? 0} | ${c.low ?? 0} | ${c.total ?? 0} |`);
}
lines.push("", "## Affected packages (directness and installed dependency paths)", "");
for (const row of rows) {
  lines.push(`### ${row.name} — ${row.severity} (${row.production ? "production" : "development-only"}, ${row.direct ? "direct" : "transitive"})`);
  lines.push(`- Vulnerable range: ${row.vulnerableRange}`);
  lines.push(`- Installed paths: ${row.paths.join(", ") || "(not supplied by npm)"}`);
  const dependencies = parentsAndVersions(row.name);
  lines.push(`- Installed versions: ${dependencies.installed.join(", ") || "(not found in lock)"}`);
  lines.push(`- Dependency edges from lockfile: ${dependencies.parents.join("; ") || "(not found in lock)"}`);
  lines.push(`- Caused by or linked to: ${row.via.join(", ") || "(unknown)"}`);
  lines.push(`- Advisory sources: ${row.advisoryIds.join(", ") || "(none)"}`);
  lines.push(`- Advisory URLs: ${row.advisoryUrls.join(", ") || "(none)"}`);
  lines.push(`- npm suggested fix: ${JSON.stringify(row.fixAvailable)}`);
  lines.push("");
}
lines.push("## Interpretation", "",
  "Production impact is determined by presence in the separate npm audit --omit=dev JSON report, not by guessing from full-tree metadata.",
  "Do not apply --force or edit package manifests in the QA branch. Review semver compatibility and run full application regression tests before dependency upgrades.");
const output = lines.join("\n") + "\n";
console.log(output);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, output);

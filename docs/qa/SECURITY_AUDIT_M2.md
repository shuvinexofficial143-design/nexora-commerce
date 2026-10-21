# Nexora Commerce — npm Security Audit (QA Milestone 2)

**Baseline:** QA commit `0a5baccd002a470efcd9aa6496f78d9daf8a81c9`; GitHub Actions run [39613413266](https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/39613413266), 21 October 2026. Report based on *executed* `npm audit --json`, `npm audit --omit=dev --json` and `npm audit --omit=dev --audit-level=high`, plus exact versions/edges in this branch's `package-lock.json`.

## Severity by installed scope

| Scope | High | Critical | Other severities |
|---|---:|---:|---:|
| Entire dependency tree | 7 | 0 | 0 |
| Production-only (`--omit=dev`) | 0 | 0 | 0 |

**Strict production audit result:** PASS — `found 0 vulnerabilities`. All 7 are development-only. Still investigate development/CI risk rather than disregarding it.

## Seven npm advisory entries (High severity)

| Package, installed version(s) | Dependency path / entry point | Advisory / causal relationship | npm suggested fix |
|---|---|---|---|
| `eslint-config-next@16.3.8` (direct dev) | Project devDependency -> eslint-config-next | Meta advisory through @next/eslint-plugin-next | Downgrade to 14.2.35 (major, not a safe default with Next 16) |
| `@next/eslint-plugin-next@16.3.8` | eslint-config-next -> @next/eslint-plugin-next | Via fast-glob | Same suggested eslint-config-next downgrade |
| `fast-glob@3.3.1` | eslint-config-next -> @next/eslint-plugin-next -> fast-glob | Via micromatch | Same downgrade |
| `micromatch@4.0.8` | ... -> fast-glob -> micromatch | Via braces | Same downgrade |
| `braces@3.0.3` | ... -> micromatch -> braces | GHSA-vfj7-8cjw-p6xm, range `*` in current audit | Same downgrade |
| `brace-expansion@1.1.18,5.0.9` | eslint -> minimatch -> brace-expansion; typescript-eslint/typescript-estree -> minimatch -> brace-expansion | GHSA-q2hr-2g5m-vwhr; GHSA-qhr7-859c-m2p7; GHSA-6j4f-fj2g-mc7 | npm reports a non-major fix available; test targeted updates |
| `js-yaml@4.3.1` | eslint -> @eslint/eslintrc -> js-yaml | GHSA-2883-xcg3-v3hh | npm reports a non-major fix available; test targeted update |

**Important:** seven *package entries*, not necessarily seven unique CVEs. Transitive nodes such as fast-glob and eslint-config-next are flagged through the dependency graph; `fixAvailable` values are npm recommendations, not verified compatibility guarantees.

## Safe remediation recommendations

1. On a separate dependency-owner branch, review updated patched versions of `brace-expansion` and `js-yaml`, regenerate lockfile, then test `npm ci`, lint, TypeScript, unit tests, build and production audit.
2. Investigate upstream `eslint-config-next` / `@next/eslint-plugin-next` compatible releases for the `fast-glob -> micromatch -> braces` chain. The audit's proposed downgrade to `eslint-config-next@14.2.35` is **not an acceptable blind fix** while the application runs Next 16.
3. Do not run `npm audit fix --force`; changes to package manifests are out of QA scope and might conflict with the other Codex.
4. Retain the strict `npm audit --omit=dev --audit-level=high` gate; future newly discovered production vulnerabilities must fail the security CI job.

## Reproducible evidence

Full and production JSON reports are preserved in the `nexora-qa-security-audit` workflow artifact:
[Download from GitHub Actions run](https://github.com/shuvinexofficial143-design/nexora-commerce/actions/runs/39613413266/artifacts/12350758740).

The workflow's generated Markdown summary includes current vulnerable ranges, advisory URLs, package nodes, installed versions and direct dependency edges.

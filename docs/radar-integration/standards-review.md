# Epic 3 standards alignment

## Scope

Review of radar-owned code, CV verification, and their integration points. The conflict resolution from PR #2482 is preserved. This update does not certify all domains inherited from `develop` or modify shared history, the Prisma schema, migrations, or CI configuration.

## Changes

| Requirement | Result |
| --- | --- |
| Domain documentation | README files for radar-chart, radar-integration, cv, and mentorship with flows, dependencies, APIs, Mermaid diagrams, and Sprint 3 history |
| Database documentation | Dictionary of 95 models and 135 relationships, including types, keys, mappings, indexes, and deletion behavior |
| Documented API | 24 radar operations with unique identifiers, JWT, permissions, parameters, bodies, responses, errors, and examples |
| Domain boundaries | Roles queried through UsersService; radar does not read userRole directly |
| Public frontend API | Imports through index.ts and area label lookup without circular initialization |
| Contracts | Individual types and props; .types.ts suffix for backend module contracts; actual CV rescan response |
| Language and UI | English internal identifiers, status displays without traffic-light colors, the UI Label component, and static Tailwind styles |
| Catalogs | TypeScript enums for document states and source types, preserving persisted values |
| Security and concurrency | Tests for lost leases, failed OCR, another owner's certificate, overlapping jobs, and owner changes |

## Reproducible validation

Local results from November 16, 2026:

| Scope | Passing tests | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- | --- |
| Backend radar-integration | 147 | 86.73% | 83.40% | 80.06% | 86.96% |
| Frontend radar-chart and cv; directory integration | 622 | 87.44% | 80.20% | 82.39% | 87.92% |

Thresholds remain at 80% for all four metrics. Frontend TypeScript and the backend production compilation check without emission passed; ESLint and Oxlint also passed through commit hooks. The Next Webpack build passed with an `import.meta` warning in the inherited notifications module. These results do not certify global coverage for other domains.

From `backend/`:

```text
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.build.json --incremental false
node node_modules/eslint/bin/eslint.js src/modules/radar-integration
node_modules/.bin/oxlint.cmd --type-aware src/modules/radar-integration/
node node_modules/vitest/vitest.mjs run src/modules/radar-integration --maxWorkers=2 --coverage --coverage.include=src/modules/radar-integration/**
```

From `frontend/`:

```text
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js src/modules/radar-chart src/modules/cv src/modules/mentorship/views/mentor-directory-view.tsx --max-warnings=0
node node_modules/vitest/vitest.mjs run src/modules/radar-chart src/modules/cv src/modules/mentorship/views/mentor-directory-view.test.tsx --maxWorkers=1 --coverage --coverage.include=src/modules/radar-chart/** --coverage.include=src/modules/cv/**
node node_modules/next/dist/bin/next build --webpack
```

Coverage filters define the scope of this update; they neither exclude executable code from those domains nor lower the repository's 80% thresholds. Global coverage requires running all suites. Running the complete suites concurrently on the local machine caused timeouts in availability, education, and report tests; their tests and limits were not changed. The Next build requires Google Fonts access for Inter and Inter Tight.

## Outstanding owner reviews

- Database team: [specific change request](database-change-request.md). Differences in keys, defaults, audit fields, and legacy table catalogs remain pending until that team approves and implements the migration.
- Epic 3 lead: review the changes and documentation before integration.
- Prerequisite integration: merge PR #2482 first. Until then, a PR targeting Epic 3 also includes the CODEOWNERS changes inherited from develop and may be blocked by CI Files. The new standards commits do not modify those files or use DevOps branch names to bypass review.
- DevOps: approve the future integration of Epic 3 into develop. Historical Spanish commits are not rewritten; new commits use English and Conventional Commits.

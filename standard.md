# Project Standards

## 1. GENERAL GUIDELINES AND WORKFLOW

### 1.1 Languages and Typing

**TypeScript is mandatory:** All project code must be written strictly in TypeScript.

**JavaScript exception:** Pull requests (PRs) containing JavaScript files are accepted only in exceptional cases involving library incompatibility or missing official types. If type definitions (`@types`) exist, the PR containing JavaScript will be rejected.

### 1.2 Git Branch Strategy

Branches follow this naming convention:

```text
<branch>/<group-num>-<description-of-branch>
```

Example: `feature/group-1-login`.

Allowed branch types: `feature`, `fix`, `hotfix` (DevOps only), `refactor`, `docs`, `test`, and `epic`.

Branches of type `chore` are reserved exclusively for the DevOps team.

### 1.3 Commit Standard

The project adopts Conventional Commits with influences from the Angular standard.

Allowed types: docs, feat, fix, perf, refactor, test, build, chore.

feat: message
feat(frontend): message
feat(scope module or function): <message>

When a scope is provided, it identifies the module or function.

**Strict restriction:** Any commit containing direct changes to continuous integration (CI) will be rejected.

**DevOps exclusivity:** Only the DevOps team may make commits containing direct changes to continuous integration (CI).

Commit messages must be written in English (see 2.1). This rule is checked during PR review; there is no automatic language validation. The pipeline validates the commit format and type.

### 1.4 Adapted Gitflow and Environments

Main deployment branches:

- `main` (Production): Contains the official stable version. Updated exclusively at the end of each Sprint.
- `develop` (Continuous Development): The main testing environment. Receives regular updates every 2 to 5 days, integrating work validated by DevOps.

Epic management (internal Gitflow):

- `epic/*` branches: Each group has its own base branch, for example `epic/group-1-mentoring-network`.
- Task branches: Each team member creates temporary branches (`feature/*`, `fix/*`) from the corresponding epic branch.

### 1.5 Integration and Pull Request Rules

**Integration into `epic/*` (team leaders):** Developers submit PRs to their epic branch. The team leader approves or rejects them based on code standards, architecture, and separation of responsibilities.

**Integration into `develop` (DevOps):** Every 2 to 5 days, the team leader submits a PR from `epic/*` to `develop`. Only DevOps may approve this integration to prevent instability across the project.

The CI/CD pipeline allows direct integration into `develop` without going through an epic only for:

- Critical bug repair branches (`hotfix/devops-*`).
- Infrastructure, configuration, or maintenance branches (`chore/*` and `*/devops-*`).

**DevOps review hours:** Reviews take place only between 9 a.m. and 10 p.m.

### 1.6 Dependencies and Blockers Between Teams

**Temporary unblocking:** When a team depends on an unavailable implementation from another group, the waiting limit is 2 days. After that deadline, the blocked team may use AI to implement it, with more flexible review. The PR must identify, including through comments, which files were implemented on behalf of other teams. The team that failed to deliver will not have its PR approved until it fixes those “vibe coded” files. A report on these files must also be prepared.

**Cross-team integration protocol:** Direct merges between two different `epic/*` branches are strictly prohibited. The required flow is:

1. **Publication:** The provider team submits a PR from its epic branch to `develop`.
2. **Approval:** DevOps approves and integrates the changes into `develop`.
3. **Consumption:** The consuming team pulls or merges the updated `develop` into its own epic branch.

### 1.7 Project Management and Quality Control (CI/CD)

**Task management:** GitHub Projects will be used within a public organization. Each team will have a KANBAN board for its issues, alongside a project-wide KANBAN board of User Stories visible to everyone.

Frontend and backend automation requirements:

- **Test coverage:** At least 80%.
- **Linting:** DevOps will reject PRs into `develop` when the code does not comply with lint rules.
- Teams may use AI to develop unit tests to meet the minimum coverage.

### 1.8 Standard Backend Response Contract for Clients

JSON responses must contain these fields:

```text
statusCode
data
offset (optional, as applicable)
page (optional, as applicable)
detail
ok
```

### 1.9 Endpoint Standard

Endpoints must follow REST conventions.

### 1.10 Automation

| Automation | When it runs | What it does |
| --- | --- | --- |
| Git Standards | PRs into `develop`, `main`, or `epic/**` | Validates all commits against Conventional Commits (allowed type, format, and a blank line before the body); validates branch names; validates the integration flow (`main` only from `develop`; `develop` only from `epic/*`, `hotfix/devops-*`, and DevOps branches; an `epic/*` cannot receive a merge from another `epic/*`); blocks direct PRs from group branches (`<type>/grupo-N-...`) into `develop`; and blocks changes to `.github/`, `.husky/`, `scripts/`, `backend/scripts/`, frontend and backend `package.json`, and Vitest, ESLint, Prettier, and tsconfig configuration outside DevOps branches (the “CI Files” check). |
| CI Backend | PRs with changes in `backend/` | Installs dependencies, generates the Prisma client, runs the linter (oxlint), the standards linter (names, index files, and exceptions), tests with coverage, and the build. |
| CI Frontend | PRs with changes in `frontend/` | Runs ESLint, tests with coverage, and the build. ESLint checks file and folder names, the absence of emojis, Tailwind class order and usage, and imports of Radix or Base UI. It reports prohibited native JSX elements as errors under the [frontend UI rules](frontend/standard.md#24-shadcn-and-base-ui-rules). |
| [CI Database](.github/workflows/ci-database.yml) | PRs into `develop`, `main`, or `epic/**` that change database files or related configuration | Validates the Prisma schema, applies migrations to a temporary PostgreSQL database, checks that the resulting database matches the schema, generates Prisma Client, and validates production catalog and administrator seeds and development seeds. |
| Husky | Before each commit | Lints only staged files (lint-staged) and validates the commit message using the same script as CI. It can be skipped with `--no-verify`, but CI checks again. |
| Sync Develop to Epics | Every push to `develop` | Merges `develop` into all `epic/*` branches. If there is a conflict, it aborts that merge and reports it; the conflict must be resolved manually. |
| Deployment | Pushes to `develop`, `main`, or epics with deployment enabled | See 1.11. |
| Migrations | When the backend container starts | Runs `prisma migrate deploy` before starting the API. |
| Auto-close issues | When a PR is merged into `epic/*` | Automatically closes issues linked to the PR (for example, with “Closes #N”), because GitHub only closes issues automatically when merging into the default branch. |

**Required review (CODEOWNERS):** DevOps reviews `README.md`, `.github/`, `.husky/`, `scripts/`, `backend/scripts/`, frontend and backend `package.json`, and Vitest and ESLint configuration. The Database team reviews `/backend/prisma/`.

**Planned automation:** A deprecated-code rule for frontend and backend.

### 1.11 Continuous Deployment

1. Someone merges into a branch with deployment enabled: `develop`, `main`, `epic/grupo-1-identity-backoffice-onboarding`, `epic/grupo-5-matching-y-postulaciones`, or `epic/grupo-6-red-mentorias`.
2. A GitHub Actions workflow builds frontend and backend Docker images and pushes them to GitHub Container Registry (`ghcr.io`). Each image is tagged `<environment>-<commit sha>`.
3. The workflow notifies a workflow in the `UMSSY/umssy-app-deploy` repository.
4. That workflow replaces the `image:` line in the environment's `deployment.yml` file and automatically commits to that repository's `main` branch.
5. ArgoCD watches those manifests, detects the change, and deploys the new version. It has one application per environment and service (frontend and backend), with automatic synchronization from `main`.

| Environment | Branch | Image tag | Namespace | Frontend | API |
| --- | --- | --- | --- | --- | --- |
| main | `main` | `main-<sha>` | `umssy-main` | umssy.zer4c.dev | umssy.zer4c.dev/api |
| develop | `develop` | `develop-<sha>` | `umssy-develop` | dev-umssy.zer4c.dev | dev-api-umssy.zer4c.dev/api |
| epic1 | `epic/grupo-1-identity-backoffice-onboarding` | `epic1-<sha>` | `umssy-epic1` | epic1-umssy.zer4c.dev | epic1-api-umssy.zer4c.dev/api |
| epic5 | `epic/grupo-5-matching-y-postulaciones` | `epic5-<sha>` | `umssy-epic5` | epic5-umssy.zer4c.dev | epic5-api-umssy.zer4c.dev/api |
| epic6 | `epic/grupo-6-red-mentorias` | `epic6-<sha>` | `umssy-epic6` | epic6-umssy.zer4c.dev | epic6-api-umssy.zer4c.dev/api |

Each environment has its own Kubernetes namespace and PostgreSQL database inside the cluster. Credentials are stored in Kubernetes Secrets, not in the repository. The backend applies pending migrations at startup. Seeds do not run automatically: they are run manually, and production must not contain test users.

## 2. GLOBAL CODE AND NAMING STANDARDS

### 2.1 Language

- **English:** Variables, functions, classes, interfaces, files, folders, branches, commits, database entities, and documentation (`docs/`).
- **Spanish:** Interface text (messages, labels, buttons, modals, alerts) and code comments.
- Mark pending work with `TODO: <message>`.
- Do not use emojis anywhere.

### 2.2 Formatting Conventions

| Convention | Applies to | Rules |
| --- | --- | --- |
| camelCase | Variables, functions, and methods | Functions start with a verb (`getUserData`). Booleans start with `is`, `has`, or `can` (`isOpen`). |
| PascalCase | Components, classes, types, and interfaces | Data contracts use a suffix: `Props`, `Response`, `Payload`, `Exception`. |
| kebab-case | Files and folders | Lowercase words separated by hyphens (`user-profile.tsx`). |
| UPPER_SNAKE_CASE | Global constants | Immutable values (`MAX_UPLOAD_SIZE`). |

### 2.3 Dynamic Routes

Use lowercase brackets with a single clear word: `[id]`, `[slug]`, `[token]`.

### 2.4 Barrel Files (index.ts)

These files only re-export. They contain no business logic, algorithms, or UI rendering.

### 2.5 Constants

- **Local:** If used by only one function, keep them in that file.
- **Module:** If shared by multiple files within a module, place them in the module's constants folder.
- **Global:** If reused in more than 8 modules, place them in the shared module.

### 2.6 Backend File Suffixes

File names follow the `name.type.ts` pattern.

| Suffix | Content |
| --- | --- |
| `.module.ts`, `.controller.ts`, `.service.ts` | Module, controller, and business logic |
| `.repository.ts` | Data access through Prisma |
| `.mapper.ts` | Entity-to-response transformation |
| `.request.ts` / `.schema.ts` | Input Zod schema |
| `.response.ts`, `.types.ts`, `.enum.ts` | Contracts, types, and enumerations |
| `.constants.ts` | Module constants |
| `.exception.ts` | One exception per file in `exceptions/`; class name ends with `Exception` |
| `.seed.ts` | Initial data |
| `.spec.ts` / `.e2e-spec.ts` | Unit and integration tests |

### 2.7 Frontend File Suffixes

| Suffix | Content |
| --- | --- |
| `-view.tsx` | A module's full screen |
| `.tsx` | Visual component |
| `use-*.ts` | Hook (function name uses camelCase: `useEvents`) |
| `.service.ts` | Domain HTTP calls |
| `.types.ts` / `-props.types.ts` | One type per file / component props |
| `.constants.ts` | Module constants |
| `.test.ts` / `.test.tsx` | Unit test, alongside the file it tests |

### 2.8 Folder Structure

**Backend:** Each module lives in `src/modules/<name>/` and groups its files into plural folders: `controllers`, `services`, `repositories`, `mappers`, `requests`, `responses`, `types`, `constants`, `exceptions`, `seeds`, and `tests`. Create only the folders the module needs. Cross-cutting code belongs in `src/common`.

**Frontend:**

- `src/app/` contains only routes, grouped by access: `(public)`, `(app)`, and `(backoffice)`. Each `page.tsx` only renders the module's view.
- `src/modules/<domain>/` contains `views`, `components`, `hooks`, `services`, `types`, `constants`, and `utils`. Public exports go through the module's `index.ts`.
- `src/shared/` contains code used by several modules: `components/layout`, `config`, `constants`, `contexts`, `hooks`, `services` (with `api-client.ts` and `storage/`), `types`, and `utils`.

## 3. ISSUE CREATION STANDARDS

These templates ensure that every team member has the technical context, scope, and delivery conditions before starting development.

### 3.1 Form Structure

When a new GitHub task is created (Frontend, Backend, or General), the form requests these fields in order:

| Field | Requirement | What to enter | Example |
| --- | --- | --- | --- |
| 1. Epic and User Story | Required | The Epic and User Story to which the task belongs. Must always start with `Epic #N`. | Epic #8 - User Story 01 (Login) |
| 2. Task type | Required | Select the change category from the dropdown. | Feature, fix, refactor, test, docs, or hotfix |
| 3. Priority | Required | Urgency level agreed for the work board. | High, Medium, or Low |
| 4. Estimate in hours | Required | Estimated development time, expressed exclusively in hours. | 4 hours |
| 5. Technical description | Required | Detailed explanation of what will be built or fixed (components, routes, endpoints, logic, or database). | Create the authentication service and connect the form... |
| 6. Acceptance criteria | Required | A checklist of verifiable conditions (`-[]`) that must be met to complete the task. | - [ ] Validates credentials<br>- [ ] Redirects to the dashboard |
| 7. Dependencies | Optional | Whether another User Story (HU) must be completed before this task can be finished. | Depends on HU #15 |

### 3.2 Important Rules

- **Format (`Epic #N`):** Every reference must begin with the word `Epic`, followed by `#` and the corresponding number (for example, `Epic #3 - ...`) to keep the board organized.
- Creating issues outside the team's board is prohibited. DevOps will delete any issue left outside its project board.
- Blank issues are prohibited. Always use the appropriate template: fullstack, backend, or frontend.

## 4. DOCUMENTATION STANDARDS

- All documentation in `docs/` must be written in English (not in Spanish).
- Every module must have one README at `docs/<module>/README.md`, matching its directory name in `src/modules/`. This requirement applies to all modules. Document the complete module, including its backend and frontend responsibilities, in the same README; do not separate documentation by application layer.
- Creating additional documentation files inside `backend/` or `frontend/` is prohibited, except for `backend/prisma/README.md`.
- Preserve existing root `README` and general standard files.
- Each module README must document its purpose, key flows, business rules, dependencies, and main endpoints it exposes or consumes.
- Changes to a module must include corresponding updates to its documentation. Deprecation documentation is not required.
- Architecture, database relationships, and key flows must be represented with Mermaid diagrams inside the relevant READMEs. Sequence diagrams must use Mermaid `sequenceDiagram`; standalone diagrams or images do not replace the required embedded diagrams.
- Every documentation README must include a **Sprint History** section. Documenting Sprint 3 functionality is mandatory; documenting Sprints 1 and 2 is optional.
- Database documentation must live in `backend/prisma/README.md`, alongside `schema.prisma`, and follow the backend database documentation standard.
- Never add HU or epic references in the documentation.

## 5. APPENDICES

Recommended reading for workflow concepts such as commit conventions:

- https://github.com/angular/angular/blob/main/contributing-docs/commit-message-guidelines.md
- https://www.conventionalcommits.org/en/v1.0.0/

REST API information:

- https://www.redhat.com/es/topics/api/what-is-a-rest-api
- https://aws.amazon.com/es/what-is/restful-api/
# Radar integration and publication

## Purpose and responsibilities

`backend/src/modules/radar-integration` coordinates verified evidence, versioned publications, and recruitment affinity. It supports [radar-chart](../radar-chart/README.md) and the verification shown by [cv](../cv/README.md). Controllers validate with Zod and delegate; services own business rules; repositories access their own tables; mappers build responses wrapped by the global interceptor.

## Architecture and dependencies

```mermaid
flowchart TD
  Controllers[REST controllers: Zod, JWT, and roles] --> Services[Radar services]
  Services --> Repositories[Domain repositories]
  Repositories --> Tables[Radar tables]
  Services --> Users[UsersService: identity and active roles]
  Services --> Sources[CV, skill, and profile owner services]
  Services --> Recruitment[Vacancies and applications]
  Services --> Mappers[Response mappers]
  Mappers --> Interceptor[ResponseInterceptor]
```

Cross-domain reads use the owning services. `RadarRecruitmentSourcesService` queries roles through `UsersService`, without reading `userRole` directly from radar. Services do not inject Prisma. The Database team owns the schema and migrations.

Certification document mutations obtain active verification IDs through `RadarAuditService` with the caller's `TransactionContext`. The certification service holds its own row lock and validates the expected version before writing; Radar repositories keep verification-table access inside the owning domain.

## Publication and scoring

```mermaid
sequenceDiagram
  participant Profile as Profile and documents
  participant NLP as ProfileSkillsAnalysisService
  participant Radar as RadarPublicationService
  participant Store as RadarPublicationRepository
  participant UI as RadarProfileView
  Profile->>NLP: Sources change
  NLP->>Radar: Publish skills
  Radar->>Radar: Gather evidence and calculate fingerprint
  Radar->>Store: Publish a consistent revision
  Store-->>Radar: Versioned snapshot
  UI->>Radar: GET /profile/me/radar
  Radar-->>UI: Current and previous publications
```

Only approved skills with valid evidence are published, counting each skill once. The rubric adds 1 point per skill and 0.5 for high relevance, capped at 10 per axis; the average uses all six axes. The fingerprint and source revision prevent inconsistent publications. Failures preserve the valid snapshot. The response distinguishes no publication, a zero-score publication, pending skills, and NLP state.

## Snapshot history and comparison contract

`GET /profile/me/radar` returns the owner's current publication and `previous`, the immediately preceding publication when available. `previous` contains `{ version, updatedAt, scores }`; `variation` is the difference between the published averages, rounded to two decimals. With no preceding publication both `previous` and `variation` are null. The publication response also carries `sourceRevision`, `inputRevision`, `processingStatus`, `hasPending`, `pending` and `dictionaryVersion` so the client can distinguish published data from unfinished processing.

`GET /profile/me/radar/snapshots/:id` returns the exact owned historical publication and its own preceding version. `RadarPublicationMapper.historicalResponse` builds the same historical shape for direct access and compatibility notification opening: `processingStatus=ready`, `pending=0`, `hasPending=false`, `dictionaryVersion=null`, and `inputRevision` from the saved source revision or zero. These historical values describe the saved publication, not the owner's current processing queue. No update or recalculation is performed by this GET.

Snapshots are immutable scoring results. Unchanged fingerprints synchronize the source revision without creating another score version; changed accepted evidence produces the next publication. The historical repository binds both snapshot ID and authenticated user ID. Missing and foreign publications return the same domain 404 (`RADAR_PUBLICATION_NOT_FOUND`).

```mermaid
flowchart LR
  User[Authenticated owner] -->|owns| Snapshots[Versioned score snapshots]
  Audit[Publication audit events] -->|version and source revision| Snapshots
  Notices[Central notifications] -->|group key radar:snapshotId| Snapshots
  Current[Current radar query] -->|latest two versions| Snapshots
  Historical[Historical query] -->|requested owned version and preceding version| Snapshots
```

The notification group key is a logical snapshot reference. Notification storage and read state remain owned by Notifications; Radar does not write notification tables.

## Document verification

```mermaid
sequenceDiagram
  actor Owner as Profile owner
  participant Source as CV or certifications
  participant Worker as DocumentVerificationService
  participant Review as DocumentReviewService
  participant Radar as RadarPublicationService
  actor Admin as Administrator
  Owner->>Source: Upload or replace a document
  Source->>Worker: Queue the active version
  Worker->>Worker: Claim job; run OCR and NLP
  alt Rules satisfied
    Worker->>Worker: Approve automatically
  else Uncertain case
    Worker->>Review: Review with reason and supporting file
    Admin->>Review: Inspect and decide
  end
  Worker->>Radar: Update analysis and publication
  Radar-->>Owner: Result and published skills
```

The worker polls every 1.5 seconds. Claims use `FOR UPDATE SKIP LOCKED`, a lease, and a retry date; only the active version with a current lease is finalized. Readings without confidence go to review; confidence below 60% produces `low_confidence`. Checks cover duplicates, owner identity, document type, issuer, and catalog skills with an area. Replaced versions remain in history and stop contributing as active sources.

Decisions respect state and version; concurrent changes return 409. Acknowledging a result requires its owner and current state. `noticeRead` records history acknowledgement, rather than implementing a delivery channel. This module does not send SMTP, Web Push, or Socket.io messages. Publication notifications use `NotificationsService.notify()`, the RADAR_PUBLISHED template and the central inbox.

### Verification results and permitted actions

| Status            | Meaning and administrative actions                                    |
| ----------------- | --------------------------------------------------------------------- |
| `queued`          | Active version awaiting extraction; no manual decision in the panel   |
| `reading`         | Claimed by the worker; a lease protects completion                    |
| `approved`        | Automatically passed validation; approval can be revoked              |
| `review`          | Needs manual assessment; approve, reject or reprocess                 |
| `low_confidence`  | Reading confidence below 0.6; approve, reject or reprocess            |
| `manual_approved` | Administrator accepted the evidence; approval can be revoked          |
| `manual_rejected` | Administrator rejected or revoked approval                            |
| `legacy`          | Previous-format evidence; reprocess when backing content is available |
| `cancelled`       | Cancelled verification result; retained for history                   |

The administrative queue contains active versions only. `pending` includes `review` and `low_confidence`; `approved` includes `approved` and `manual_approved`; `rejected` includes `low_confidence` and `manual_rejected`; `all` removes the state filter. Thus a low-confidence version can appear in both pending and rejected views. Owner history includes replaced versions and is ordered by creation date and ID descending.

Automatic approval requires a finite confidence of at least 0.6, no earlier duplicate for the owner, a matching full owner name, a recognizable CV or certificate type, and at least one catalog skill with a radar area. Certificates must also match their issuing organization. Missing/non-finite confidence goes to `review`; confidence below 0.6 goes to `low_confidence`. A reason is returned with the detected skills and confidence.

Manual approval/rejection is accepted only for an active `review` or `low_confidence` version and records the administrator, decision time, audit and operation result in one transaction. Reprocessing requires an active `review`, `low_confidence` or `legacy` version with backing content: it clears the old extraction result and publication links and queues the version again. Revoking an active `approved` or `manual_approved` version sets `manual_rejected` and requests synchronization. Invalid or concurrent transitions return `DOCUMENT_VERIFICATION_CONFLICT` (409).

The worker synchronizes a decision through NLP and publication; `synced` distinguishes this completion from the review status. `radarVersion` and `publishedIds` identify the publication and skills that actually used the document; they can be null/empty when it contributed no published skill. Replacing a file deactivates its previous verification version, which remains visible in owner history.

Owner acknowledgement sends `{ status }` for the displayed verification ID. The backend checks the authenticated owner, matching current status and an existing decision timestamp before setting `noticeRead`. A changed result must be fetched again after a 409. This acknowledgement is separate from reading a central publication notification.

```mermaid
sequenceDiagram
  actor Admin as Administrator
  participant Review as Document review service
  participant Store as Verification repository
  participant Worker as Verification worker
  participant NLP as Profile analysis
  participant Radar as Radar publication
  Admin->>Review: Confirm decision for active version
  Review->>Store: Validate state and persist decision with audit
  Store-->>Review: Decision saved; synced=false
  Review-->>Admin: Completed operation result
  Worker->>Store: Claim active unsynchronized version
  Worker->>NLP: Refresh approved source analysis
  Worker->>Radar: Recalculate accepted evidence
  Radar-->>Worker: Published snapshot or no contribution
  Worker->>Store: Save radarVersion and publishedIds; synced=true
```

## Recruitment and consent

Applicants need an active `titulado` or `estudiante` role and all three explicit consents. Revoking general consent disables CV and contact sharing. Recruiters need the `empresa` role and a link to the vacancy's company. Only profiles with a published radar and current consent are shown; contact and CV access are authorized separately. Affinity ranks candidates without making hiring decisions. Withdrawal and final decisions respect application state and are audited.

## Endpoints

All endpoints require JWT. Owner means the authenticated user; UUIDs are validated before services run. Lists are complete and unpaginated. The document queue accepts `filter=pending|approved|rejected|all`, defaulting to `pending`. Swagger documents all 29 operations, their parameters, bodies, roles, and responses.

Error responses reference the shared `#/components/schemas/ApiErrorResponse` schema registered by `documentCommonResponses`, retaining Radar-specific descriptions and examples.

| Method and path                                                            | Permission and result                                                  |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `GET /profile/me/radar`                                                    | Owner: current and previous radar publications                         |
| `GET /profile/me/radar/simulation-eligibility`                             | Owner: `approved` skills (`id`, `name`) and `highRelevanceSkillIds` eligible for the simulation bonus |
| `GET /profile/me/radar/snapshots/:id`                                      | Owner: historical snapshot and its preceding version                   |
| `GET /profile/me/radar/notifications`                                      | Owner: compatibility list delegated to the central inbox               |
| `POST /profile/me/radar/notifications/:id/open`                            | Owner: authorized historical response and central read acknowledgement |
| `GET /radar-reviews/operations/:operationId`                               | Administrator: recover an owned evidence decision                      |
| `GET /radar-document-reviews/operations/:operationId`                      | Administrator: recover an owned document decision                      |
| `POST /profile/me/radar/recalculations`                                    | Owner: reanalysis and publication                                      |
| `POST /profile/me/radar/cv-rescans`                                        | Owner: reanalyze the current CV                                        |
| `GET /radar-reviews`                                                       | Administrator: CV and skill queue                                      |
| `PATCH /radar-reviews/:kind/:id`                                           | Administrator: approved/rejected/revoked; kind=cv or skill             |
| `POST /radar-reviews/cvs/:id/reprocessings`                                | Administrator: reprocess CV                                            |
| `GET /radar-reviews/cvs/:id/file`                                          | Administrator: PDF and access audit                                    |
| `GET /profile/me/document-verifications`                                   | Owner: version history                                                 |
| `PATCH /profile/me/document-verifications/:id/notification`                | Owner: acknowledge the current result state                            |
| `GET /profile/me/document-verifications/:id/file`                          | Owner: supporting file                                                 |
| `GET /radar-document-reviews`                                              | Administrator: filtered active versions                                |
| `PATCH /radar-document-reviews/:id`                                        | Administrator: approved/rejected/reprocess/revoke                      |
| `GET /radar-document-reviews/:id/file`                                     | Administrator: supporting document                                     |
| `POST /radar-integration/admin/company-access`                             | Administrator: link a company user                                     |
| `GET /radar-integration/vacancies`                                         | Authenticated session: active vacancies                                |
| `POST /radar-integration/applications`                                     | Titulado/estudiante: apply with consent                                |
| `GET /radar-integration/me/applications`                                   | Titulado/estudiante: owned applications                                |
| `PATCH /radar-integration/me/applications/:id/consents`                    | Titulado/estudiante: owned sharing permissions                         |
| `PATCH /radar-integration/me/applications/:id/withdraw`                    | Titulado/estudiante: withdraw an owned application                     |
| `GET /radar-integration/recruiter/vacancies`                               | Company user: company vacancies                                        |
| `GET /radar-integration/recruiter/vacancies/:id/applicants`                | Linked company user: descending affinity ranking                       |
| `GET /radar-integration/recruiter/applications/:id/areas/:areaId/evidence` | Linked company user: approved evidence                                 |
| `GET /radar-integration/recruiter/applications/:id/cv`                     | Linked company user with consent: PDF                                  |
| `PATCH /radar-integration/recruiter/applications/:id`                      | Linked company user: hired/rejected                                    |

Successful JSON: `{ statusCode, data, detail, ok: true }`; POST uses 201, while GET/PATCH use 200. Errors: `{ statusCode, code, detail, data, ok: false }`. Applicable documented statuses are 400 for input, 401 for session, 403 for permission/consent, 404 for unavailable resources, 409 for conflicts, and 500 for internal failure. Downloads send bytes without a JSON envelope and use `Content-Disposition: inline`; supporting files retain their MIME type.

## Data and validation

Models and relationships: [backend/prisma/README.md](../../backend/prisma/README.md). Outstanding database standards differences: [request to the owning team](database-change-request.md). This standards update does not modify the schema or migrations.

Tests cover publication, provenance, concurrent review, consent, authorization, and OpenAPI contracts. Validate with Vitest, ESLint, Oxlint, and the backend build. The project requires at least 80% coverage; confirm actual results with the execution report for the relevant revision.

## Recoverable review decisions and publication notifications

The frontend persists a UUID in IndexedDB per authenticated administrator, evidence kind, target and decision. `submitRadarReviewDecision` first queries the matching operation endpoint. Only a 404 allows sending a decision. The operation ID, completed status, kind, target and decision must all match before clearing local state. Network errors and conflicting responses retain the UUID for retry; mounting the review panels also recovers completed operations without sending new decisions.

Administrative endpoints require the `administrativo` role. `GET /radar-reviews/operations/:operationId` and `GET /radar-document-reviews/operations/:operationId` return `{ operationId, status: "completed", kind, targetId, decision, changed, userId, completedAt }` inside the standard API envelope. Operations belonging to another administrator or review flow return 404. Reusing an ID with different intent returns 409. `PATCH /radar-document-reviews/:id` validates the complete strict union through `RequestValidationPipe`: approved/rejected require operationId; reprocess/revoke accept only decision. `DocumentReviewDecisionService` coordinates these actions and raises domain conflicts for obsolete versions.

Both decision services share the transaction operation lookup, locking and identity validation. They keep document and skill state changes in their respective domain services; the operation result and audit are saved in the same transaction as the decision.

```mermaid
sequenceDiagram
    participant UI as Review panel
    participant Local as IndexedDB
    participant API as Review endpoint
    participant DB as Transaction
    UI->>Local: Read or create operationId for session and intent
    UI->>API: GET operation status
    alt Completed matching operation
        API-->>UI: Saved result
    else Operation not found (404)
        UI->>API: PATCH decision with operationId
        API->>DB: Lock, validate identity, change evidence and save result
        DB-->>API: Commit
        API-->>UI: Completed result
    end
    UI->>Local: Clear only after matching complete result
```

Publication commits the snapshot and audit before calling `NotificationsService.notify` with RADAR_PUBLISHED, `groupKey=radar:<snapshotId>` and `/profile/radar?snapshot=<snapshotId>`. The notification owner creates IDs and prevents concurrent duplicate publication notices. Delivery failure is logged and does not revert the committed snapshot. There is no automatic notification delivery retry.

The central Notifications inbox owns listing and read state. Radar keeps snapshot queries only. `GET /profile/me/radar/snapshots/:id` returns the historical radar with its previous version and a ready processing state; the query includes the authenticated owner and returns 404 for missing or foreign snapshots. The view shows loading/error status and allows returning to the current radar. Compatibility notification routes delegate to `NotificationsInboxService`.

```mermaid
sequenceDiagram
    participant Radar as Radar publication
    participant DB as Snapshot transaction
    participant N as NotificationsService
    participant Inbox as Central inbox
    participant View as Radar view
    Radar->>DB: Snapshot and audit
    DB-->>Radar: Commit
    Radar->>N: notify with snapshot group key
    N-->>Inbox: Central notification and link
    Inbox->>View: /profile/radar?snapshot=id
    View->>Radar: GET snapshots/id with authenticated owner
    Radar-->>View: Historical snapshot and previous publication
```

Dependencies: NotificationsModule provides notification creation, inbox access and read state. The radar frontend uses the central inbox links and the shared operation service. Review contracts live individually in `types/`; semantic destructive styles and `cn()` follow the shared UI conventions.

Historical responses for both direct snapshot access and notification opening are built by `RadarPublicationMapper.historicalResponse`, including the previous publication, ready processing state and source revision fallback. Missing historical snapshots raise `RADAR_PUBLICATION_NOT_FOUND`; missing or unavailable notifications raise `RADAR_NOTIFICATION_NOT_FOUND`. Both domain errors retain HTTP 404. Publication payloads pass through the Radar-owned Zod schema at `radar-integration/notification/radar-published-payload.schema.ts` before `notify()`. The producer owns this event contract; Notifications remains responsible for delivery. Document acknowledgement and review filter types are defined only in their individual `types/` files; the request file contains schemas only.

## Sprint History

### Sprint 3

- Versioned publication, current/previous comparison contracts, authorized historical snapshots and approved evidence.
- Mentorship integration: radar areas and mentor integration support.
- Document verification: OCR/NLP verification, history, and administrative review.
- Consent and recruitment affinity.
- Standards alignment: `.types.ts` contracts, REST/OpenAPI documentation, and roles accessed through the owning service.

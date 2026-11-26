# Mentors

## Purpose and boundaries

The backend `mentors` module owns mentor participation, directory/profile reads, similar recommendations, profile suggestions, capacity and slot offers. The frontend `mentors` module provides participation, request history, technical-area editing and optional profile recommendations. Public browsing and preview belong to [mentorship](../mentorship/README.md); the administrative interface belongs to [mentor-capacity](../mentor-capacity/README.md).

## Architecture and dependencies

Controllers receive requests and session identity. Services coordinate eligibility and response mapping. Repositories persist through Prisma and parameterized SQL. `MentorMapper` builds directory/profile responses and enriches suggestions with titles, benefits, edit references and a count. `ResponseInterceptor` wraps successful JSON results in `statusCode`, `data`, `detail`, and `ok`.

`MentorsModule` imports AuthModule, ProfileModule and SkillsModule. Its public services are MentorsService and MentorProfileSuggestionsService. Frontend services use the shared API client; TanStack Query owns remote state. Profile, education and availability modules supply additional optional recommendations.

```mermaid
flowchart LR
  Views[Participation and editing views] --> Queries[TanStack Query]
  Queries --> HTTP[Domain HTTP services]
  HTTP --> Controllers[Controllers and guards]
  Controllers --> Services[Mentor services]
  Services --> Repository[Repositories and transactional SQL]
  Repository --> DB[(PostgreSQL)]
  Services --> Mapper[MentorMapper]
  Mapper --> Response[ResponseInterceptor]
```

## Similar mentors

`findSimilar` first loads the active source mentor. Missing sources raise MentorNotFoundException. Candidate queries exclude that user, require active users and current mentor roles, and match technical areas or active orientation types. Ranking uses shared area count descending, then shared orientation count descending, then ID ascending. Only three IDs are hydrated, with ranking preserved. No matching areas/orientations produces an empty list. This recommendation does not apply the directory's optional availability filter.

## Profile completeness

The authenticated suggestions endpoint evaluates four independent conditions, in order:

| Code                             | Missing condition                          | Editing destination                      |
| -------------------------------- | ------------------------------------------ | ---------------------------------------- |
| MISSING_PROFILE_PHOTO            | Null or zero-byte photograph               | `/profile/personal-info`                 |
| MISSING_PROFESSIONAL_DESCRIPTION | Null, empty or whitespace-only description | `/profile/presentation`                  |
| MISSING_SPECIALTY                | No technical areas                         | `/mentors/participation/technical-areas` |
| MISSING_WORK_EXPERIENCE          | No work experience                         | `/profile/trajectory/experience`         |

Each item has this contract:

| Field                | Contract                                                                              |
| -------------------- | ------------------------------------------------------------------------------------- |
| `code`               | One of the four stable codes above, once per response                                 |
| `field`              | `photoUrl`, `aboutMe`, `mentorTechnicalAreas` or `workExperiences`, matching the code |
| `message`            | Spanish explanation of the missing information                                        |
| `title`              | Spanish heading from `MENTOR_PROFILE_SUGGESTION_PRESENTATION`                         |
| `benefitDescription` | Spanish explanation of the benefit of completing the section                          |
| `editReference`      | `{ section: field, action: "edit" }`; semantic reference, not a frontend URL          |

The mapper preserves photo, description, specialty and experience order and computes `pendingCount` as the final array length (0..4). A complete profile returns `data: { suggestions: [], pendingCount: 0 }`. For example:

```json
{
  "statusCode": 200,
  "ok": true,
  "detail": "OK",
  "data": {
    "suggestions": [
      {
        "code": "MISSING_SPECIALTY",
        "field": "mentorTechnicalAreas",
        "message": "Agrega al menos un área técnica como especialidad.",
        "title": "Completa tus áreas técnicas",
        "benefitDescription": "Ayuda a los estudiantes a identificar tus especialidades.",
        "editReference": { "section": "mentorTechnicalAreas", "action": "edit" }
      }
    ],
    "pendingCount": 1
  }
}
```

JWT signature/expiry and the reloaded session are checked; identity comes exclusively from `CurrentUser`, never a query or body-selected user. Invalid/missing sessions return 401; inactive accounts or sessions without valid roles are rejected by existing authorization. No extra mentor role guard is added. Repository/session failures return HTTP 500 with `ok: false`, `data: null`, `code: "INTERNAL_ERROR"` and a generic public detail. A failed query is never converted into an empty suggestions array.

Each request reads current persisted values. Saving photo, presentation, technical areas or experience and querying again removes only resolved suggestions; discarding a draft does not change them. Detection is read-only and does not impose mentoring restrictions. A professional headline does not replace specialty, and empty orientation types do not create a fifth backend suggestion.

Active participation requires an active user and a mentor role with `deletedAt = null` and `startAt <= now`. Pending requests and offers do not substitute for that role. Deleted, deactivated or future roles are not active. `isAvailableForMentoring = false` does not exclude an otherwise active mentor.

**Pending business decision:** There is no official rule equating mentoring unavailability with paused participation. Do not introduce `PAUSED` or change existing participation behavior until that decision is defined.

A specialized snapshot selects photo byte length, description and existence flags in one read, without loading photo/document binaries. Suggestions are not persisted and do not block mentoring. Orientation types do not substitute for technical areas. A valid session without active mentor participation receives an empty list: combine this with participation status rather than interpreting it as a complete profile. Participation distinguishes ACTIVE, DEACTIVATED and NEVER; availability is independent of role participation.

Frontend primary suggestions consume the backend metadata. Additional recommendations cover professional headline, education, orientations and upcoming availability. Queries refresh on mount and window focus; technical-area saves invalidate suggestions and participation. Errors retain an explicit retry state and must not imply completeness. The two endpoints are separate reads, not an atomic snapshot.

```mermaid
sequenceDiagram
  actor Mentor
  participant UI as Participation
  participant API as MentorsController
  participant Service as Suggestions service
  participant Repo as MentorsRepository
  Mentor->>UI: Open participation
  UI->>API: GET me/profile-suggestions with session
  API->>Service: Evaluate authenticated user
  Service->>Repo: Read active mentor snapshot
  Repo-->>Service: Photo length, description, existence flags
  Service-->>API: Ordered missing fields
  API-->>UI: Mapped suggestions and count
  UI-->>Mentor: Optional edit links or retry state
```

## Participation, capacity and offers

Capacity is `ceil(approvedGraduates * percentage / 100)`, with fallback percentage 40 when absent. Occupied capacity is active mentors plus OFFERED offers whose expiry is still in the future. Available capacity is `max(0, capacity - occupied)`. Approved graduates require an active user, a current nondeleted titulado role and an approved access request. Mentor counting requires an active user and current nondeleted mentor role.

Intake verifies catalog selections, eligibility and existing participation. Activation and request creation use Idempotency-Key. Waiting requests are accepted when no capacity remains; existing requests or reserved offers prevent bypassing the intake flow. Preference updates and cancellation operate on the authenticated user's PENDING request.

Capacity mutations and reconciliation share PostgreSQL transaction advisory lock 1436, UTC transaction time and ReadCommitted isolation. Reconciliation expires overdue offers and their OFFERED requests, then selects eligible PENDING requests by queuedAt ascending and ID ascending. It revalidates user roles, catalog selections and absence of existing offers, locks selected rows, and reserves available capacity for 24 hours. The worker reconciles at startup and every 15 seconds outside the test environment. After the capacity transaction commits, it scans the durable set of unexpired OFFERED rows, asks the public notifications service whether the recipient/type/group notice already exists, and only calls `notify()` when it is absent; it never performs network work while holding the capacity lock. Administrative percentage updates also reconcile in the same transaction, and their new offers are discovered by the worker. GET overview/history endpoints do not reconcile or write business state. Reducing capacity never removes existing mentors or valid offers.

The producer validates `{ offerId, expiresAt }` with Zod and uses `/mentors/participation` plus `groupKey=mentor-slot-offer:<offerId>`. The persisted central notification suppresses routine `notify()` calls on later ticks and after restarts. Central notification creation remains the race-safe second defense: it serializes that recipient/group combination with a PostgreSQL advisory transaction lock and skips an existing in-app notice when two instances observed it as absent concurrently. Confirmed and expired offers are excluded. Channel selection remains owned by notifications preferences and the catalog; the producer does not force push and email together. This central row is not a mentor-owned processing outbox: a crash after it commits but before an external dispatcher completes cannot provide exactly-once external delivery or a durable external-channel retry without an approved delivery outbox.

```mermaid
flowchart TD
  Lock[Capacity transaction lock] --> Expire[Expire overdue offers and requests]
  Expire --> Count[Calculate available capacity]
  Count --> Select[Select eligible waiting requests in FIFO order]
  Select --> Reserve[Create 24-hour offers]
  Reserve --> Commit[Commit request and offer state together]
  Commit --> Scan[Scan current offers after commit]
  Scan --> Existing{Central notice exists?}
  Existing -->|No| Notify[Validate and call central notifications]
  Existing -->|Yes| Skip[Skip the repeated call]
```

## Models and relationships

The implementation uses users/user_roles/roles, access_requests/access_request_statuses, technical_areas, orientation_types and mentor selection relations. Capacity settings, participation requests, slot offers and intake idempotency records support allocation. Profile suggestions read users, technical-area relations and work experience; they introduce no stored recommendation entity.

```mermaid
flowchart LR
  User[User] --> Roles[User roles]
  User --> Request[Participation requests]
  Request --> Offer[Slot offer]
  User --> Areas[Selected technical areas]
  User --> Orientations[Selected orientation types]
  Settings[Capacity settings] --> Allocation[Allocation calculation]
  Offer --> Allocation
  Roles --> Allocation
```

Database field definitions, indexes, SQL-only constraints and deletion behavior are documented in the [Database README](../../backend/prisma/README.md). The mentor section requires review by the Database team.

## Endpoints and authorization

Paths below are relative to `/api`. Session routes derive ownership from CurrentUser; UUID path inputs are validated. Administrative routes also require the administrativo role.

| Method and path                                   | Purpose and access                                                          |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| GET `/mentors`                                    | Public active mentor list                                                   |
| GET `/mentors/directory`                          | Authenticated filtered directory, pages of six, including affinity ordering |
| GET `/mentors/:userId`                            | Public active mentor profile                                                |
| GET `/mentors/:userId/photo`                      | Public binary photo; UUID v4, no session required                           |
| GET `/mentors/:userId/similar`                    | Public similar mentors, maximum three                                       |
| GET `/mentors/me/profile-suggestions`             | Authenticated optional completeness suggestions                             |
| GET `/mentors/me/participation`                   | Authenticated participation status                                          |
| GET, PATCH `/mentors/me/technical-areas`          | Current active mentor's technical selections                                |
| GET, PATCH `/mentors/me/orientation-types`        | Current active mentor's orientation selections                              |
| GET `/mentors/capacity`                           | Authenticated capacity snapshot                                             |
| POST `/mentors/activate`                          | Authenticated idempotent activation                                         |
| POST `/mentor-participation/requests`             | Authenticated idempotent waiting request                                    |
| GET `/mentor-participation/requests/me`           | Current user's latest relevant request                                      |
| GET `/mentor-participation/requests/me/history`   | Current user's history                                                      |
| PATCH, DELETE `/mentor-participation/requests/me` | Update pending preferences or cancel                                        |
| POST `/mentors/offers/:offerId/confirm`           | Confirm the authenticated user's offer                                      |
| POST `/mentors/me/leave`                          | Leave mentor participation                                                  |
| GET, PUT `/admin/mentor-capacity`                 | Administrative overview and percentage update                               |
| GET `/admin/mentor-capacity/requests`             | Administrative FIFO waiting list                                            |
| GET `/admin/mentor-capacity/offers`               | Administrative offer history                                                |

### Public photograph

`GET /mentors/:userId/photo` validates UUID v4 and returns a `StreamableFile`, outside the JSON success envelope. It sends `Cache-Control: no-store`, `Content-Disposition: inline`, byte `Content-Length` and detected `Content-Type`. Normal uploads permit `image/jpeg` and `image/png`. The existing download detector also recognizes `application/pdf` if such bytes are already stored; it does not reapply upload validation. The `v` URL suffix used by profiles is a cache-version hint, not an access requirement.

Invalid UUIDs return 400. Missing/inactive mentor (`MENTOR_NOT_FOUND`), missing profile (`PROFILE_NOT_FOUND`) or absent/unrecognized photo (`PHOTO_NOT_FOUND`) return 404. Unexpected repository failures return 500 (`INTERNAL_ERROR`). Error responses use the standard JSON error envelope. There is no authentication guard or role-based 403 on this public operation.

## History and errors

User history orders by queuedAt descending, then ID descending. Without pagination parameters it preserves the legacy array response. With either parameter it returns items, page, limit, total and totalPages; page defaults to 1 (maximum 1000000), limit to 10 (maximum 100). The frontend loads history only on its tab, includes session and page in the query key, and renders loading, empty, error/retry, pagination and a read-only detail containing selection counts.

Invalid input is rejected before service execution. Authentication/authorization failures remain 401/403; absent mentors and invalid selections retain existing domain exceptions. Intake conflicts retain their existing machine-readable codes and participation navigation. No new HTTP contract is introduced here.

## Verification boundaries

Existing tests exercise all 16 combinations of missing fields, order, uniqueness, count, mapper metadata, authenticated identity isolation, invalid sessions, active/unavailable and inactive/future roles, error propagation, edits and discarded drafts. The optimized snapshot uses parameterized `Prisma.sql`, photo byte length and two `EXISTS` flags in one coherent read; it does not fetch binaries or certifications. No latency improvement is claimed. Historical coverage and database checks are not a certification of current integration; rerun focused checks after synchronization. Independent participation and suggestions reads must be refreshed together if participation changes between requests.

## Action styling

Opening or dismissing participation dialogs uses neutral action styles. Deactivation is presented as a participation state change.

## Sprint History

### Sprint 3

- Similar mentor ranking and profile navigation.
- Read-only completeness suggestions with edit links and refreshed query state.
- Temporary technical-area/orientation preview and explicit save/discard.
- Administrative capacity, FIFO reservations and expiry visibility.
- Paginated authenticated request history and read-only detail.

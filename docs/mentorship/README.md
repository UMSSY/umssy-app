# Mentorship

## Purpose and responsibilities

`frontend/src/modules/mentorship` provides the directory, public mentor profile, activation flow, and orientation settings. It consumes the backend domains `mentors`, `technical-areas`, and `orientation-types`. The radar directory integration uses the areas exported by the `radar-chart` module's `index.ts`, without importing its private folders.

## Architecture and dependencies

```mermaid
flowchart LR
  Radar[Radar area] --> Directory[MentorDirectoryView]
  Directory --> Query[useMentorDirectory]
  Query --> API[mentor-directory.service: api-client]
  API --> Mentors[mentors domain]
  Directory --> Catalogs[Technical areas and orientation types]
  Directory --> Profile[MentorProfileView]
  Wizard[Activation and draft] --> Mentors
```

Navigation uses server routes that render interactive views. TanStack Query handles queries and errors. The wizard draft uses shared storage services; components do not open IndexedDB.

## Flows and rules

```mermaid
sequenceDiagram
  actor Owner as Profile owner
  participant Radar as RadarProfileView
  participant Directory as MentorDirectoryView
  participant API as Mentors API
  Owner->>Radar: Select an area
  Radar->>Directory: Navigate with area and from=radar
  Directory->>API: Query with available=true
  API-->>Directory: Page, total, and effective ordering
  Directory-->>Owner: Available results and filters
```

The URL preserves search, area, orientation, availability, ordering, and page. Parameters are normalized before querying. Navigation from radar forces availability and uses its six areas; empty, loading, and error states are explicit. The client allows retrying and does not invent mentors when a query fails. Score simulation belongs to the radar module and does not change profiles or availability.

Activation sends `Idempotency-Key` through the shared service to prevent duplicate operations on retry. Orientation settings come from the catalog and are updated for the authenticated mentor. Backend authorization remains authoritative.

## Consumed endpoints

| Method and path | Purpose |
| --- | --- |
| `GET /mentors/directory` | Directory with filters, pagination, and ordering |
| `GET /mentors/:id` | Mentor profile |
| `POST /mentors/activate` | Idempotent activation |
| `GET /technical-areas` | Technical area catalog |
| `GET /orientation-types` | Orientation type catalog |
| `GET /mentors/me/orientation-types` | Current mentor's orientation types |
| `PATCH /mentors/me/orientation-types` | Update the current mentor's orientation types |

Services extract `data` from the common response contract and use the centralized HTTP client. Profile errors become an unavailable state where appropriate; other errors are presented to the user for retry.

## Validation

Tests cover HTTP services, navigation and normalization, radar filters, query states, catalogs, profiles, and the wizard. Directory integration changes must preserve the mandatory availability filter and area mapping.

## Sprint History

### Sprint 3

- Radar directory integration: navigate from a radar area to the available mentor directory.
- Radar simulation based on actual mentor queries.
- Standards alignment: consume areas through the radar module's public API.

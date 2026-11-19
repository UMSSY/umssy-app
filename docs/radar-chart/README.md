# Affinity radar

## Purpose and responsibilities

`frontend/src/modules/radar-chart` presents the owner's published radar, supporting evidence, comparisons between publications, and mentorship simulations. It consumes [radar-integration](../radar-integration/README.md), which calculates and persists scores. Routes only render views; interactive views and hooks declare `use client`.

## Architecture and dependencies

```mermaid
flowchart LR
  Route[profile/radar: server] --> View[RadarProfileView: client]
  View --> Query[useLiveRadar: TanStack Query]
  Query --> Api[radarIntegrationApi]
  Api --> Backend[radar-integration]
  View --> Mentors[mentorship: available mentors]
  View --> Evidence[CV and certification evidence]
```

HTTP services use `shared/services/api-client`; they neither store tokens nor open IndexedDB. Cross-domain integrations import the owning module's `index.ts`. Each contract and props type has its own file in `types/`.

## Flows and business rules

```mermaid
sequenceDiagram
  actor Owner as Profile owner
  participant View as RadarProfileView
  participant Query as useLiveRadar
  participant API as Radar API
  Owner->>View: Open My radar
  View->>Query: Query with the current session
  Query->>API: GET /profile/me/radar
  API-->>Query: Current and previous publications and processing state
  Query-->>View: Six axes and approved evidence
  opt Processing is pending
    loop While hasPending or processingStatus=pending
      Query->>API: Poll every 1.5 seconds
    end
  end
```

- Persisted identifiers are `desarrollo`, `cloud-devops`, `data-ai`, `qa`, `ciberseguridad`, and `gobernanza-ti`; translating code names does not change these contracts.
- Scores come from the backend, rather than demonstration data. An older version cannot replace a newer cached version. If the session changes, the in-flight response is discarded.
- An empty state appears when there is no publication; a publication without approved skills keeps all six axes at zero.
- Comparisons use the two latest publications and their dates. Pending or failed recalculation preserves the latest valid publication and allows retrying.
- Mentorship integration: selecting an area queries the actual directory of available mentors. When results exist, the simulation estimates up to **+1 point**, capped at 10, and calculates the projected average. No projection is applied when there are no mentors or a query fails. Closing the dialog clears the projection. This illustrative estimate never changes the published radar.
- Administrative review consumes authorized backend APIs; hiding controls does not replace server authorization.

## Consumed endpoints

| Method and path                              | Purpose                                                      |
| -------------------------------------------- | ------------------------------------------------------------ |
| `GET /profile/me/radar`                      | Current and previous radar publications and processing state |
| `POST /profile/me/radar/recalculations`      | Retry analysis and publication                               |
| `POST /profile/me/radar/cv-rescans`          | Reanalyze the current CV                                     |
| `GET /radar-document-reviews?filter=pending` | Administrative document review queue                         |
| `PATCH /radar-document-reviews/:id`          | Decide, reprocess, or revoke a document                      |
| `GET /radar-document-reviews/:id/file`       | Administrative document preview                              |
| `GET /radar-reviews`                         | Skill and CV review queue                                    |
| `PATCH /radar-reviews/:kind/:id`             | Evidence review decision                                     |

JSON responses follow `{ statusCode, data, detail, ok }`; supporting files are binary responses. Permissions and errors are documented in [radar-integration](../radar-integration/README.md) and Swagger.

## Validation

Tests cover queries, version preservation, empty and error states, comparisons, area interactions, simulation, and review. The minimum coverage is 80%; Vitest measures it independently of the number of passing tests.

## Sprint History

### Sprint 3

- Mentorship integration: available mentors by area and illustrative simulation.
- Comparisons between publications and navigation to evidence.
- Document verification: document verification results and integrated administrative review.
- Standards alignment: individual types, English identifiers, public exports, and static styles using Tailwind.

## Review recovery and historical navigation

The radar view consumes `/profile/me/radar/snapshots/:id` when opened with `?snapshot=<id>` from the central Notifications inbox. It displays the historical version and its previous publication for comparison, with loading/error feedback and a return action. Notification listing and read actions remain in the Notifications interface.

Document and skill panels share `radar-review-operation.service.ts`. IndexedDB persists an operation UUID per authenticated administrator and intent. The service queries operation status, sends only after 404, validates the full returned identity, and clears only a completed matching operation. Mount recovery uses the same validation and cleanup. Failed queries or decisions retain the operation for retry. Hooks adapt endpoints and invalidate review queues; contracts live in separate files under `types/`.

```mermaid
sequenceDiagram
    participant Inbox as Notifications inbox
    participant View as Radar view
    participant API as Radar API
    Inbox->>View: Navigate with snapshot ID
    View->>API: GET authenticated historical snapshot
    API-->>View: Snapshot and previous version or 404
    View->>View: Compare or return to current radar
```

### Sprint 3 integration updates

- Shared recoverable review protocol and central notification navigation.
- Semantic error styles and shared conditional class utility.

`useHistoricalRadar` owns the historical query key, session scope, request and loading/error states. The view selects the snapshot from navigation parameters and renders the result; it no longer defines its own HTTP query.

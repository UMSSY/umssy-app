# Applications

## Purpose

Lets a graduate or student follow the job applications they have submitted ("Mis postulaciones"): list them with their affinity percentage, filter and sort them, withdraw an active one, apply again to a vacancy after withdrawing, and open a chat with the company's recruiter. It also exposes the notification that tells the applicant when a recruiter changes the status of an application.

Creating an application (the "Postularme" action) belongs to the [matching](../matching/README.md) module. This module starts once the application exists.

Owner: group 5.

## Functionality

| Feature                                                                 | Where                                                |
| ----------------------------------------------------------------------- | ---------------------------------------------------- |
| List my applications with vacancy, company, affinity, status and date   | `GET /applications/me`, `/vacancies/my-applications` |
| Filter by status and sort by vacancy, company, affinity, status or date | Query params and the client-side selectors           |
| Withdraw an application that is in review or in interview               | `PATCH /applications/:id/withdraw`                   |
| Show withdrawn applications only on demand (toggle)                     | Frontend                                             |
| Apply again to a vacancy after withdrawing ("Volver a postular")        | `PATCH /applications/:id/reactivate`                 |
| Contact the recruiter from an application                               | `GET /applications/:id/contact` + chat deep link     |
| Notify the applicant when the recruiter changes the status              | `ApplicationsService.notifyStateChanged`             |

## Architecture

```mermaid
flowchart LR
  subgraph Frontend["frontend/src/modules/applications"]
    V[ApplicationsView] --> H[hooks: my-applications, withdraw, reactivate, contact]
    H --> S[application.service]
  end
  S -->|HTTP| C[ApplicationsController]
  subgraph Backend["backend/src/modules/applications"]
    C --> SV[ApplicationsService]
    SV --> R[ApplicationsRepository]
    SV --> M[ApplicationMapper]
  end
  R --> DB[(job_applications, job_application_statuses)]
  SV -->|affinity score| MT[matching: JobRecommendationsService]
  SV -->|recruiters of a company| US[users: UsersService]
  SV -->|notify| NT[notifications: NotificationsService]
  CH[chat] -->|validateApplicationForChat| SV
  RD[radar-integration] -->|recruiter decision, notifyStateChanged| SV
```

## Key flows

### List my applications

```mermaid
sequenceDiagram
  actor U as Graduate / student
  participant F as ApplicationsView
  participant A as ApplicationsController
  participant S as ApplicationsService
  participant R as ApplicationsRepository
  participant M as JobRecommendationsService
  U->>F: Opens Mis postulaciones
  F->>A: GET /applications/me?status&sortBy&sortOrder
  A->>S: findMyApplications(userId, query)
  S->>R: findByUserId(userId, query)
  R-->>S: applications with offer, company and status
  S->>M: scoresForOffers(userId, offerIds)
  M-->>S: affinity per offer
  S-->>A: items sorted (collator "es", ties by date, title, id)
  A-->>F: 200 [{ id, jobOfferId, vacancyTitle, companyName, affinityPercentage, status, appliedDate }]
  F-->>U: Table (desktop) or cards (mobile), withdrawn hidden by default
```

### Withdraw and apply again

```mermaid
sequenceDiagram
  actor U as Applicant
  participant F as ApplicationsView
  participant A as ApplicationsController
  participant S as ApplicationsService
  participant R as ApplicationsRepository
  U->>F: Withdraw (confirmation dialog)
  F->>A: PATCH /applications/:id/withdraw
  A->>S: withdrawApplication(id, userId)
  S->>R: findById(id)
  alt not found
    S-->>F: 404 APPLICATION_NOT_FOUND
  else belongs to another user
    S-->>F: 403 APPLICATION_FORBIDDEN
  else
    S->>R: withdraw(id, userId, [En revisión, Entrevista], Retirada)
    alt no row updated
      S-->>F: 400 APPLICATION_NOT_WITHDRAWABLE
    else
      S-->>F: 204
    end
  end
  U->>F: Volver a postular (confirmation dialog)
  F->>A: PATCH /applications/:id/reactivate
  A->>S: reactivateApplication(id, userId)
  S->>R: reactivateApplication(id, userId, now)
  Note over R: Updates only if status is Retirada and the vacancy is Publicada and not expired. Sets status En revisión and appliedAt = now
  alt updated one row
    S-->>F: 204
  else
    S-->>F: 409 Conflict
  end
```

### Contact the recruiter

```mermaid
sequenceDiagram
  actor U as Applicant
  participant F as useContactApplication
  participant A as ApplicationsController
  participant S as ApplicationsService
  participant US as UsersService
  participant CH as Chat
  U->>F: Contactar
  F->>A: GET /applications/:id/contact
  A->>S: getApplicationContact(id, userId)
  S->>US: findActiveRecruitersByCompany(companyId)
  S-->>F: 200 { applicationId, vacancyTitle, companyName, recruiters[] }
  alt no recruiters
    F-->>U: Toast "La empresa todavía no tiene reclutadores disponibles"
  else
    F->>CH: /chat?contactId=<first recruiter>&contextType=POSTULACION&contextId=<application id>
    CH->>S: validateApplicationForChat(applicationId, studentId, companyId)
  end
```

### Status change notification

```mermaid
sequenceDiagram
  participant RR as Recruiter decision (radar-integration)
  participant S as ApplicationsService
  participant N as NotificationsService
  RR->>S: notifyStateChanged({ recipientId, previousStatus, newStatus, jobTitle, companyName })
  alt same status or new status is Retirada
    S-->>RR: nothing is sent
  else
    S->>S: validate payload with StateChangedDto (zod)
    S->>N: notify(APPLICATION_STATUS_CHANGED, actionUrl = APP_URL/vacancies/my-applications) with 5 s timeout
    N-->>S: result
  end
  Note over S: Any failure is logged and swallowed so the recruiter's decision is never blocked
```

## Business rules

- Statuses are the catalog `job_application_statuses`: `En revisión`, `Entrevista`, `Aceptada`, `No seleccionado`, `Retirada`. In code they are the `ApplicationStatus` enum.
- Only the owner of an application can read, withdraw, reactivate or contact from it. Withdraw/reactivate answer 404 when it does not exist and 403 when it belongs to someone else; contact answers 404 in both cases so it does not reveal other users' applications.
- An application can be withdrawn only from `En revisión` or `Entrevista`. The check is part of the `UPDATE ... WHERE`, so a concurrent status change is rejected instead of overwritten.
- An application can be reactivated only from `Retirada`, only if the vacancy is `Publicada` and has not expired. Reactivating moves it to `En revisión` and resets `appliedAt` to the current time. The `(job_offer_id, user_id)` pair is unique, so the same row is reused.
- Contact is allowed only for `En revisión`, `Entrevista` and `Aceptada`; otherwise 403 `APPLICATION_CONTACT_RESTRICTED`. The chat opens with the first active recruiter of the vacancy's company.
- Chat validation (`validateApplicationForChat`) rejects the conversation when the application does not belong to the student, does not belong to the company, or is rejected, withdrawn or cancelled.
- Affinity is not stored: it is calculated on every request by the matching module (see [matching](../matching/README.md)). When no score is available for a vacancy, the item shows 0.
- Notifications are sent only when the status really changes and never for `Retirada` (the applicant did it themselves). Delivery is best effort with a 5 second timeout.
- Dates are shown in Bolivia time with the shared `formatBoliviaDate` formatter.

## Endpoints

All endpoints require a valid JWT and the role `titulado` or `estudiante`.

| Method | Path                           | Description                                                                                                                                                              | Success                          | Errors                                                                                       |
| ------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- | -------------------------------------------------------------------------------------------- |
| GET    | `/applications/me`             | Own applications. Query: `status` (one of the five statuses), `sortBy` (`vacancy`, `company`, `affinity`, `status`, `date`), `sortOrder` (`asc`, `desc`, default `desc`) | 200 `ApplicationItemResponse[]`  | 400 invalid query                                                                            |
| PATCH  | `/applications/:id/withdraw`   | Withdraws an application                                                                                                                                                 | 204                              | 400 `APPLICATION_NOT_WITHDRAWABLE`, 403 `APPLICATION_FORBIDDEN`, 404 `APPLICATION_NOT_FOUND` |
| PATCH  | `/applications/:id/reactivate` | Applies again after withdrawing                                                                                                                                          | 204                              | 403 `APPLICATION_FORBIDDEN`, 404 `APPLICATION_NOT_FOUND`, 409 not reactivable                |
| GET    | `/applications/:id/contact`    | Recruiters available to chat with                                                                                                                                        | 200 `ApplicationContactResponse` | 403 `APPLICATION_CONTACT_RESTRICTED`, 404 `APPLICATION_NOT_FOUND`                            |

Internal contract used by other modules (not HTTP): `notifyStateChanged`, `validateApplicationForChat`, `findRecruitmentApplicationsByUser`, `findRecruitmentApplicants` and `recordRecruiterDecision`.

## Dependencies

| Direction | Module                            | Use                                                                                                 |
| --------- | --------------------------------- | --------------------------------------------------------------------------------------------------- |
| Uses      | [matching](../matching/README.md) | `JobRecommendationsService.scoresForOffers` for the affinity column                                 |
| Uses      | job-offers                        | `JobOffersService` for the vacancy data                                                             |
| Uses      | users                             | `UsersService.findActiveRecruitersByCompany` (the module does not read users or companies directly) |
| Uses      | notifications                     | `NotificationsService.notify` with `APPLICATION_STATUS_CHANGED`                                     |
| Used by   | chat                              | `validateApplicationForChat`                                                                        |
| Used by   | radar-integration                 | recruiter decision on an application and `notifyStateChanged`                                       |

## Data

Tables `job_applications` and `job_application_statuses` (see [backend/prisma/README.md](../../backend/prisma/README.md)). Vacancy and company fields are read only through the relations of the application (`job_offers`, `companies`); recruiters are read through `UsersService`.

## Frontend

- Route: `/vacancies/my-applications` (`ApplicationsView`).
- Responsive: table on desktop, cards on mobile. Status filter, sort selector (ten options), "show withdrawn" toggle and empty/error states with retry.
- Withdraw and reactivate use confirmation dialogs; the reactivation button and dialog use the green `success` color of the design tokens.
- The contact action shows a toast when the call fails for a retryable reason (network or 5xx) and offers to retry; restricted statuses are blocked in the client before calling the API.

## Design decisions

- **Status changes are done with a conditional `UPDATE`** (`updateMany` with the allowed previous statuses) instead of read-then-write, to be safe under concurrent clicks.
- **Reactivation reuses the row** because `(job_offer_id, user_id)` is unique; the applicant sees the same application come back to `En revisión` with today's date.
- **Withdrawn applications are hidden by default** and shown only through a dedicated toggle, so the main list shows only live processes.
- **Contact goes through the chat module**: this module only answers who can be contacted and validates the context; messages and delivery belong to chat.
- **Other modules are reached through their services**, never their tables (backend standard), which is why recruiters come from `UsersService`.
- **Notification failures never break the main action**: errors are logged and swallowed, with a timeout.

## Action styling

Withdrawing an application updates its status through the withdrawal PATCH endpoint. The withdrawal control uses the outlined action style and reactivation remains available through its own confirmation flow.

## Sprint History

### Sprint 3

- "Mis postulaciones" list with affinity, status and date, empty and error states.
- Filter by status, ten sort options, withdrawn applications behind a toggle, mobile cards.
- Withdraw with confirmation and conflict-safe update.
- Apply again after withdrawing ("Volver a postular") with confirmation.
- Contact the recruiter from an application through the contextual chat.
- Status change notification to the applicant, with payload validation and best-effort delivery.
- Dates unified to Bolivia time with a single formatter.

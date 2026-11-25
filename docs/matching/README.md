# Matching

## Purpose

Connects applicants with vacancies. It calculates how well a person fits a vacancy (the **affinity**), ranks the published vacancies for them ("Vacantes para ti"), shows which requirements they meet and which are pending, and creates the job application. It also hosts the text analysis that recognizes catalog skills inside free text (work experience descriptions and vacancy requirements).

The skill detection pipeline in `nlp` and the recruiter-facing views in `radar-integration` are separate modules referenced here where they integrate with matching.

## Functionality

| Feature                                                                                 | Where                                                           |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Recommended vacancies ordered by affinity, only above 0 %                               | `GET /job-offers/recommendations`, `/vacancies/recommended`     |
| Affinity detail of one vacancy: requirements that are met or pending                    | `GET /job-offers/:id/match`, `/vacancies/recommended/[id]`      |
| Apply to a vacancy with the required consents, one application per person and vacancy   | `POST /job-offers/:id/applications`                             |
| Know whether I already applied to a vacancy                                             | `GET /job-offers/:id/applications/me`                           |
| List the applicants of a vacancy for its company                                        | `GET /companies/:companyId/job-offers/:jobOfferId/applications` |
| Detect catalog skills in a work experience description (preview and persisted analysis) | `POST /work-experiences/:id/skills/preview` and `/analysis`     |
| Detect catalog skills in the requirements text of a vacancy                             | `POST /matching/requirements/terms`                             |
| Get or update the authenticated user's job alert preference                             | `GET/PUT /job-offers/alert-preference`                          |

### Job alert preferences

The `GET /job-offers/alert-preference` endpoint returns the authenticated user's effective `mode`, stored `savedMode` and `canFilterByProfile` capability. The `PUT /job-offers/alert-preference` endpoint accepts `{ "mode": "ALL" | "MATCHING" | "HIGH_AFFINITY" }` and returns the updated preference. Both endpoints require an authenticated `estudiante` or `titulado`.

| Mode            | Meaning                                                    |
| --------------- | ---------------------------------------------------------- |
| `ALL`           | Receive alerts without an affinity filter.                 |
| `MATCHING`      | Request alerts for vacancies with affinity above 0.        |
| `HIGH_AFFINITY` | Request alerts for vacancies with affinity of at least 70. |

| Capability                  | Behavior                                                                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `canFilterByProfile: true`  | The user's profile has skills, so affinity-based modes are available.                                                                        |
| `canFilterByProfile: false` | The effective `mode` is `ALL`; `savedMode` retains the stored choice. Attempting to save a filtered mode raises `JOB_ALERT_SKILLS_REQUIRED`. |

The preference endpoints store and retrieve choices. The matching module also selects alert recipients through `JobAlertRecipientsService`; the [job-offers](../job-offers/README.md) module uses it when a vacancy is published and sends the notification itself. The `nlp` and `radar-integration` modules retain their own responsibilities.

### Job alert recipient selection

`JobAlertRecipientsService.resolve(vacancy)` obtains active contacts with eligible roles through `UsersService.findActiveContactsByRoles` and their stored filtered preferences through `JobAlertPreferencesRepository.findFilteredModes`.

Contacts without a stored filtered mode are included directly. Contacts with a filtered preference are evaluated in batches using `VacancyScoringService.getCandidate` and `evaluate`, followed by `passesJobAlertFilter`. A candidate with no skills is included without calculating affinity. If affinity evaluation fails, the service logs a warning and excludes that candidate from the result. The service returns recipient user IDs; it does not deliver notifications.

```mermaid
flowchart TD
  A[New vacancy alert] --> B[JobAlertRecipientsService.resolve]
  B --> C[UsersService: active eligible contacts]
  B --> D[JobAlertPreferencesRepository: filtered modes]
  C --> E{Stored filtered mode?}
  D --> E
  E -->|No| F[Include recipient]
  E -->|Yes| G[VacancyScoringService.getCandidate]
  G --> H{Candidate has skills?}
  H -->|No| F
  H -->|Yes| I[VacancyScoringService.evaluate]
  I --> J{passesJobAlertFilter?}
  J -->|Yes| F
  J -->|No| K[Exclude recipient]
  G -->|Error| K
  I -->|Error| K
  F --> L[Return recipient user IDs]
```

## Architecture

```mermaid
flowchart LR
  subgraph Frontend["frontend/src/modules/matching"]
    RV[RecommendedJobsView] --> JM[useRecommendedJobs]
    DV[JobMatchDetailView] --> UJ[useJobMatch]
    AC[JobApplicationAction] --> UA[useJobApplication]
  end
  JM -->|HTTP| JR[JobRecommendationsController]
  UJ -->|HTTP| JMC[JobMatchController]
  UA -->|HTTP| JAC[JobApplicationsController]
  subgraph Backend["backend/src/modules/matching"]
    JR --> RS[JobRecommendationsService]
    JMC --> MS[JobMatchService]
    RS --> VS[VacancyScoringService]
    MS --> VS
    RS --> VR[VacancyRankingService]
    VS --> WS[WeightedScoreService]
    VS --> RT[RequirementTermsService]
    RT --> NLP[NlpService]
    RT --> SC[SkillsClassifierService]
    JAC --> JA[JobApplicationsService]
  end
  VS --> US[skills: UserSkillService]
  VS --> CP[CandidateProfileService]
  RS --> JO[job-offers: JobOffersService]
  RT --> CAT[skills: SkillCatalogService]
  JA --> RC[radar-integration: consents]
  JA --> DB[(job_applications)]
```

## Key flows

### Affinity of a vacancy

```mermaid
sequenceDiagram
  participant S as VacancyScoringService
  participant U as UserSkillService
  participant T as RequirementTermsService
  participant W as WeightedScoreService
  S->>U: getUserSkills(userId) (empty list if there is no profile)
  S->>S: toVacancyRequirements(vacancy) (skills chosen by the company)
  S->>T: extractAndMatchRequirements(vacancy description)
  T-->>S: catalog skills recognized in the text
  S->>S: add recognized skills that the company did not choose
  S->>S: buildScoreRequirements: each skill is Cumple if the person has it, otherwise Pendiente
  S->>W: calculate(requirements)
  W-->>S: integer 0 to 100
```

### Recommendations

```mermaid
sequenceDiagram
  actor U as Applicant
  participant F as RecommendedJobsView
  participant C as JobRecommendationsController
  participant S as JobRecommendationsService
  U->>F: Opens Vacantes para ti
  F->>C: GET /job-offers/recommendations
  C->>S: recommendations(userId)
  alt the person has no skills
    S-->>F: { isProfileComplete: false, items: [] }
    F-->>U: Message asking to complete the profile
  else
    S->>S: score every published and not expired vacancy
    S->>S: drop score 0, sort by score desc, then publication date desc, then id
    S-->>F: { isProfileComplete: true, items: [...] }
    F-->>U: Cards with score bar, filters by modality, text and high affinity
  end
```

### Apply to a vacancy

```mermaid
sequenceDiagram
  actor U as Applicant
  participant F as JobApplicationAction
  participant A as JobApplicationsController
  participant S as JobApplicationsService
  participant R as JobApplicationsRepository
  U->>F: Postularme
  F-->>U: Dialog with three consents (CV, radar, contact)
  U->>F: Accepts all and confirms (one request even on double click)
  F->>A: POST /job-offers/:id/applications { consent, consentCv, consentContact }
  A->>S: apply(userId, jobOfferId, consents)
  alt a consent is missing
    S-->>F: 400 JOB_APPLICATION_CONSENT_REQUIRED
  else the vacancy is not open
    S-->>F: 404 JOB_OFFER_UNAVAILABLE
  else an active application already exists
    S-->>F: 409 DUPLICATE_JOB_APPLICATION
  else
    S->>R: create (or reactivate a withdrawn one) in status En revisión
    S->>S: record the consents in the same transaction
    S-->>F: 201 { id, jobOfferId, jobTitle, companyName, appliedAt, status }
  end
```

### Skill detection in text

```mermaid
sequenceDiagram
  participant C as Controller
  participant M as MatchingService / RequirementTermsService
  participant D as SkillDictionaryService + NlpService
  participant K as SkillsClassifierService
  participant G as SkillCatalogService
  C->>M: text
  alt empty text
    M-->>C: []
  else
    M->>D: candidate terms (dictionary and requirement terms)
    M->>G: catalog (id, name)
    M->>K: classify(candidates, catalog)
    K-->>M: catalog skills without duplicates
    M-->>C: [{ id, name }]
  end
```

## Business rules

- **Affinity is only about skills today.** The score is the share of required skills the person has, weighted by category. The categories are `skills` (60), `academicRequirements` (25), `experienceRequirements` (10) and `otherRequirements` (5), but only the skills category is filled, and empty categories are left out of the average. Categories without data are skipped, so they do not lower the score. The weights can be changed with the environment variables `MATCH_SCORE_WEIGHT_SKILLS`, `MATCH_SCORE_WEIGHT_ACADEMIC`, `MATCH_SCORE_WEIGHT_EXPERIENCE` and `MATCH_SCORE_WEIGHT_OTHER` (numbers greater than or equal to 0; an invalid value stops the application at startup).
- Required skills of a vacancy are the ones the company selected plus the catalog skills recognized in the vacancy description. Names are compared without case, accents or extra spaces (`buildSkillKey`).
- The score is an integer between 0 and 100. A vacancy without requirements scores 100. It is a guide, not a hiring guarantee (the screen says so).
- Recommendations include only published and not expired vacancies with a score above 0, ordered by score (descending), then publication date (newest first), then id.
- If the person has no skills, recommendations answer `isProfileComplete: false` and an empty list instead of an error.
- "High affinity" in the client means a score of 70 or more.
- Applying needs the three consents (`consent`, `consentCv`, `consentContact`) to be `true`; they are stored in `radar_application_consents` in the same transaction as the application.
- The vacancy must be `Publicada` and not expired. There is one application per `(job_offer_id, user_id)`; applying again after withdrawing reactivates the same row, applying while it is active is a conflict. A simultaneous double click is turned into the same duplicate error when the unique constraint fires.
- `GET /job-offers/:id/applications/me` answers `hasApplied: false` when there is no application or it was withdrawn.
- Skill detection: an empty text gives an empty list, the text is limited to 5000 characters, a term only matches when it equals exactly one catalog skill (if two skills collapse to the same key, only an exact name match is accepted), and symbols are kept (`C++`, `C#`, `Node.js`, `.NET`).
- `POST /work-experiences/:id/skills/preview` never writes anything; `/analysis` replaces the skills detected for that experience. Both check that the experience belongs to the caller.

- **Job alert recipients are selected in matching.** `JobAlertRecipientsService` retrieves active eligible contacts and their filtered preferences, includes contacts without a filtered preference, and applies the selected affinity threshold to candidates with skills. Candidates without skills pass this recipient filter; failures during affinity evaluation exclude the affected candidate. The service only returns the recipients; job-offers sends the notification.

## Endpoints

| Method | Path                                                        | Roles                          | Description                                   | Success                                            | Errors                                                                                               |
| ------ | ----------------------------------------------------------- | ------------------------------ | --------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| GET    | `/job-offers/recommendations`                               | titulado, estudiante           | Vacancies ranked by affinity                  | 200 `{ isProfileComplete, items[] }`               | 401, 403                                                                                             |
| GET    | `/job-offers/alert-preference`                              | titulado, estudiante           | Read effective and saved alert preference     | 200 `{ mode, savedMode, canFilterByProfile }`      | 401, 403                                                                                             |
| PUT    | `/job-offers/alert-preference`                              | titulado, estudiante           | Save alert preference `{ mode }`              | 200 `{ mode, savedMode, canFilterByProfile }`      | 400 `VALIDATION_ERROR`, 422 `JOB_ALERT_SKILLS_REQUIRED`, 401, 403                                    |
| GET    | `/job-offers/:id/match`                                     | titulado, estudiante           | Score and requirements of one vacancy         | 200 `JobMatchResponse`                             | 404 `JOB_OFFER_NOT_AVAILABLE`                                                                        |
| POST   | `/job-offers/:id/applications`                              | titulado, estudiante           | Applies with consents                         | 201 `JobApplicationResponse`                       | 400 `JOB_APPLICATION_CONSENT_REQUIRED`, 404 `JOB_OFFER_UNAVAILABLE`, 409 `DUPLICATE_JOB_APPLICATION` |
| GET    | `/job-offers/:id/applications/me`                           | titulado, estudiante           | Own application for the vacancy               | 200 `{ hasApplied, application }`                  | 401, 403                                                                                             |
| GET    | `/companies/:companyId/job-offers/:jobOfferId/applications` | empresa (owner of the company) | Applicants of a vacancy                       | 200 `CompanyJobApplicantsResponse`                 | 403, 404 `JOB_OFFER_UNAVAILABLE`                                                                     |
| POST   | `/work-experiences/:id/skills/preview`                      | any signed-in user             | Detects skills in `{ text }` without saving   | 200 `{ experienceId, skills[], processingTimeMs }` | 404 `WORK_EXPERIENCE_NOT_FOUND`                                                                      |
| POST   | `/work-experiences/:id/skills/analysis`                     | any signed-in user             | Detects and saves the skills of an experience | 200 same body                                      | 404 `WORK_EXPERIENCE_NOT_FOUND`                                                                      |
| POST   | `/matching/requirements/terms`                              | any signed-in user             | Catalog skills recognized in `{ text }`       | 200 `[{ id, name }]`                               | 400 text too long or missing                                                                         |

The match and recommendation items include `jobOfferId`, `title`, `companyName`, `modality`, `score`, `publishedAt` and `expiresAt`; recommendations also include `skills`, `matchedSkills` and `locationUrl`, and the match detail adds `description`, `hasPendingRequirements` and the list of requirements with status `Cumple` or `Pendiente`.

## Dependencies

| Direction | Module                                                     | Use                                                                                |
| --------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Uses      | job-offers                                                 | Published vacancies and their selected skills (`JobOffersService`)                 |
| Uses      | skills                                                     | User skills (`UserSkillService`) and the catalog (`SkillCatalogService`)           |
| Uses      | educations, work-experience                                | Candidate profile data: career and years of experience (`CandidateProfileService`) |
| Uses      | profile                                                    | `ProfileNotFoundException` (a missing profile counts as no skills)                 |
| Uses      | radar-integration                                          | Stores the consents of an application (`RadarApplicationConsentsService`)          |
| Uses      | job-connect                                                | `SkillDictionaryService` to extract skills from experience text                    |
| Used by   | [applications](../applications/README.md)                  | `scoresForOffers` for the affinity column                                          |
| Used by   | [job-offers](../job-offers/README.md)                      | `JobAlertRecipientsService.resolve` to select who is alerted about a new vacancy   |
| Used by   | [job-offers](../job-offers/README.md) (frontend)           | `/matching/requirements/terms` to detect skills while writing requirements         |
| Used by   | [work-experience](../work-experience/README.md) (frontend) | `/skills/preview` for the live chips                                               |

The alert-recipient flow additionally depends on `UsersService.findActiveContactsByRoles`, `JobAlertPreferencesRepository.findFilteredModes` and `VacancyScoringService` for candidate skills and affinity calculation.

## Data

Reads `job_offers`, `job_offer_skills`, `skills`, `user_skills`, `educations` and `work_experiences`; writes `job_applications` and `radar_application_consents` (see [backend/prisma/README.md](../../backend/prisma/README.md)).

## Frontend

- Routes: `/vacancies/recommended` (`RecommendedJobsView`) and `/vacancies/recommended/[id]` (`JobMatchDetailView`). `JobApplicationAction` is reused by the vacancy detail in [vacancies](../vacancies/README.md).
- The feed has filters by modality and text and a "high affinity" option; "Limpiar" restores the list. Dates use the Bolivia time formatter.
- The module also contains the recruiter views of the radar (candidate list, comparison and CV evidence); their backend is `radar-integration` and they are not described here.
- In the recruiter candidate panel, the "Contactar" button opens or reuses the application conversation with the candidate in the chat side panel. The application is not accepted or rejected from this screen.

- `JobAlertPreferenceSelector` (`job-alert-preference-selector.tsx`) provides the `ALL`, `MATCHING` and `HIGH_AFFINITY` radio options. It loads and saves the authenticated user's preference through `useJobAlertPreference`, disables affinity-based choices when `canFilterByProfile` is false, links to the skills section and provides loading, retry and saved-feedback states.

## Design decisions

- **One scoring service for every screen.** The feed, the detail and the affinity column of "Mis postulaciones" all call `VacancyScoringService`, so the same vacancy never shows two different percentages.
- **Affinity is calculated, not stored.** It always reflects the current profile and vacancy; the cost is recalculating on each request.
- **Weights are configuration.** The rubric can be tuned per environment without changing code. Categories with no requirements are skipped, so adding academic or experience requirements later only needs filling them in `buildScoreRequirements`.
- **Consents are explicit and all required** to apply, and are saved atomically with the application.
- **Skills must match the catalog.** The classifier never invents skills: free text only yields skills that exist in `skills`, and ambiguous names are discarded.
- **Preview and analysis are separate endpoints** so the form can show live suggestions without writing anything.
- **Other modules are called through their services**, never their tables (backend standard).

## Action styling

Discard and reject actions use neutral confirmation controls. The Cancel action dismisses the confirmation without submitting a decision.

## Sprint History

### Sprint 3

- Job alert preferences (`ALL`, `MATCHING`, `HIGH_AFFINITY`) with profile-skill restrictions, a frontend selector and recipient selection through matching.
- Recommended vacancies ordered by affinity with filters, empty states and the explanation that affinity is a guide.
- Affinity detail of a vacancy with met and pending requirements.
- Apply with consents, duplicate protection and re-application after withdrawing.
- Applicants of a vacancy for the company.
- Skill detection for work experience text and for vacancy requirements, including symbols, accents and case.
- Publication and expiry dates in the recommended vacancies.
- Configurable score weights through environment variables.
- "Contactar" button in the recruiter candidate panel, which opens the application chat.

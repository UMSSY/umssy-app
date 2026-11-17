# Base de datos: Prisma y PostgreSQL

## Propósito y gobierno

Este documento describe los modelos vigentes de `schema.prisma`, sus campos, tipos, claves, relaciones y restricciones. Solo el equipo de Base de Datos modifica el esquema y las migraciones. La documentación de reglas de negocio corresponde a los README de `docs/<module>/`. Los cambios de radar que requieren aprobación están en [la solicitud de adecuación](../../docs/radar-integration/database-change-request.md).

## Convenciones de lectura

- Prisma usa nombres de modelo singulares y campos camelCase; `@@map` indica la tabla PostgreSQL y `@map` la columna. Si falta un mapa, el nombre físico coincide con el declarado; la documentación registra el estado actual, no presupone conformidad.
- `?` indica nulabilidad; `[]` representa una colección del lado 1:N o N:M. Un campo de relación no se almacena como columna: sus `fields` son las FK y `references` identifica el modelo/campo destino.
- `@id`/`@@id` definen la clave primaria; `@unique`/`@@unique` unicidad; `@@index` define un índice. Se listan también índices compuestos y su orden.
- `String @db.Uuid` identifica UUID. `@db.VarChar(n)` limita longitud; `@db.Timestamptz(6)` almacena fecha y hora con zona; `@db.Date` fecha; `@db.Time(6)` hora. Sin anotación nativa se usa el mapeo predeterminado de Prisma para PostgreSQL.
- `@default` describe generación inicial, `@updatedAt` actualización gestionada por Prisma. `deletedAt` registra borrado lógico donde existe.
- `Cascade` borra dependientes; `Restrict`/`NoAction` impide borrar referencias activas; `SetNull` conserva trazabilidad sin la referencia. Una acción no declarada se marca implícita y requiere revisión si el estándar exige explicitarla.
- `@@ignore` indica un modelo no expuesto en el cliente generado; no significa que su tabla se pueda borrar. Los repositorios pueden conservar SQL parametrizado para esas tablas.

## Relaciones de radar

```mermaid
erDiagram
  JobApplication ||--o{ RadarApplicationConsent : application
  UserCvFile ||--o{ RadarCvEvidence : cv
  User ||--o{ RadarCvEvidence : owner
  User o|--o{ RadarCvEvidence : reviewer
  RadarCvExtractionStatus ||--o{ RadarCvEvidence : extractionState
  RadarCvReviewStatus ||--o{ RadarCvEvidence : reviewState
  User ||--o{ RadarScoreSnapshot : user
  User ||--o{ RadarAuditEvent : subject
  User o|--o{ RadarAuditEvent : actor
  Company ||--o{ RadarCompanyAccess : company
  User ||--o{ RadarCompanyAccess : user
  JobOffer ||--o{ RadarJobApplication : jobOffer
  User ||--o{ RadarJobApplication : user
  User o|--o{ RadarJobApplication : decider
  User ||--o{ RadarDocumentVerification : owner
  User o|--o{ RadarDocumentVerification : reviewer
  RadarDocumentStatus ||--o{ RadarDocumentVerification : statusEntry
  RadarDocumentSourceType ||--o{ RadarDocumentVerification : sourceTypeEntry
```

## Relaciones y claves foráneas

La cardinalidad de cada FK es N:1; cuando es única restringe la relación a 1:1. La nulabilidad de la relación indica si el extremo padre es opcional.

| Modelo y relación | FK local | Referencia | Opcional | onDelete |
| --- | --- | --- | --- | --- |
| User.company | companyId | Company.id | Sí | SetNull |
| User.city | cityId | City.id | Sí | SetNull |
| UserRole.user | userId | User.id | No | Cascade |
| UserRole.role | roleId | Role.id | No | Restrict |
| Education.user | userId | User.id | No | Cascade |
| WorkExperience.user | userId | User.id | No | Cascade |
| WorkExperience.company | companyId | Company.id | No | Restrict |
| Skill.area | areaId | RadarArea.id | Sí | SetNull |
| JobOfferSkill.jobOffer | jobOfferId | JobOffer.id | No | Cascade |
| JobOfferSkill.skill | skillId | Skill.id | No | Restrict |
| UserSkill.user | userId | User.id | No | Cascade |
| UserSkill.skill | skillId | Skill.id | No | Restrict |
| Certification.user | userId | User.id | No | Cascade |
| UserCvFile.user | userId | User.id | No | Cascade |
| ProfileSkillProcessingState.user | userId | User.id | No | Cascade |
| MentorTechnicalArea.mentor | mentorId | User.id | No | Cascade |
| MentorTechnicalArea.technicalArea | technicalAreaId | TechnicalArea.id | No | Restrict |
| MentorOrientationType.mentor | mentorId | User.id | No | Cascade |
| MentorOrientationType.orientationType | orientationTypeId | OrientationType.id | No | Restrict |
| AvailabilityBlock.mentor | mentorId | User.id | No | Cascade |
| BlockedDate.mentor | mentorId | User.id | No | Cascade |
| Appointment.block | blockId | AvailabilityBlock.id | Sí | SetNull |
| Appointment.mentor | mentorId | User.id | No | Restrict |
| Appointment.student | studentId | User.id | No | Restrict |
| Appointment.status | statusId | AppointmentStatus.id | No | Restrict |
| Appointment.orientationType | orientationTypeId | OrientationType.id | Sí | SetNull |
| Appointment.cancelledBy | cancelledById | User.id | Sí | SetNull |
| AppointmentDocument.appointment | appointmentId | Appointment.id | No | Cascade |
| TimeProposal.appointment | appointmentId | Appointment.id | No | Cascade |
| TimeProposal.proposedBlock | proposedBlockId | AvailabilityBlock.id | No | Cascade |
| TimeProposal.status | statusId | ProposalStatus.id | No | Restrict |
| AppointmentHistory.appointment | appointmentId | Appointment.id | No | Cascade |
| AppointmentHistory.previousStatus | previousStatusId | AppointmentStatus.id | Sí | SetNull |
| AppointmentHistory.newStatus | newStatusId | AppointmentStatus.id | No | Restrict |
| AppointmentHistory.changedBy | changedById | User.id | Sí | SetNull |
| Event.category | categoryId | EventCategory.id | No | Restrict |
| Event.modality | modalityId | EventModality.id | No | Restrict |
| Event.origin | originId | EventOrigin.id | No | Restrict |
| Event.status | statusId | EventStatus.id | No | Restrict |
| Event.createdBy | createdById | User.id | No | Restrict |
| Event.moderatedBy | moderatedById | User.id | Sí | SetNull |
| EventRegistration.event | eventId | Event.id | No | Cascade |
| EventRegistration.user | userId | User.id | No | Cascade |
| EventRegistration.status | statusId | RegistrationStatus.id | No | Restrict |
| EventAttendance.registration | registrationId | EventRegistration.id | No | Cascade |
| EventAttendance.checkedInBy | checkedInById | User.id | Sí | SetNull |
| JobOffer.company | companyId | Company.id | No | Cascade |
| JobOffer.modality | modalityId | JobOfferModality.id | No | Restrict |
| JobOffer.contractType | contractTypeId | JobOfferContractType.id | No | Restrict |
| JobOffer.status | statusId | JobOfferStatus.id | No | Restrict |
| AdminExportHistory.user | userId | User.id | No | Cascade |
| AccessRequest.status | statusId | AccessRequestStatus.id | No | Restrict |
| AccessRequest.documentType | documentTypeId | AccessRequestDocumentType.id | Sí | Restrict |
| AccessRequest.documentFile | documentFileId | File.id | Sí | SetNull |
| AccessRequest.openedBy | openedById | User.id | Sí | SetNull |
| AccessRequest.reviewedBy | reviewedById | User.id | Sí | SetNull |
| AccessRequest.approvedUser | approvedUserId | User.id | Sí | SetNull |
| AccessRequest.career | careerId | Career.id | No | Restrict |
| MentorParticipationRequest.user | userId | User.id | No | Restrict |
| MentorParticipationRequest.statusCatalog | statusId | MentorParticipationStatus.id | No | Restrict |
| MentorSlotOffer.user | userId | User.id | No | Restrict |
| MentorSlotOffer.request | requestId | MentorParticipationRequest.id | Sí | Restrict |
| MentorSlotOffer.statusCatalog | statusId | MentorOfferStatus.id | No | Restrict |
| ActivationOtp.accessRequest | accessRequestId | AccessRequest.id | No | Cascade |
| Conversation.userA | userAId | User.id | Sí | Cascade |
| Conversation.userB | userBId | User.id | Sí | Cascade |
| Conversation.event | eventId | Event.id | Sí | Cascade |
| ConversationParticipant.conversation | conversationId | Conversation.id | No | Cascade |
| ConversationParticipant.user | userId | User.id | No | Cascade |
| Message.conversation | conversationId | Conversation.id | No | Cascade |
| Message.sender | senderId | User.id | No | Cascade |
| Message.status | statusId | MessageStatus.id | No | Restrict |
| MessageAttachment.message | messageId | Message.id | No | Cascade |
| MessageAttachment.type | typeId | AttachmentType.id | No | Restrict |
| ChatUserBlock.blocker | blockerId | User.id | No | Cascade |
| ChatUserBlock.blocked | blockedId | User.id | No | Cascade |
| ConnectionRequest.sender | senderId | User.id | No | Cascade |
| ConnectionRequest.receiver | receiverId | User.id | No | Cascade |
| ConnectionRequest.status | statusId | ConnectionRequestStatus.id | No | Restrict |
| UserPresence.user | userId | User.id | No | Cascade |
| PasswordResetOtp.user | userId | User.id | No | Cascade |
| MentorParticipationAttemptLimit.user | userId | User.id | No | Cascade |
| JobApplication.jobOffer | jobOfferId | JobOffer.id | No | Cascade |
| JobApplication.user | userId | User.id | No | Cascade |
| JobApplication.status | statusId | JobApplicationStatus.id | No | Restrict |
| RadarApplicationConsent.application | applicationId | JobApplication.id | No | Cascade |
| Survey.career | careerId | Career.id | Sí | Restrict |
| Survey.status | statusId | SurveyStatus.id | No | Restrict |
| Survey.targetAudience | targetAudienceId | SurveyTargetAudience.id | Sí | Restrict |
| Survey.createdBy | createdById | User.id | No | Restrict |
| SurveyQuestion.survey | surveyId | Survey.id | No | Cascade |
| SurveyQuestion.type | typeId | SurveyQuestionType.id | No | Restrict |
| SurveyQuestionOption.question | questionId | SurveyQuestion.id | No | Cascade |
| SurveyResponse.survey | surveyId | Survey.id | No | Cascade |
| SurveyResponse.respondent | respondentId | User.id | No | Restrict |
| SurveyAnswer.response | responseId | SurveyResponse.id | No | Cascade |
| SurveyAnswer.question | questionId | SurveyQuestion.id | No | Cascade |
| SurveyAnswer.option | optionId | SurveyQuestionOption.id | Sí | Cascade |
| AuditEvent.accessRequest | accessRequestId | AccessRequest.id | No | Restrict |
| AuditEvent.action | actionId | AuditAction.id | No | Restrict |
| AuditEvent.actor | actorId | User.id | Sí | SetNull |
| AuditEvent.evidenceFile | evidenceFileId | File.id | Sí | Restrict |
| DocumentValidation.accessRequest | accessRequestId | AccessRequest.id | No | Cascade |
| DocumentValidation.revertedBy | revertedById | User.id | Sí | SetNull |
| MentorIntakeAttempt.intakeOperation | operationId | MentorIntakeOperation.id | No | Restrict |
| MentorIntakeAttempt.user | userId | User.id | No | Restrict |
| MentorParticipationSanction.user | userId | User.id | No | Restrict |
| MentorParticipationSanction.triggerAttempt | triggerAttemptId | MentorIntakeAttempt.id | Sí | Restrict |
| RadarCvEvidence.cv | cvId | UserCvFile.id | No | Cascade |
| RadarCvEvidence.owner | userId | User.id | No | Cascade |
| RadarCvEvidence.reviewer | reviewerId | User.id | Sí | SetNull |
| RadarCvEvidence.extractionState | extractionStatusId | RadarCvExtractionStatus.id | No | Restrict |
| RadarCvEvidence.reviewState | reviewStatusId | RadarCvReviewStatus.id | No | Restrict |
| RadarScoreSnapshot.user | userId | User.id | No | Cascade |
| RadarAuditEvent.subject | userId | User.id | No | Cascade |
| RadarAuditEvent.actor | actorId | User.id | Sí | SetNull |
| RadarCompanyAccess.company | companyId | Company.id | No | Cascade |
| RadarCompanyAccess.user | userId | User.id | No | Cascade |
| RadarJobApplication.jobOffer | jobOfferId | JobOffer.id | No | Cascade |
| RadarJobApplication.user | userId | User.id | No | Cascade |
| RadarJobApplication.decider | decidedBy | User.id | Sí | NoAction |
| RadarDocumentVerification.owner | userId | User.id | No | Cascade |
| RadarDocumentVerification.reviewer | reviewerId | User.id | Sí | SetNull |
| RadarDocumentVerification.statusEntry | statusId | RadarDocumentStatus.id | No | Restrict |
| RadarDocumentVerification.sourceTypeEntry | sourceTypeId | RadarDocumentSourceType.id | No | Restrict |
| UserSocialAccount.user | userId | User.id | No | Cascade |
| UserSocialAccount.provider | providerId | PortfolioProvider.id | No | Restrict |
| UserPortfolioProject.user | userId | User.id | No | Cascade |
| UserPortfolioProject.socialAccount | socialAccountId | UserSocialAccount.id | Sí | SetNull |
| UserPortfolioProject.provider | providerId | PortfolioProvider.id | No | Restrict |
| Notification.recipient | recipientId | User.id | No | Cascade |
| Notification.actor | actorId | User.id | Sí | SetNull |
| Notification.type | typeId | NotificationType.id | No | Restrict |
| PushSubscription.user | userId | User.id | No | Cascade |
| NotificationPreference.user | userId | User.id | No | Cascade |

## Diccionario de modelos

La columna de definición conserva los atributos del esquema para que defaults, precisión, índices y mapas puedan revisarse sin inferirlos.

### AppointmentStatus

Tabla: `appointment_statuses`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(100)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| appointments | `Appointment[]` | Relación: Appointment[] | `Sin atributos explícitos` |
| previousAppointmentHistories | `AppointmentHistory[]` | Relación: AppointmentHistory[] | `@relation("PreviousAppointmentStatus")` |
| newAppointmentHistories | `AppointmentHistory[]` | Relación: AppointmentHistory[] | `@relation("NewAppointmentStatus")` |

Restricciones del modelo:

- `@@map("appointment_statuses")`

### ProposalStatus

Tabla: `proposal_statuses`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(100)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| proposals | `TimeProposal[]` | Relación: TimeProposal[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("proposal_statuses")`

### EventModality

Tabla: `event_modalities`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(100)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| events | `Event[]` | Relación: Event[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("event_modalities")`

### EventOrigin

Tabla: `event_origins`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(100)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| events | `Event[]` | Relación: Event[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("event_origins")`

### EventStatus

Tabla: `event_statuses`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(100)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| events | `Event[]` | Relación: Event[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("event_statuses")`

### RegistrationStatus

Tabla: `registration_statuses`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(100)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| eventRegistrations | `EventRegistration[]` | Relación: EventRegistration[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("registration_statuses")`

### City

Tabla: `cities`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(100)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| users | `User[]` | Relación: User[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("cities")`

### Company

Tabla: `companies`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(100)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| recruiters | `User[]` | Relación: User[] | `Sin atributos explícitos` |
| workExperiences | `WorkExperience[]` | Relación: WorkExperience[] | `Sin atributos explícitos` |
| jobOffers | `JobOffer[]` | Relación: JobOffer[] | `Sin atributos explícitos` |
| radarCompanyAccess | `RadarCompanyAccess[]` | Relación: RadarCompanyAccess[] | `@ignore` |

Restricciones del modelo:

- `@@map("companies")`

### User

Tabla: `users`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| mentorIntakeAttempts | `MentorIntakeAttempt[]` | Relación: MentorIntakeAttempt[] | `Sin atributos explícitos` |
| mentorParticipationSanctions | `MentorParticipationSanction[]` | Relación: MentorParticipationSanction[] | `Sin atributos explícitos` |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| firstName | `String` | first_name | `@map("first_name") @db.VarChar(100)` |
| lastName | `String` | last_name | `@map("last_name") @db.VarChar(100)` |
| email | `String` | email | `@unique @db.VarChar(150)` |
| password | `String?` | password | `@db.VarChar(255)` |
| isActive | `Boolean` | is_active | `@default(true) @map("is_active")` |
| isAvailableForMentoring | `Boolean` | is_available_for_mentoring | `@default(false) @map("is_available_for_mentoring")` |
| photoUrl | `Bytes?` | photo_url | `@map("photo_url")` |
| cityId | `String?` | city_id | `@map("city_id") @db.Uuid` |
| companyId | `String?` | company_id | `@map("company_id") @db.Uuid` |
| company | `Company?` | Relación: Company? | `@relation(fields: [companyId], references: [id], onDelete: SetNull)` |
| phone | `String?` | phone | `Sin atributos explícitos` |
| personalEmail | `String?` | personal_email | `@map("personal_email")` |
| headline | `String?` | headline | `Sin atributos explícitos` |
| aboutMe | `String?` | about_me | `@map("about_me")` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| city | `City?` | Relación: City? | `@relation(fields: [cityId], references: [id], onDelete: SetNull)` |
| roles | `UserRole[]` | Relación: UserRole[] | `Sin atributos explícitos` |
| educations | `Education[]` | Relación: Education[] | `Sin atributos explícitos` |
| workExperiences | `WorkExperience[]` | Relación: WorkExperience[] | `Sin atributos explícitos` |
| userSkills | `UserSkill[]` | Relación: UserSkill[] | `Sin atributos explícitos` |
| certifications | `Certification[]` | Relación: Certification[] | `Sin atributos explícitos` |
| cvFiles | `UserCvFile[]` | Relación: UserCvFile[] | `Sin atributos explícitos` |
| skillProcessingState | `ProfileSkillProcessingState?` | Relación: ProfileSkillProcessingState? | `Sin atributos explícitos` |
| mentorTechnicalAreas | `MentorTechnicalArea[]` | Relación: MentorTechnicalArea[] | `Sin atributos explícitos` |
| mentorOrientationTypes | `MentorOrientationType[]` | Relación: MentorOrientationType[] | `Sin atributos explícitos` |
| availabilityBlocks | `AvailabilityBlock[]` | Relación: AvailabilityBlock[] | `Sin atributos explícitos` |
| blockedDates | `BlockedDate[]` | Relación: BlockedDate[] | `Sin atributos explícitos` |
| mentorAppointments | `Appointment[]` | Relación: Appointment[] | `@relation("AppointmentMentor")` |
| studentAppointments | `Appointment[]` | Relación: Appointment[] | `@relation("AppointmentStudent")` |
| cancelledAppointments | `Appointment[]` | Relación: Appointment[] | `@relation("AppointmentCancelledBy")` |
| appointmentChanges | `AppointmentHistory[]` | Relación: AppointmentHistory[] | `Sin atributos explícitos` |
| createdEvents | `Event[]` | Relación: Event[] | `@relation("EventCreatedBy")` |
| moderatedEvents | `Event[]` | Relación: Event[] | `@relation("EventModeratedBy")` |
| eventRegistrations | `EventRegistration[]` | Relación: EventRegistration[] | `Sin atributos explícitos` |
| checkedInAttendances | `EventAttendance[]` | Relación: EventAttendance[] | `Sin atributos explícitos` |
| exportHistories | `AdminExportHistory[]` | Relación: AdminExportHistory[] | `@relation("AdminExportHistories")` |
| openedAccessRequests | `AccessRequest[]` | Relación: AccessRequest[] | `@relation("AccessRequestOpenedBy")` |
| reviewedAccessRequests | `AccessRequest[]` | Relación: AccessRequest[] | `@relation("AccessRequestReviewedBy")` |
| approvedAccessRequest | `AccessRequest?` | Relación: AccessRequest? | `@relation("ApprovedGraduateAccount")` |
| mentorSlotOffers | `MentorSlotOffer[]` | Relación: MentorSlotOffer[] | `Sin atributos explícitos` |
| mentorParticipationRequests | `MentorParticipationRequest[]` | Relación: MentorParticipationRequest[] | `Sin atributos explícitos` |
| mentorParticipationAttemptLimit | `MentorParticipationAttemptLimit?` | Relación: MentorParticipationAttemptLimit? | `Sin atributos explícitos` |
| createdSurveys | `Survey[]` | Relación: Survey[] | `@relation("SurveyCreatedBy")` |
| surveyResponses | `SurveyResponse[]` | Relación: SurveyResponse[] | `@relation("SurveyRespondent")` |
| conversationsAsUserA | `Conversation[]` | Relación: Conversation[] | `@relation("UserAConversations")` |
| conversationsAsUserB | `Conversation[]` | Relación: Conversation[] | `@relation("UserBConversations")` |
| chatMessages | `Message[]` | Relación: Message[] | `Sin atributos explícitos` |
| chatParticipants | `ConversationParticipant[]` | Relación: ConversationParticipant[] | `Sin atributos explícitos` |
| presence | `UserPresence?` | Relación: UserPresence? | `Sin atributos explícitos` |
| chatBlocksMade | `ChatUserBlock[]` | Relación: ChatUserBlock[] | `@relation("ChatBlocker")` |
| chatBlocksReceived | `ChatUserBlock[]` | Relación: ChatUserBlock[] | `@relation("ChatBlocked")` |
| sentRequests | `ConnectionRequest[]` | Relación: ConnectionRequest[] | `@relation("SentConnectionRequests")` |
| receivedRequests | `ConnectionRequest[]` | Relación: ConnectionRequest[] | `@relation("ReceivedConnectionRequests")` |
| passwordResetOtps | `PasswordResetOtp[]` | Relación: PasswordResetOtp[] | `Sin atributos explícitos` |
| auditEvents | `AuditEvent[]` | Relación: AuditEvent[] | `@relation("AuditEventActor")` |
| revertedValidations | `DocumentValidation[]` | Relación: DocumentValidation[] | `@relation("DocumentValidationRevertedBy")` |
| jobApplications | `JobApplication[]` | Relación: JobApplication[] | `Sin atributos explícitos` |
| radarCvOwned | `RadarCvEvidence[]` | Relación: RadarCvEvidence[] | `@relation("RadarCvOwner")` |
| radarCvReviewed | `RadarCvEvidence[]` | Relación: RadarCvEvidence[] | `@relation("RadarCvReviewer")` |
| radarSnapshots | `RadarScoreSnapshot[]` | Relación: RadarScoreSnapshot[] | `Sin atributos explícitos` |
| documentVerifications | `RadarDocumentVerification[]` | Relación: RadarDocumentVerification[] | `@relation("VerifiedDocumentOwner")` |
| reviewedDocuments | `RadarDocumentVerification[]` | Relación: RadarDocumentVerification[] | `@relation("VerifiedDocumentReviewer")` |
| radarAuditSubjects | `RadarAuditEvent[]` | Relación: RadarAuditEvent[] | `@relation("RadarAuditSubject")` |
| radarAuditActors | `RadarAuditEvent[]` | Relación: RadarAuditEvent[] | `@relation("RadarAuditActor")` |
| radarCompanyAccess | `RadarCompanyAccess[]` | Relación: RadarCompanyAccess[] | `@ignore` |
| radarApplications | `RadarJobApplication[]` | Relación: RadarJobApplication[] | `@relation("RadarApplicant") @ignore` |
| radarDecisions | `RadarJobApplication[]` | Relación: RadarJobApplication[] | `@relation("RadarDecision") @ignore` |
| socialAccounts | `UserSocialAccount[]` | Relación: UserSocialAccount[] | `Sin atributos explícitos` |
| portfolioProjects | `UserPortfolioProject[]` | Relación: UserPortfolioProject[] | `Sin atributos explícitos` |
| notificationPreferences | `NotificationPreference?` | Relación: NotificationPreference? | `Sin atributos explícitos` |
| receivedNotifications | `Notification[]` | Relación: Notification[] | `@relation("ReceivedNotifications")` |
| triggeredNotifications | `Notification[]` | Relación: Notification[] | `@relation("TriggeredNotifications")` |
| pushSubscriptions | `PushSubscription[]` | Relación: PushSubscription[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@index([cityId])`
- `@@index([companyId])`
- `@@map("users")`

### Role

Tabla: `roles`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| name | `String` | name | `@unique @db.VarChar(50)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| userRoles | `UserRole[]` | Relación: UserRole[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("roles")`

### UserRole

Tabla: `user_roles`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| roleId | `String` | role_id | `@map("role_id") @db.Uuid` |
| startAt | `DateTime` | start_at | `@default(now()) @map("start_at") @db.Timestamptz(6)` |
| deletedAt | `DateTime?` | deleted_at | `@map("deleted_at") @db.Timestamptz(6)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Cascade)` |
| role | `Role` | Relación: Role | `@relation(fields: [roleId], references: [id], onDelete: Restrict)` |

Restricciones del modelo:

- `@@unique([userId, roleId, startAt])`
- `@@index([roleId])`
- `@@index([userId])`
- `@@map("user_roles")`

### Education

Tabla: `educations`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| institution | `String` | institution | `Sin atributos explícitos` |
| degree | `String` | degree | `Sin atributos explícitos` |
| startDate | `DateTime` | start_date | `@map("start_date") @db.Date` |
| endDate | `DateTime?` | end_date | `@map("end_date") @db.Date` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Cascade)` |

Restricciones del modelo:

- `@@index([userId])`
- `@@map("educations")`

### WorkExperience

Tabla: `work_experiences`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| companyId | `String` | company_id | `@map("company_id") @db.Uuid` |
| position | `String` | position | `Sin atributos explícitos` |
| startDate | `DateTime` | start_date | `@map("start_date") @db.Date` |
| endDate | `DateTime?` | end_date | `@map("end_date") @db.Date` |
| isCurrent | `Boolean` | is_current | `@default(false) @map("is_current")` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Cascade)` |
| company | `Company` | Relación: Company | `@relation(fields: [companyId], references: [id], onDelete: Restrict)` |

Restricciones del modelo:

- `@@index([userId])`
- `@@index([companyId])`
- `@@map("work_experiences")`

### RadarArea

Tabla: `radar_areas`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @db.VarChar(50)` |
| name | `String` | name | `@unique @db.VarChar(80)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| skills | `Skill[]` | Relación: Skill[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("radar_areas")`

### Skill

Tabla: `skills`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| name | `String` | name | `@unique` |
| isCustom | `Boolean` | is_custom | `@default(false) @map("is_custom")` |
| areaId | `String?` | area_id | `@map("area_id") @db.VarChar(50)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| area | `RadarArea?` | Relación: RadarArea? | `@relation(fields: [areaId], references: [id], onDelete: SetNull)` |
| userSkills | `UserSkill[]` | Relación: UserSkill[] | `Sin atributos explícitos` |
| jobOfferSkills | `JobOfferSkill[]` | Relación: JobOfferSkill[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@index([areaId])`
- `@@map("skills")`

### JobOfferSkill

Tabla: `job_offer_skills`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| jobOfferId | `String` | job_offer_id | `@map("job_offer_id") @db.Uuid` |
| skillId | `String` | skill_id | `@map("skill_id") @db.Uuid` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| jobOffer | `JobOffer` | Relación: JobOffer | `@relation(fields: [jobOfferId], references: [id], onDelete: Cascade)` |
| skill | `Skill` | Relación: Skill | `@relation(fields: [skillId], references: [id], onDelete: Restrict)` |

Restricciones del modelo:

- `@@unique([jobOfferId, skillId])`
- `@@index([skillId])`
- `@@map("job_offer_skills")`

### UserSkill

Tabla: `user_skills`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| radarAutoVerified | `Boolean` | radar_auto_verified | `@default(false) @map("radar_auto_verified")` |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| skillId | `String` | skill_id | `@map("skill_id") @db.Uuid` |
| source | `String` | source | `@default("manual") @db.VarChar(20)` |
| verificationStatus | `String` | verification_status | `@default("pending") @map("verification_status") @db.VarChar(20)` |
| isHighRelevance | `Boolean` | is_high_relevance | `@default(false) @map("is_high_relevance")` |
| evidenceRefs | `Json?` | evidence_refs | `@default("[]") @map("evidence_refs")` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Cascade)` |
| skill | `Skill` | Relación: Skill | `@relation(fields: [skillId], references: [id], onDelete: Restrict)` |

Restricciones del modelo:

- `@@unique([userId, skillId])`
- `@@index([skillId])`
- `@@map("user_skills")`

### Certification

Tabla: `certifications`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| name | `String` | name | `Sin atributos explícitos` |
| issuingOrganization | `String` | issuing_organization | `@map("issuing_organization")` |
| issueDate | `DateTime` | issue_date | `@map("issue_date") @db.Date` |
| documentUrl | `Bytes?` | document_url | `@map("document_url")` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Cascade)` |

Restricciones del modelo:

- `@@index([userId])`
- `@@map("certifications")`

### UserCvFile

Tabla: `user_cv_file`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| cvFileName | `String?` | cv_file_name | `@map("cv_file_name") @db.VarChar` |
| cvUploadedAt | `DateTime?` | cv_uploaded_at | `@map("cv_uploaded_at") @db.Timestamptz(6)` |
| cvPdfData | `String?` | cv_pdf_data | `@map("cv_pdf_data")` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Cascade)` |
| radarEvidence | `RadarCvEvidence?` | Relación: RadarCvEvidence? | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)` |

Restricciones del modelo:

- `@@index([userId])`
- `@@map("user_cv_file")`

### ProfileSkillProcessingState

Tabla: `profile_skill_processing_states`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| userId | `String` | user_id | `@id @map("user_id") @db.Uuid` |
| status | `String` | status | `@default("pending") @db.VarChar(20)` |
| inputRevision | `Int` | input_revision | `@default(0) @map("input_revision")` |
| processedRevision | `Int?` | processed_revision | `@map("processed_revision")` |
| resultVersion | `Int` | result_version | `@default(0) @map("result_version")` |
| updatedAt | `DateTime` | updated_at | `@default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)` |
| dictionaryVersion | `String?` | dictionary_version | `@map("dictionary_version") @db.VarChar(64)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Cascade)` |

Restricciones del modelo:

- `@@map("profile_skill_processing_states")`

### TechnicalArea

Tabla: `technical_areas`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| name | `String` | name | `@unique @db.VarChar(80)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| mentors | `MentorTechnicalArea[]` | Relación: MentorTechnicalArea[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("technical_areas")`

### OrientationType

Tabla: `orientation_types`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| name | `String` | name | `@unique @db.VarChar(60)` |
| description | `String?` | description | `Sin atributos explícitos` |
| isActive | `Boolean` | is_active | `@default(true) @map("is_active")` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| mentors | `MentorOrientationType[]` | Relación: MentorOrientationType[] | `Sin atributos explícitos` |
| appointments | `Appointment[]` | Relación: Appointment[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("orientation_types")`

### MentorTechnicalArea

Tabla: `mentor_technical_areas`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| mentorId | `String` | mentor_id | `@map("mentor_id") @db.Uuid` |
| technicalAreaId | `String` | technical_area_id | `@map("technical_area_id") @db.Uuid` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| mentor | `User` | Relación: User | `@relation(fields: [mentorId], references: [id], onDelete: Cascade)` |
| technicalArea | `TechnicalArea` | Relación: TechnicalArea | `@relation(fields: [technicalAreaId], references: [id], onDelete: Restrict)` |

Restricciones del modelo:

- `@@unique([mentorId, technicalAreaId])`
- `@@index([technicalAreaId])`
- `@@map("mentor_technical_areas")`

### MentorOrientationType

Tabla: `mentor_orientation_types`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| mentorId | `String` | mentor_id | `@map("mentor_id") @db.Uuid` |
| orientationTypeId | `String` | orientation_type_id | `@map("orientation_type_id") @db.Uuid` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| mentor | `User` | Relación: User | `@relation(fields: [mentorId], references: [id], onDelete: Cascade)` |
| orientationType | `OrientationType` | Relación: OrientationType | `@relation(fields: [orientationTypeId], references: [id], onDelete: Restrict)` |

Restricciones del modelo:

- `@@unique([mentorId, orientationTypeId])`
- `@@index([orientationTypeId])`
- `@@map("mentor_orientation_types")`

### AvailabilityBlock

Tabla: `availability_blocks`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| mentorId | `String` | mentor_id | `@map("mentor_id") @db.Uuid` |
| startAt | `DateTime` | start_at | `@map("start_at") @db.Timestamptz(6)` |
| endAt | `DateTime` | end_at | `@map("end_at") @db.Timestamptz(6)` |
| seriesId | `String?` | series_id | `@map("series_id") @db.Uuid` |
| repeatUntil | `DateTime?` | repeat_until | `@map("repeat_until") @db.Date` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| mentor | `User` | Relación: User | `@relation(fields: [mentorId], references: [id], onDelete: Cascade)` |
| appointments | `Appointment[]` | Relación: Appointment[] | `Sin atributos explícitos` |
| proposals | `TimeProposal[]` | Relación: TimeProposal[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@index([mentorId, startAt])`
- `@@index([seriesId])`
- `@@map("availability_blocks")`

### BlockedDate

Tabla: `blocked_dates`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| mentorId | `String` | mentor_id | `@map("mentor_id") @db.Uuid` |
| blockedOn | `DateTime` | blocked_on | `@map("blocked_on") @db.Date` |
| reason | `String?` | reason | `@db.VarChar(100)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| mentor | `User` | Relación: User | `@relation(fields: [mentorId], references: [id], onDelete: Cascade)` |

Restricciones del modelo:

- `@@unique([mentorId, blockedOn])`
- `@@map("blocked_dates")`

### Appointment

Tabla: `appointments`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| blockId | `String?` | block_id | `@map("block_id") @db.Uuid` |
| mentorId | `String` | mentor_id | `@map("mentor_id") @db.Uuid` |
| studentId | `String` | student_id | `@map("student_id") @db.Uuid` |
| startAt | `DateTime` | start_at | `@map("start_at") @db.Timestamptz(6)` |
| endAt | `DateTime` | end_at | `@map("end_at") @db.Timestamptz(6)` |
| statusId | `String` | status_id | `@map("status_id") @db.Uuid` |
| orientationTypeId | `String?` | orientation_type_id | `@map("orientation_type_id") @db.Uuid` |
| message | `String?` | message | `@db.VarChar(300)` |
| rejectionReason | `String?` | rejection_reason | `@map("rejection_reason") @db.VarChar(300)` |
| meetingUrl | `String?` | meeting_url | `@map("meeting_url") @db.VarChar(255)` |
| cancelledById | `String?` | cancelled_by_id | `@map("cancelled_by_id") @db.Uuid` |
| requestedAt | `DateTime` | requested_at | `@default(now()) @map("requested_at") @db.Timestamptz(6)` |
| respondedAt | `DateTime?` | responded_at | `@map("responded_at") @db.Timestamptz(6)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| block | `AvailabilityBlock?` | Relación: AvailabilityBlock? | `@relation(fields: [blockId], references: [id], onDelete: SetNull)` |
| mentor | `User` | Relación: User | `@relation("AppointmentMentor", fields: [mentorId], references: [id], onDelete: Restrict)` |
| student | `User` | Relación: User | `@relation("AppointmentStudent", fields: [studentId], references: [id], onDelete: Restrict)` |
| status | `AppointmentStatus` | Relación: AppointmentStatus | `@relation(fields: [statusId], references: [id], onDelete: Restrict)` |
| orientationType | `OrientationType?` | Relación: OrientationType? | `@relation(fields: [orientationTypeId], references: [id], onDelete: SetNull)` |
| cancelledBy | `User?` | Relación: User? | `@relation("AppointmentCancelledBy", fields: [cancelledById], references: [id], onDelete: SetNull)` |
| proposals | `TimeProposal[]` | Relación: TimeProposal[] | `Sin atributos explícitos` |
| history | `AppointmentHistory[]` | Relación: AppointmentHistory[] | `Sin atributos explícitos` |
| document | `AppointmentDocument?` | Relación: AppointmentDocument? | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@index([mentorId, startAt])`
- `@@index([studentId, startAt])`
- `@@index([statusId])`
- `@@index([blockId])`
- `@@index([cancelledById])`
- `@@index([orientationTypeId])`
- `@@map("appointments")`

### AppointmentDocument

Tabla: `appointment_documents`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| appointmentId | `String` | appointment_id | `@unique @map("appointment_id") @db.Uuid` |
| fileName | `String` | file_name | `@map("file_name") @db.VarChar(255)` |
| mimeType | `String` | mime_type | `@map("mime_type") @db.VarChar(50)` |
| sizeBytes | `Int` | size_bytes | `@map("size_bytes")` |
| data | `Bytes` | data | `Sin atributos explícitos` |
| uploadedAt | `DateTime` | uploaded_at | `@default(now()) @map("uploaded_at") @db.Timestamptz(6)` |
| appointment | `Appointment` | Relación: Appointment | `@relation(fields: [appointmentId], references: [id], onDelete: Cascade)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)` |

Restricciones del modelo:

- `@@map("appointment_documents")`

### TimeProposal

Tabla: `time_proposals`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| appointmentId | `String` | appointment_id | `@map("appointment_id") @db.Uuid` |
| proposedBlockId | `String` | proposed_block_id | `@map("proposed_block_id") @db.Uuid` |
| message | `String?` | message | `@db.VarChar(300)` |
| statusId | `String` | status_id | `@map("status_id") @db.Uuid` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| respondedAt | `DateTime?` | responded_at | `@map("responded_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| appointment | `Appointment` | Relación: Appointment | `@relation(fields: [appointmentId], references: [id], onDelete: Cascade)` |
| proposedBlock | `AvailabilityBlock` | Relación: AvailabilityBlock | `@relation(fields: [proposedBlockId], references: [id], onDelete: Cascade)` |
| status | `ProposalStatus` | Relación: ProposalStatus | `@relation(fields: [statusId], references: [id], onDelete: Restrict)` |

Restricciones del modelo:

- `@@index([appointmentId])`
- `@@index([proposedBlockId])`
- `@@index([statusId])`
- `@@map("time_proposals")`

### AppointmentHistory

Tabla: `appointment_histories`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| appointmentId | `String` | appointment_id | `@map("appointment_id") @db.Uuid` |
| previousStatusId | `String?` | previous_status_id | `@map("previous_status_id") @db.Uuid` |
| newStatusId | `String` | new_status_id | `@map("new_status_id") @db.Uuid` |
| changedById | `String?` | changed_by_id | `@map("changed_by_id") @db.Uuid` |
| changedAt | `DateTime` | changed_at | `@default(now()) @map("changed_at") @db.Timestamptz(6)` |
| note | `String?` | note | `@db.VarChar(300)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| appointment | `Appointment` | Relación: Appointment | `@relation(fields: [appointmentId], references: [id], onDelete: Cascade)` |
| previousStatus | `AppointmentStatus?` | Relación: AppointmentStatus? | `@relation("PreviousAppointmentStatus", fields: [previousStatusId], references: [id], onDelete: SetNull)` |
| newStatus | `AppointmentStatus` | Relación: AppointmentStatus | `@relation("NewAppointmentStatus", fields: [newStatusId], references: [id], onDelete: Restrict)` |
| changedBy | `User?` | Relación: User? | `@relation(fields: [changedById], references: [id], onDelete: SetNull)` |

Restricciones del modelo:

- `@@index([appointmentId, changedAt])`
- `@@index([previousStatusId])`
- `@@index([newStatusId])`
- `@@index([changedById])`
- `@@map("appointment_histories")`

### EventCategory

Tabla: `event_categories`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| name | `String` | name | `@unique @db.VarChar(50)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| events | `Event[]` | Relación: Event[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("event_categories")`

### Event

Tabla: `events`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| coverData | `Bytes?` | cover_data | `@map("cover_data")` |
| coverMimeType | `String?` | cover_mime_type | `@map("cover_mime_type") @db.VarChar(30)` |
| proposalKey | `String?` | proposal_key | `@map("proposal_key") @db.VarChar(36)` |
| proposalHash | `String?` | proposal_hash | `@map("proposal_hash") @db.VarChar(64)` |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@db.VarChar(150)` |
| description | `String?` | description | `Sin atributos explícitos` |
| categoryId | `String` | category_id | `@map("category_id") @db.Uuid` |
| instructorName | `String?` | instructor_name | `@map("instructor_name") @db.VarChar(120)` |
| eventDate | `DateTime` | event_date | `@map("event_date") @db.Date` |
| startTime | `DateTime` | start_time | `@map("start_time") @db.Time(6)` |
| endTime | `DateTime` | end_time | `@map("end_time") @db.Time(6)` |
| modalityId | `String` | modality_id | `@map("modality_id") @db.Uuid` |
| location | `String?` | location | `Sin atributos explícitos` |
| capacity | `Int?` | capacity | `Sin atributos explícitos` |
| originId | `String` | origin_id | `@map("origin_id") @db.Uuid` |
| statusId | `String` | status_id | `@map("status_id") @db.Uuid` |
| supportThreshold | `Int?` | support_threshold | `@map("support_threshold")` |
| votingDeadline | `DateTime?` | voting_deadline | `@map("voting_deadline") @db.Timestamptz(6)` |
| moderatedById | `String?` | moderated_by_id | `@map("moderated_by_id") @db.Uuid` |
| moderationReason | `String?` | moderation_reason | `@map("moderation_reason")` |
| createdById | `String` | created_by_id | `@map("created_by_id") @db.Uuid` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| category | `EventCategory` | Relación: EventCategory | `@relation(fields: [categoryId], references: [id], onDelete: Restrict)` |
| modality | `EventModality` | Relación: EventModality | `@relation(fields: [modalityId], references: [id], onDelete: Restrict)` |
| origin | `EventOrigin` | Relación: EventOrigin | `@relation(fields: [originId], references: [id], onDelete: Restrict)` |
| status | `EventStatus` | Relación: EventStatus | `@relation(fields: [statusId], references: [id], onDelete: Restrict)` |
| createdBy | `User` | Relación: User | `@relation("EventCreatedBy", fields: [createdById], references: [id], onDelete: Restrict)` |
| moderatedBy | `User?` | Relación: User? | `@relation("EventModeratedBy", fields: [moderatedById], references: [id], onDelete: SetNull)` |
| registrations | `EventRegistration[]` | Relación: EventRegistration[] | `Sin atributos explícitos` |
| chatRoom | `Conversation?` | Relación: Conversation? | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@unique([createdById, proposalKey])`
- `@@index([categoryId])`
- `@@index([modalityId])`
- `@@index([originId])`
- `@@index([statusId])`
- `@@index([eventDate])`
- `@@index([moderatedById])`
- `@@map("events")`

### EventRegistration

Tabla: `event_registrations`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| eventId | `String` | event_id | `@map("event_id") @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| statusId | `String` | status_id | `@map("status_id") @db.Uuid` |
| qrToken | `String` | qr_token | `@unique @map("qr_token") @db.VarChar(64)` |
| registeredAt | `DateTime` | registered_at | `@default(now()) @map("registered_at") @db.Timestamptz(6)` |
| cancelledAt | `DateTime?` | cancelled_at | `@map("cancelled_at") @db.Timestamptz(6)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| event | `Event` | Relación: Event | `@relation(fields: [eventId], references: [id], onDelete: Cascade)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Cascade)` |
| status | `RegistrationStatus` | Relación: RegistrationStatus | `@relation(fields: [statusId], references: [id], onDelete: Restrict)` |
| attendance | `EventAttendance?` | Relación: EventAttendance? | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@unique([eventId, userId])`
- `@@index([userId])`
- `@@index([statusId])`
- `@@map("event_registrations")`

### EventAttendance

Tabla: `event_attendances`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| registrationId | `String` | registration_id | `@unique @map("registration_id") @db.Uuid` |
| checkedInAt | `DateTime` | checked_in_at | `@map("checked_in_at") @db.Timestamptz(6)` |
| checkedInById | `String?` | checked_in_by_id | `@map("checked_in_by_id") @db.Uuid` |
| checkedInOffline | `Boolean` | checked_in_offline | `@default(false) @map("checked_in_offline")` |
| syncedAt | `DateTime?` | synced_at | `@map("synced_at") @db.Timestamptz(6)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| registration | `EventRegistration` | Relación: EventRegistration | `@relation(fields: [registrationId], references: [id], onDelete: Cascade)` |
| checkedInBy | `User?` | Relación: User? | `@relation(fields: [checkedInById], references: [id], onDelete: SetNull)` |

Restricciones del modelo:

- `@@index([checkedInById])`
- `@@map("event_attendances")`

### JobOffer

Tabla: `job_offers`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@db.VarChar(60)` |
| description | `String` | description | `Sin atributos explícitos` |
| companyId | `String` | company_id | `@map("company_id") @db.Uuid` |
| modalityId | `String` | modality_id | `@map("modality_id") @db.Uuid` |
| contractTypeId | `String` | contract_type_id | `@map("contract_type_id") @db.Uuid` |
| statusId | `String` | status_id | `@map("status_id") @db.Uuid` |
| category | `String` | category | `Sin atributos explícitos` |
| positionsAvailable | `Int` | positions_available | `@default(1) @map("positions_available")` |
| salaryRange | `String` | salary_range | `@map("salary_range")` |
| languages | `String` | languages | `Sin atributos explícitos` |
| locationUrl | `String` | location_url | `@map("location_url")` |
| requiredCareers | `String[]` | required_careers | `@default([]) @map("required_careers")` |
| minExperienceYears | `Int?` | min_experience_years | `@map("min_experience_years")` |
| otherRequirements | `String[]` | other_requirements | `@default([]) @map("other_requirements")` |
| expiresAt | `DateTime?` | expires_at | `@map("expires_at") @db.Timestamptz(6)` |
| publishedAt | `DateTime` | published_at | `@default(now()) @map("published_at") @db.Timestamptz(6)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| company | `Company` | Relación: Company | `@relation(fields: [companyId], references: [id], onDelete: Cascade)` |
| modality | `JobOfferModality` | Relación: JobOfferModality | `@relation(fields: [modalityId], references: [id], onDelete: Restrict)` |
| contractType | `JobOfferContractType` | Relación: JobOfferContractType | `@relation(fields: [contractTypeId], references: [id], onDelete: Restrict)` |
| status | `JobOfferStatus` | Relación: JobOfferStatus | `@relation(fields: [statusId], references: [id], onDelete: Restrict)` |
| skills | `JobOfferSkill[]` | Relación: JobOfferSkill[] | `Sin atributos explícitos` |
| applications | `JobApplication[]` | Relación: JobApplication[] | `Sin atributos explícitos` |
| radarApplications | `RadarJobApplication[]` | Relación: RadarJobApplication[] | `@ignore` |

Restricciones del modelo:

- `@@index([companyId])`
- `@@index([modalityId])`
- `@@index([contractTypeId])`
- `@@index([statusId])`
- `@@map("job_offers")`

### JobOfferModality

Tabla: `job_offer_modalities`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(100)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| jobOffers | `JobOffer[]` | Relación: JobOffer[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("job_offer_modalities")`

### JobOfferContractType

Tabla: `job_offer_contract_types`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(100)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| jobOffers | `JobOffer[]` | Relación: JobOffer[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("job_offer_contract_types")`

### JobOfferStatus

Tabla: `job_offer_statuses`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(100)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| jobOffers | `JobOffer[]` | Relación: JobOffer[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("job_offer_statuses")`

### AdminExportHistory

Tabla: `admin_export_histories`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| reportName | `String` | report_name | `@map("report_name") @db.VarChar(255)` |
| reportType | `String` | report_type | `@map("report_type") @db.VarChar(100)` |
| user | `User` | Relación: User | `@relation("AdminExportHistories", fields: [userId], references: [id], onDelete: Cascade)` |

Restricciones del modelo:

- `@@unique([userId, createdAt])`
- `@@map("admin_export_histories")`

### AccessRequestStatus

Tabla: `access_request_statuses`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(100)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| accessRequests | `AccessRequest[]` | Relación: AccessRequest[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("access_request_statuses")`

### AccessRequestDocumentType

Tabla: `access_request_document_types`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(100)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| accessRequests | `AccessRequest[]` | Relación: AccessRequest[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("access_request_document_types")`

### File

Tabla: `files`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| name | `String` | name | `@db.VarChar(255)` |
| extension | `String` | extension | `@db.VarChar(10)` |
| mimeType | `String` | mime_type | `@map("mime_type") @db.VarChar(100)` |
| size | `Int` | size | `Sin atributos explícitos` |
| content | `Bytes` | content | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| accessRequest | `AccessRequest?` | Relación: AccessRequest? | `Sin atributos explícitos` |
| auditEvents | `AuditEvent[]` | Relación: AuditEvent[] | `@relation("AuditEventEvidence")` |

Restricciones del modelo:

- `@@map("files")`

### Career

Tabla: `careers`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(100)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| accessRequests | `AccessRequest[]` | Relación: AccessRequest[] | `Sin atributos explícitos` |
| surveys | `Survey[]` | Relación: Survey[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("careers")`

### AccessRequest

Tabla: `access_requests`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| requestCode | `String?` | request_code | `@unique @map("request_code") @db.VarChar(20)` |
| firstName | `String` | first_name | `@map("first_name") @db.VarChar(100)` |
| lastName | `String` | last_name | `@map("last_name") @db.VarChar(100)` |
| idCardNumber | `String` | id_card_number | `@map("id_card_number") @db.VarChar(20)` |
| idCardIssuedIn | `String` | id_card_issued_in | `@map("id_card_issued_in") @db.VarChar(2)` |
| sisCode | `String` | sis_code | `@map("sis_code") @db.VarChar(20)` |
| email | `String` | email | `@db.VarChar(150)` |
| phone | `String?` | phone | `@db.VarChar(8)` |
| birthDate | `DateTime` | birth_date | `@map("birth_date") @db.Date` |
| graduationYear | `Int` | graduation_year | `@map("graduation_year") @db.SmallInt` |
| careerId | `String` | career_id | `@map("career_id") @db.Uuid` |
| statusId | `String` | status_id | `@map("status_id") @db.Uuid` |
| documentTypeId | `String?` | document_type_id | `@map("document_type_id") @db.Uuid` |
| documentFileId | `String?` | document_file_id | `@unique @map("document_file_id") @db.Uuid` |
| submittedAt | `DateTime?` | submitted_at | `@map("submitted_at") @db.Timestamptz(6)` |
| openedById | `String?` | opened_by_id | `@map("opened_by_id") @db.Uuid` |
| openedAt | `DateTime?` | opened_at | `@map("opened_at") @db.Timestamptz(6)` |
| reviewedById | `String?` | reviewed_by_id | `@map("reviewed_by_id") @db.Uuid` |
| approvedUserId | `String?` | approved_user_id | `@unique @map("approved_user_id") @db.Uuid` |
| reviewedAt | `DateTime?` | reviewed_at | `@map("reviewed_at") @db.Timestamptz(6)` |
| rejectionReason | `String?` | rejection_reason | `@map("rejection_reason") @db.VarChar(500)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| status | `AccessRequestStatus` | Relación: AccessRequestStatus | `@relation(fields: [statusId], references: [id], onDelete: Restrict)` |
| documentType | `AccessRequestDocumentType?` | Relación: AccessRequestDocumentType? | `@relation(fields: [documentTypeId], references: [id], onDelete: Restrict)` |
| documentFile | `File?` | Relación: File? | `@relation(fields: [documentFileId], references: [id], onDelete: SetNull)` |
| openedBy | `User?` | Relación: User? | `@relation("AccessRequestOpenedBy", fields: [openedById], references: [id], onDelete: SetNull)` |
| reviewedBy | `User?` | Relación: User? | `@relation("AccessRequestReviewedBy", fields: [reviewedById], references: [id], onDelete: SetNull)` |
| approvedUser | `User?` | Relación: User? | `@relation("ApprovedGraduateAccount", fields: [approvedUserId], references: [id], onDelete: SetNull)` |
| career | `Career` | Relación: Career | `@relation(fields: [careerId], references: [id], onDelete: Restrict)` |
| activationOtps | `ActivationOtp[]` | Relación: ActivationOtp[] | `Sin atributos explícitos` |
| auditEvents | `AuditEvent[]` | Relación: AuditEvent[] | `Sin atributos explícitos` |
| documentValidation | `DocumentValidation?` | Relación: DocumentValidation? | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@index([statusId])`
- `@@index([careerId])`
- `@@index([sisCode])`
- `@@index([idCardNumber])`
- `@@index([email])`
- `@@index([documentTypeId])`
- `@@index([openedById])`
- `@@index([reviewedById])`
- `@@map("access_requests")`

### MentorParticipationRequest

Tabla: `mentor_participation_requests`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| status | `String` | status | `@default("PENDING") @db.VarChar(20)` |
| queuedAt | `DateTime` | queued_at | `@default(now()) @map("queued_at") @db.Timestamptz(6)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| technicalAreaIds | `String[]` | technical_area_ids | `@map("technical_area_ids") @db.Uuid` |
| orientationTypeIds | `String[]` | orientation_type_ids | `@map("orientation_type_ids") @db.Uuid` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Restrict)` |
| offer | `MentorSlotOffer?` | Relación: MentorSlotOffer? | `Sin atributos explícitos` |
| updatedAt | `DateTime` | updated_at | `@default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)` |
| statusId | `String` | status_id | `@default(dbgenerated("mentor_participation_status('PENDING'::text)")) @map("status_id") @db.Uuid` |
| statusCatalog | `MentorParticipationStatus` | Relación: MentorParticipationStatus | `@relation(fields: [statusId], references: [id], onDelete: Restrict, onUpdate: Restrict)` |

Restricciones del modelo:

- `@@index([status, queuedAt, id])`
- `@@index([userId])`
- `@@index([statusId])`
- `@@map("mentor_participation_requests")`

### MentorSlotOffer

Tabla: `mentor_slot_offers`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| status | `String` | status | `@default("OFFERED") @db.VarChar(20)` |
| offeredAt | `DateTime` | offered_at | `@default(now()) @map("offered_at") @db.Timestamptz(6)` |
| expiresAt | `DateTime` | expires_at | `@map("expires_at") @db.Timestamptz(6)` |
| requestId | `String?` | request_id | `@unique @map("request_id") @db.Uuid` |
| confirmedAt | `DateTime?` | confirmed_at | `@map("confirmed_at") @db.Timestamptz(6)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Restrict)` |
| request | `MentorParticipationRequest?` | Relación: MentorParticipationRequest? | `@relation(fields: [requestId], references: [id], onDelete: Restrict)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)` |
| statusId | `String` | status_id | `@default(dbgenerated("mentor_offer_status('OFFERED'::text)")) @map("status_id") @db.Uuid` |
| statusCatalog | `MentorOfferStatus` | Relación: MentorOfferStatus | `@relation(fields: [statusId], references: [id], onDelete: Restrict, onUpdate: Restrict)` |

Restricciones del modelo:

- `@@index([status, expiresAt])`
- `@@index([userId])`
- `@@index([statusId])`
- `@@map("mentor_slot_offers")`

### ActivationOtp

Tabla: `activation_otps`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| accessRequestId | `String` | access_request_id | `@map("access_request_id") @db.Uuid` |
| codeHash | `String` | code_hash | `@map("code_hash") @db.VarChar(255)` |
| expiresAt | `DateTime` | expires_at | `@map("expires_at") @db.Timestamptz(6)` |
| attempts | `Int` | attempts | `@default(0)` |
| usedAt | `DateTime?` | used_at | `@map("used_at") @db.Timestamptz(6)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| accessRequest | `AccessRequest` | Relación: AccessRequest | `@relation(fields: [accessRequestId], references: [id], onDelete: Cascade)` |

Restricciones del modelo:

- `@@index([accessRequestId])`
- `@@map("activation_otps")`

### MessageStatus

Tabla: `message_statuses`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(30)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| messages | `Message[]` | Relación: Message[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("message_statuses")`

### ConnectionRequestStatus

Tabla: `connection_request_statuses`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(30)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| connectionRequests | `ConnectionRequest[]` | Relación: ConnectionRequest[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("connection_request_statuses")`

### AttachmentType

Tabla: `attachment_types`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(30)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| messageAttachments | `MessageAttachment[]` | Relación: MessageAttachment[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("attachment_types")`

### Conversation

Tabla: `conversations`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| userAId | `String?` | user_a_id | `@map("user_a_id") @db.Uuid` |
| userBId | `String?` | user_b_id | `@map("user_b_id") @db.Uuid` |
| lastMessageId | `String?` | last_message_id | `@map("last_message_id") @db.Uuid` |
| lastMessageAt | `DateTime?` | last_message_at | `@map("last_message_at") @db.Timestamptz(6)` |
| eventId | `String?` | event_id | `@unique @map("event_id") @db.Uuid` |
| contextType | `String?` | context_type | `@map("context_type") @db.VarChar(50)` |
| contextId | `String?` | context_id | `@unique @map("context_id") @db.Uuid` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| userA | `User?` | Relación: User? | `@relation("UserAConversations", fields: [userAId], references: [id], onDelete: Cascade)` |
| userB | `User?` | Relación: User? | `@relation("UserBConversations", fields: [userBId], references: [id], onDelete: Cascade)` |
| event | `Event?` | Relación: Event? | `@relation(fields: [eventId], references: [id], onDelete: Cascade)` |
| participants | `ConversationParticipant[]` | Relación: ConversationParticipant[] | `Sin atributos explícitos` |
| messages | `Message[]` | Relación: Message[] | `@relation("ConversationMessages")` |

Restricciones del modelo:

- `@@index([userAId, lastMessageAt(sort: Desc)])`
- `@@index([userBId, lastMessageAt(sort: Desc)])`
- `@@index([userAId, userBId])`
- `@@index([contextType, contextId])`
- `@@map("conversations")`

### ConversationParticipant

Tabla: `conversation_participants`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| conversationId | `String` | conversation_id | `@map("conversation_id") @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| lastReadAt | `DateTime` | last_read_at | `@map("last_read_at") @db.Timestamptz(6)` |
| isMuted | `Boolean` | is_muted | `@default(false) @map("is_muted")` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| conversation | `Conversation` | Relación: Conversation | `@relation(fields: [conversationId], references: [id], onDelete: Cascade)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Cascade)` |

Restricciones del modelo:

- `@@unique([conversationId, userId])`
- `@@index([userId])`
- `@@map("conversation_participants")`

### Message

Tabla: `messages`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| conversationId | `String` | conversation_id | `@map("conversation_id") @db.Uuid` |
| senderId | `String` | sender_id | `@map("sender_id") @db.Uuid` |
| content | `String?` | content | `@db.VarChar(4000)` |
| statusId | `String` | status_id | `@map("status_id") @db.Uuid` |
| sentAt | `DateTime` | sent_at | `@default(now()) @map("sent_at") @db.Timestamptz(6)` |
| deliveredAt | `DateTime?` | delivered_at | `@map("delivered_at") @db.Timestamptz(6)` |
| readAt | `DateTime?` | read_at | `@map("read_at") @db.Timestamptz(6)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| conversation | `Conversation` | Relación: Conversation | `@relation("ConversationMessages", fields: [conversationId], references: [id], onDelete: Cascade)` |
| sender | `User` | Relación: User | `@relation(fields: [senderId], references: [id], onDelete: Cascade)` |
| status | `MessageStatus` | Relación: MessageStatus | `@relation(fields: [statusId], references: [id], onDelete: Restrict)` |
| attachments | `MessageAttachment[]` | Relación: MessageAttachment[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@index([conversationId, sentAt(sort: Desc)])`
- `@@index([senderId])`
- `@@index([statusId])`
- `@@map("messages")`

### MessageAttachment

Tabla: `message_attachments`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| messageId | `String` | message_id | `@map("message_id") @db.Uuid` |
| typeId | `String` | type_id | `@map("type_id") @db.Uuid` |
| fileName | `String` | file_name | `@map("file_name") @db.VarChar(255)` |
| mimeType | `String` | mime_type | `@map("mime_type") @db.VarChar(100)` |
| fileSize | `Int` | file_size | `@map("file_size")` |
| fileData | `Bytes?` | file_data | `@map("file_data")` |
| url | `String?` | url | `@db.VarChar(1000)` |
| thumbnailUrl | `String?` | thumbnail_url | `@map("thumbnail_url") @db.VarChar(1000)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| message | `Message` | Relación: Message | `@relation(fields: [messageId], references: [id], onDelete: Cascade)` |
| type | `AttachmentType` | Relación: AttachmentType | `@relation(fields: [typeId], references: [id], onDelete: Restrict)` |

Restricciones del modelo:

- `@@index([messageId])`
- `@@index([typeId])`
- `@@map("message_attachments")`

### ChatUserBlock

Tabla: `chat_user_blocks`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| blockerId | `String` | blocker_id | `@map("blocker_id") @db.Uuid` |
| blockedId | `String` | blocked_id | `@map("blocked_id") @db.Uuid` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| blocker | `User` | Relación: User | `@relation("ChatBlocker", fields: [blockerId], references: [id], onDelete: Cascade)` |
| blocked | `User` | Relación: User | `@relation("ChatBlocked", fields: [blockedId], references: [id], onDelete: Cascade)` |

Restricciones del modelo:

- `@@unique([blockerId, blockedId])`
- `@@index([blockedId])`
- `@@map("chat_user_blocks")`

### ConnectionRequest

Tabla: `connection_requests`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| senderId | `String` | sender_id | `@map("sender_id") @db.Uuid` |
| receiverId | `String` | receiver_id | `@map("receiver_id") @db.Uuid` |
| statusId | `String` | status_id | `@map("status_id") @db.Uuid` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| sender | `User` | Relación: User | `@relation("SentConnectionRequests", fields: [senderId], references: [id], onDelete: Cascade)` |
| receiver | `User` | Relación: User | `@relation("ReceivedConnectionRequests", fields: [receiverId], references: [id], onDelete: Cascade)` |
| status | `ConnectionRequestStatus` | Relación: ConnectionRequestStatus | `@relation(fields: [statusId], references: [id], onDelete: Restrict)` |

Restricciones del modelo:

- `@@index([senderId])`
- `@@index([receiverId])`
- `@@index([receiverId, statusId])`
- `@@index([statusId])`
- `@@map("connection_requests")`

### UserPresence

Tabla: `user_presences`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| userId | `String` | user_id | `@id @map("user_id") @db.Uuid` |
| isOnline | `Boolean` | is_online | `@default(false) @map("is_online")` |
| lastSeenAt | `DateTime` | last_seen_at | `@default(now()) @map("last_seen_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Cascade)` |

Restricciones del modelo:

- `@@map("user_presences")`

### PasswordResetOtp

Tabla: `password_reset_otps`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| codeHash | `String` | code_hash | `@map("code_hash") @db.VarChar(255)` |
| expiresAt | `DateTime` | expires_at | `@map("expires_at") @db.Timestamptz(6)` |
| attempts | `Int` | attempts | `@default(0) @db.SmallInt` |
| usedAt | `DateTime?` | used_at | `@map("used_at") @db.Timestamptz(6)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Cascade)` |

Restricciones del modelo:

- `@@index([userId])`
- `@@index([expiresAt])`
- `@@map("password_reset_otps")`

### MentorParticipationAttemptLimit

Tabla: `mentor_participation_attempt_limits`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| userId | `String` | user_id | `@id @map("user_id") @db.Uuid` |
| attemptCount | `Int` | attempt_count | `@default(0) @map("attempt_count")` |
| windowStartedAt | `DateTime?` | window_started_at | `@map("window_started_at") @db.Timestamptz(6)` |
| blockedUntil | `DateTime?` | blocked_until | `@map("blocked_until") @db.Timestamptz(6)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Cascade)` |

Restricciones del modelo:

- `@@map("mentor_participation_attempt_limits")`

### JobApplicationStatus

Tabla: `job_application_statuses`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(100)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| applications | `JobApplication[]` | Relación: JobApplication[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("job_application_statuses")`

### JobApplication

Tabla: `job_applications`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| jobOfferId | `String` | job_offer_id | `@map("job_offer_id") @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| statusId | `String` | status_id | `@map("status_id") @db.Uuid` |
| appliedAt | `DateTime` | applied_at | `@default(now()) @map("applied_at") @db.Timestamptz(6)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| jobOffer | `JobOffer` | Relación: JobOffer | `@relation(fields: [jobOfferId], references: [id], onDelete: Cascade)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Cascade)` |
| status | `JobApplicationStatus` | Relación: JobApplicationStatus | `@relation(fields: [statusId], references: [id], onDelete: Restrict)` |
| radarConsent | `RadarApplicationConsent?` | Relación: RadarApplicationConsent? | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@unique([jobOfferId, userId])`
- `@@index([userId])`
- `@@index([statusId])`
- `@@map("job_applications")`

### RadarApplicationConsent

Tabla: `radar_application_consents`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` |
| applicationId | `String` | application_id | `@unique @map("application_id") @db.Uuid` |
| consentToRecruiter | `Boolean` | consent_to_recruiter | `@default(false) @map("consent_to_recruiter")` |
| consentToCv | `Boolean` | consent_to_cv | `@default(false) @map("consent_to_cv")` |
| consentToContact | `Boolean` | consent_to_contact | `@default(false) @map("consent_to_contact")` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)` |
| application | `JobApplication` | Relación: JobApplication | `@relation(fields: [applicationId], references: [id], onDelete: Cascade)` |

Restricciones del modelo:

- `@@map("radar_application_consents")`

### SurveyStatus

Tabla: `survey_statuses`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(100)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| surveys | `Survey[]` | Relación: Survey[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("survey_statuses")`

### SurveyQuestionType

Tabla: `survey_question_types`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(100)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| questions | `SurveyQuestion[]` | Relación: SurveyQuestion[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("survey_question_types")`

### SurveyTargetAudience

Tabla: `survey_target_audiences`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(100)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| surveys | `Survey[]` | Relación: Survey[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("survey_target_audiences")`

### Survey

Tabla: `surveys`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@db.VarChar(150)` |
| description | `String?` | description | `@db.VarChar(500)` |
| careerId | `String?` | career_id | `@map("career_id") @db.Uuid` |
| targetsAllCareers | `Boolean` | targets_all_careers | `@default(false) @map("targets_all_careers")` |
| academicPeriod | `String?` | academic_period | `@map("academic_period") @db.VarChar(7)` |
| targetAudienceId | `String?` | target_audience_id | `@map("target_audience_id") @db.Uuid` |
| opensAt | `DateTime?` | opens_at | `@map("opens_at") @db.Timestamptz(6)` |
| closesAt | `DateTime?` | closes_at | `@map("closes_at") @db.Timestamptz(6)` |
| statusId | `String` | status_id | `@map("status_id") @db.Uuid` |
| createdById | `String` | created_by_id | `@map("created_by_id") @db.Uuid` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| career | `Career?` | Relación: Career? | `@relation(fields: [careerId], references: [id], onDelete: Restrict)` |
| status | `SurveyStatus` | Relación: SurveyStatus | `@relation(fields: [statusId], references: [id], onDelete: Restrict)` |
| targetAudience | `SurveyTargetAudience?` | Relación: SurveyTargetAudience? | `@relation(fields: [targetAudienceId], references: [id], onDelete: Restrict)` |
| createdBy | `User` | Relación: User | `@relation("SurveyCreatedBy", fields: [createdById], references: [id], onDelete: Restrict)` |
| questions | `SurveyQuestion[]` | Relación: SurveyQuestion[] | `Sin atributos explícitos` |
| responses | `SurveyResponse[]` | Relación: SurveyResponse[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@index([careerId, academicPeriod])`
- `@@index([createdById])`
- `@@index([statusId])`
- `@@index([targetAudienceId])`
- `@@map("surveys")`

### SurveyQuestion

Tabla: `survey_questions`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| surveyId | `String` | survey_id | `@map("survey_id") @db.Uuid` |
| position | `Int` | position | `Sin atributos explícitos` |
| statement | `String` | statement | `@db.VarChar(250)` |
| typeId | `String` | type_id | `@map("type_id") @db.Uuid` |
| isRequired | `Boolean` | is_required | `@default(true) @map("is_required")` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| survey | `Survey` | Relación: Survey | `@relation(fields: [surveyId], references: [id], onDelete: Cascade)` |
| type | `SurveyQuestionType` | Relación: SurveyQuestionType | `@relation(fields: [typeId], references: [id], onDelete: Restrict)` |
| options | `SurveyQuestionOption[]` | Relación: SurveyQuestionOption[] | `Sin atributos explícitos` |
| answers | `SurveyAnswer[]` | Relación: SurveyAnswer[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@unique([surveyId, position])`
- `@@index([typeId])`
- `@@map("survey_questions")`

### SurveyQuestionOption

Tabla: `survey_question_options`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| questionId | `String` | question_id | `@map("question_id") @db.Uuid` |
| position | `Int` | position | `Sin atributos explícitos` |
| label | `String` | label | `@db.VarChar(100)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| question | `SurveyQuestion` | Relación: SurveyQuestion | `@relation(fields: [questionId], references: [id], onDelete: Cascade)` |
| answers | `SurveyAnswer[]` | Relación: SurveyAnswer[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@unique([questionId, position])`
- `@@map("survey_question_options")`

### SurveyResponse

Tabla: `survey_responses`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| surveyId | `String` | survey_id | `@map("survey_id") @db.Uuid` |
| respondentId | `String` | respondent_id | `@map("respondent_id") @db.Uuid` |
| submittedAt | `DateTime` | submitted_at | `@default(now()) @map("submitted_at") @db.Timestamptz(6)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| survey | `Survey` | Relación: Survey | `@relation(fields: [surveyId], references: [id], onDelete: Cascade)` |
| respondent | `User` | Relación: User | `@relation("SurveyRespondent", fields: [respondentId], references: [id], onDelete: Restrict)` |
| answers | `SurveyAnswer[]` | Relación: SurveyAnswer[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@unique([surveyId, respondentId])`
- `@@index([respondentId])`
- `@@map("survey_responses")`

### SurveyAnswer

Tabla: `survey_answers`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| responseId | `String` | response_id | `@map("response_id") @db.Uuid` |
| questionId | `String` | question_id | `@map("question_id") @db.Uuid` |
| optionId | `String?` | option_id | `@map("option_id") @db.Uuid` |
| textValue | `String?` | text_value | `@map("text_value") @db.Text` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| response | `SurveyResponse` | Relación: SurveyResponse | `@relation(fields: [responseId], references: [id], onDelete: Cascade)` |
| question | `SurveyQuestion` | Relación: SurveyQuestion | `@relation(fields: [questionId], references: [id], onDelete: Cascade)` |
| option | `SurveyQuestionOption?` | Relación: SurveyQuestionOption? | `@relation(fields: [optionId], references: [id], onDelete: Cascade)` |

Restricciones del modelo:

- `@@index([responseId])`
- `@@index([optionId])`
- `@@index([questionId, optionId])`
- `@@map("survey_answers")`

### AuditAction

Tabla: `audit_actions`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(100)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| auditEvents | `AuditEvent[]` | Relación: AuditEvent[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("audit_actions")`

### AuditEvent

Tabla: `audit_events`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| number | `Int` | number | `@unique @default(autoincrement())` |
| accessRequestId | `String` | access_request_id | `@map("access_request_id") @db.Uuid` |
| requestCode | `String` | request_code | `@map("request_code") @db.VarChar(20)` |
| applicantName | `String` | applicant_name | `@map("applicant_name") @db.VarChar(201)` |
| applicantCareer | `String` | applicant_career | `@map("applicant_career") @db.VarChar(100)` |
| actionId | `String` | action_id | `@map("action_id") @db.Uuid` |
| actorId | `String?` | actor_id | `@map("actor_id") @db.Uuid` |
| actorName | `String` | actor_name | `@map("actor_name") @db.VarChar(201)` |
| actorRole | `String` | actor_role | `@map("actor_role") @db.VarChar(50)` |
| detail | `String?` | detail | `@db.VarChar(500)` |
| evidenceFileId | `String?` | evidence_file_id | `@map("evidence_file_id") @db.Uuid` |
| occurredAt | `DateTime` | occurred_at | `@default(now()) @map("occurred_at") @db.Timestamptz(6)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| accessRequest | `AccessRequest` | Relación: AccessRequest | `@relation(fields: [accessRequestId], references: [id], onDelete: Restrict)` |
| action | `AuditAction` | Relación: AuditAction | `@relation(fields: [actionId], references: [id], onDelete: Restrict)` |
| actor | `User?` | Relación: User? | `@relation("AuditEventActor", fields: [actorId], references: [id], onDelete: SetNull)` |
| evidenceFile | `File?` | Relación: File? | `@relation("AuditEventEvidence", fields: [evidenceFileId], references: [id], onDelete: Restrict)` |

Restricciones del modelo:

- `@@index([occurredAt(sort: Desc), number(sort: Desc)])`
- `@@index([accessRequestId, occurredAt])`
- `@@index([actionId])`
- `@@index([actorId])`
- `@@index([evidenceFileId])`
- `@@map("audit_events")`

### DocumentValidation

Tabla: `document_validations`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| accessRequestId | `String` | access_request_id | `@unique @map("access_request_id") @db.Uuid` |
| result | `String` | result | `@db.VarChar(30)` |
| matchScore | `Int?` | match_score | `@map("match_score") @db.SmallInt` |
| reason | `String?` | reason | `@db.VarChar(200)` |
| fieldResults | `Json?` | field_results | `@map("field_results")` |
| queuedAt | `DateTime` | queued_at | `@default(now()) @map("queued_at") @db.Timestamptz(6)` |
| readAt | `DateTime?` | read_at | `@map("read_at") @db.Timestamptz(6)` |
| revertedAt | `DateTime?` | reverted_at | `@map("reverted_at") @db.Timestamptz(6)` |
| revertedById | `String?` | reverted_by_id | `@map("reverted_by_id") @db.Uuid` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| accessRequest | `AccessRequest` | Relación: AccessRequest | `@relation(fields: [accessRequestId], references: [id], onDelete: Cascade)` |
| revertedBy | `User?` | Relación: User? | `@relation("DocumentValidationRevertedBy", fields: [revertedById], references: [id], onDelete: SetNull)` |

Restricciones del modelo:

- `@@index([result])`
- `@@index([revertedById])`
- `@@map("document_validations")`

### MentorIntakeAttempt

Tabla: `mentor_intake_attempts`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| operationId | `String` | operation_id | `@default(dbgenerated("mentor_intake_operation('LEGACY'::text)")) @map("operation_id") @db.Uuid` |
| intakeOperation | `MentorIntakeOperation` | Relación: MentorIntakeOperation | `@relation(fields: [operationId], references: [id], onDelete: Restrict, onUpdate: NoAction)` |
| id | `String` | id | `@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| operation | `String` | operation | `@db.VarChar(20)` |
| idempotencyKey | `String` | idempotency_key | `@map("idempotency_key") @db.Uuid` |
| payloadHash | `String` | payload_hash | `@map("payload_hash") @db.VarChar(64)` |
| occurredAt | `DateTime` | occurred_at | `@default(dbgenerated("clock_timestamp()")) @map("occurred_at") @db.Timestamptz(6)` |
| counted | `Boolean` | counted | `@default(true)` |
| responseStatus | `Int` | response_status | `@map("response_status")` |
| responseData | `Json` | response_data | `@map("response_data")` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Restrict, onUpdate: NoAction)` |
| sanction | `MentorParticipationSanction?` | Relación: MentorParticipationSanction? | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@unique([userId, operation, idempotencyKey], map: "mentor_intake_attempts_identity")`
- `@@index([operationId])`
- `@@map("mentor_intake_attempts")`

### MentorParticipationSanction

Tabla: `mentor_participation_sanctions`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| triggerAttemptId | `String?` | trigger_attempt_id | `@unique @map("trigger_attempt_id") @db.Uuid` |
| startedAt | `DateTime` | started_at | `@map("started_at") @db.Timestamptz(6)` |
| endsAt | `DateTime` | ends_at | `@map("ends_at") @db.Timestamptz(6)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Restrict, onUpdate: NoAction)` |
| triggerAttempt | `MentorIntakeAttempt?` | Relación: MentorIntakeAttempt? | `@relation(fields: [triggerAttemptId], references: [id], onDelete: Restrict, onUpdate: NoAction)` |

Restricciones del modelo:

- `@@index([userId, endsAt], map: "mentor_participation_sanctions_active")`
- `@@map("mentor_participation_sanctions")`

### MentorIntakeOperation

Tabla: `mentor_intake_operations`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(30)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)` |
| attempts | `MentorIntakeAttempt[]` | Relación: MentorIntakeAttempt[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("mentor_intake_operations")`

### RadarCvEvidence

Tabla: `radar_cv_evidence`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` |
| cvId | `String` | cv_id | `@unique @map("cv_id") @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| extractedText | `String` | extracted_text | `@default("") @map("extracted_text") @db.Text` |
| submittedAt | `DateTime` | submitted_at | `@default(now()) @map("submitted_at") @db.Timestamptz(6)` |
| decidedAt | `DateTime?` | decided_at | `@map("decided_at") @db.Timestamptz(6)` |
| reviewerId | `String?` | reviewer_id | `@map("reviewer_id") @db.Uuid` |
| extractionStatusId | `String` | extraction_status_id | `@map("extraction_status_id") @db.Uuid` |
| reviewStatusId | `String` | review_status_id | `@map("review_status_id") @db.Uuid` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)` |
| cv | `UserCvFile` | Relación: UserCvFile | `@relation(fields: [cvId], references: [id], onDelete: Cascade, onUpdate: NoAction)` |
| owner | `User` | Relación: User | `@relation("RadarCvOwner", fields: [userId], references: [id], onDelete: Cascade, onUpdate: NoAction)` |
| reviewer | `User?` | Relación: User? | `@relation("RadarCvReviewer", fields: [reviewerId], references: [id], onDelete: SetNull)` |
| extractionState | `RadarCvExtractionStatus` | Relación: RadarCvExtractionStatus | `@relation(fields: [extractionStatusId], references: [id], onDelete: Restrict, onUpdate: Restrict)` |
| reviewState | `RadarCvReviewStatus` | Relación: RadarCvReviewStatus | `@relation(fields: [reviewStatusId], references: [id], onDelete: Restrict, onUpdate: Restrict)` |

Restricciones del modelo:

- `@@index([reviewStatusId, submittedAt], map: "radar_cv_evidence_review_idx")`
- `@@index([userId], map: "radar_cv_evidence_user_idx")`
- `@@index([reviewerId], map: "radar_cv_evidence_reviewer_idx")`
- `@@index([extractionStatusId], map: "radar_cv_evidence_extraction_status_idx")`
- `@@index([reviewStatusId], map: "radar_cv_evidence_review_status_idx")`
- `@@map("radar_cv_evidence")`

### RadarScoreSnapshot

Tabla: `radar_score_snapshots`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| version | `Int` | version | `Sin atributos explícitos` |
| rubricVersion | `String` | rubric_version | `@map("rubric_version") @db.VarChar(80)` |
| fingerprint | `String` | fingerprint | `@db.VarChar(64)` |
| scores | `Json` | scores | `Sin atributos explícitos` |
| evidence | `Json` | evidence | `Sin atributos explícitos` |
| averageScore | `Decimal` | average_score | `@map("average_score") @db.Decimal(5, 2)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: NoAction)` |

Restricciones del modelo:

- `@@unique([userId, version], map: "radar_score_snapshots_user_version_key")`
- `@@index([userId], map: "radar_score_snapshots_user_idx")`
- `@@map("radar_score_snapshots")`

### RadarAuditEvent

Tabla: `radar_audit_events`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| actorId | `String?` | actor_id | `@map("actor_id") @db.Uuid` |
| eventType | `String` | event_type | `@map("event_type") @db.VarChar(80)` |
| targetId | `String?` | target_id | `@map("target_id") @db.Uuid` |
| details | `Json` | details | `@default("{}")` |
| occurredAt | `DateTime` | occurred_at | `@default(now()) @map("occurred_at") @db.Timestamptz(6)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)` |
| subject | `User` | Relación: User | `@relation("RadarAuditSubject", fields: [userId], references: [id], onDelete: Cascade, onUpdate: NoAction)` |
| actor | `User?` | Relación: User? | `@relation("RadarAuditActor", fields: [actorId], references: [id], onDelete: SetNull)` |

Restricciones del modelo:

- `@@index([userId, occurredAt(sort: Desc)], map: "radar_audit_user_idx")`
- `@@index([userId], map: "radar_audit_subject_idx")`
- `@@index([actorId], map: "radar_audit_actor_idx")`
- `@@map("radar_audit_events")`

### RadarCvExtractionStatus

Tabla: `radar_cv_extraction_statuses`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(24)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)` |
| evidences | `RadarCvEvidence[]` | Relación: RadarCvEvidence[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("radar_cv_extraction_statuses")`

### RadarCvReviewStatus

Tabla: `radar_cv_review_statuses`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(24)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)` |
| evidences | `RadarCvEvidence[]` | Relación: RadarCvEvidence[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("radar_cv_review_statuses")`

### RadarCompanyAccess

Tabla: `radar_company_access`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| companyId | `String` | company_id | `@map("company_id") @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| company | `Company` | Relación: Company | `@relation(fields: [companyId], references: [id], onDelete: Cascade, onUpdate: NoAction)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: NoAction)` |

Restricciones del modelo:

- `@@id([companyId, userId])`
- `@@map("radar_company_access")`
- `@@ignore`

### RadarJobApplication

Tabla: `radar_job_applications`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` |
| jobOfferId | `String` | job_offer_id | `@map("job_offer_id") @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| consentToRecruiter | `Boolean` | consent_to_recruiter | `@default(false) @map("consent_to_recruiter")` |
| consentToCv | `Boolean` | consent_to_cv | `@default(false) @map("consent_to_cv")` |
| consentToContact | `Boolean` | consent_to_contact | `@default(false) @map("consent_to_contact")` |
| state | `String` | state | `@default("applied") @db.VarChar(24)` |
| appliedAt | `DateTime` | applied_at | `@default(now()) @map("applied_at") @db.Timestamptz(6)` |
| decidedAt | `DateTime?` | decided_at | `@map("decided_at") @db.Timestamptz(6)` |
| decidedBy | `String?` | decided_by | `@map("decided_by") @db.Uuid` |
| jobOffer | `JobOffer` | Relación: JobOffer | `@relation(fields: [jobOfferId], references: [id], onDelete: Cascade, onUpdate: NoAction)` |
| user | `User` | Relación: User | `@relation("RadarApplicant", fields: [userId], references: [id], onDelete: Cascade, onUpdate: NoAction)` |
| decider | `User?` | Relación: User? | `@relation("RadarDecision", fields: [decidedBy], references: [id], onDelete: NoAction, onUpdate: NoAction)` |

Restricciones del modelo:

- `@@unique([jobOfferId, userId])`
- `@@index([jobOfferId, appliedAt(sort: Desc)], map: "radar_job_applications_vacancy_idx")`
- `@@map("radar_job_applications")`
- `@@ignore`

### MentorParticipationStatus

Tabla: `mentor_request_statuses`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(20)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)` |
| records | `MentorParticipationRequest[]` | Relación: MentorParticipationRequest[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("mentor_request_statuses")`

### MentorOfferStatus

Tabla: `mentor_offer_statuses`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` |
| title | `String` | title | `@unique @db.VarChar(20)` |
| description | `String?` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)` |
| records | `MentorSlotOffer[]` | Relación: MentorSlotOffer[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("mentor_offer_statuses")`

### RadarDocumentVerification

Tabla: `radar_document_verifications`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| sourceTypeId | `String` | source_type_id | `@map("source_type_id") @db.Uuid` |
| sourceId | `String` | source_id | `@map("source_id") @db.Uuid` |
| filename | `String` | filename | `Sin atributos explícitos` |
| mime | `String` | mime | `Sin atributos explícitos` |
| content | `Bytes?` | content | `Sin atributos explícitos` |
| sizeBytes | `Int` | size_bytes | `@map("size_bytes")` |
| active | `Boolean` | active | `@default(true)` |
| digest | `String` | digest | `Sin atributos explícitos` |
| statusId | `String` | status_id | `@default(dbgenerated("'a0000000-0000-4000-8000-000000000001'::uuid")) @map("status_id") @db.Uuid` |
| confidence | `Float?` | confidence | `Sin atributos explícitos` |
| reason | `String` | reason | `@default("")` |
| skills | `Json` | skills | `@default("[]")` |
| createdAt | `DateTime` | created_at | `@default(dbgenerated("clock_timestamp()")) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@default(dbgenerated("clock_timestamp()")) @updatedAt @map("updated_at") @db.Timestamptz(6)` |
| decidedAt | `DateTime?` | decided_at | `@map("decided_at") @db.Timestamptz(6)` |
| reviewerId | `String?` | reviewer_id | `@map("reviewer_id") @db.Uuid` |
| noticeRead | `Boolean` | notice_read | `@default(false) @map("notice_read")` |
| publishedIds | `Json` | published_ids | `@default("[]") @map("published_ids")` |
| radarVersion | `Int?` | radar_version | `@map("radar_version")` |
| synced | `Boolean` | synced | `@default(false)` |
| lease | `String?` | lease | `@db.Uuid` |
| retryAt | `DateTime` | retry_at | `@default(now()) @map("retry_at") @db.Timestamptz(6)` |
| owner | `User` | Relación: User | `@relation("VerifiedDocumentOwner", fields:[userId],references:[id],onDelete:Cascade,onUpdate:NoAction)` |
| reviewer | `User?` | Relación: User? | `@relation("VerifiedDocumentReviewer",fields:[reviewerId],references:[id],onDelete:SetNull,onUpdate:NoAction)` |
| statusEntry | `RadarDocumentStatus` | Relación: RadarDocumentStatus | `@relation(fields:[statusId], references:[id], onDelete:Restrict, onUpdate:Cascade, map:"radar_document_status_fk")` |
| sourceTypeEntry | `RadarDocumentSourceType` | Relación: RadarDocumentSourceType | `@relation(fields:[sourceTypeId], references:[id], onDelete:Restrict, onUpdate:Cascade, map:"radar_document_source_type_fk")` |

Restricciones del modelo:

- `@@index([userId,createdAt(sort:Desc)],map:"radar_doc_owner_date")`
- `@@map("radar_document_verifications")`
- `@@index([reviewerId],map:"radar_doc_reviewer")`
- `@@index([statusId],map:"radar_doc_status")`
- `@@index([sourceTypeId],map:"radar_doc_source_type")`

### PortfolioProvider

Tabla: `portfolio_providers`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| name | `String` | name | `@unique @db.VarChar(50)` |
| description | `String?` | description | `@db.VarChar(150)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| socialAccounts | `UserSocialAccount[]` | Relación: UserSocialAccount[] | `Sin atributos explícitos` |
| portfolioProjects | `UserPortfolioProject[]` | Relación: UserPortfolioProject[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("portfolio_providers")`

### UserSocialAccount

Tabla: `user_social_accounts`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| providerId | `String` | provider_id | `@map("provider_id") @db.Uuid` |
| externalId | `String` | external_id | `@map("external_id") @db.VarChar(100)` |
| username | `String` | username | `@db.VarChar(100)` |
| profileUrl | `String?` | profile_url | `@map("profile_url") @db.VarChar(500)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Cascade)` |
| provider | `PortfolioProvider` | Relación: PortfolioProvider | `@relation(fields: [providerId], references: [id], onDelete: Restrict)` |
| portfolioProjects | `UserPortfolioProject[]` | Relación: UserPortfolioProject[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@unique([userId, providerId])`
- `@@unique([providerId, externalId])`
- `@@index([providerId])`
- `@@map("user_social_accounts")`

### UserPortfolioProject

Tabla: `user_portfolio_projects`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| socialAccountId | `String?` | social_account_id | `@map("social_account_id") @db.Uuid` |
| providerId | `String` | provider_id | `@map("provider_id") @db.Uuid` |
| repoName | `String` | repo_name | `@map("repo_name") @db.VarChar(150)` |
| repoUrl | `String` | repo_url | `@map("repo_url") @db.VarChar(500)` |
| description | `String?` | description | `@db.Text` |
| language | `String?` | language | `@db.VarChar(60)` |
| starsCount | `Int` | stars_count | `@default(0) @map("stars_count")` |
| isOwner | `Boolean` | is_owner | `@default(true) @map("is_owner")` |
| displayOrder | `Int` | display_order | `@default(0) @map("display_order") @db.SmallInt` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Cascade)` |
| socialAccount | `UserSocialAccount?` | Relación: UserSocialAccount? | `@relation(fields: [socialAccountId], references: [id], onDelete: SetNull)` |
| provider | `PortfolioProvider` | Relación: PortfolioProvider | `@relation(fields: [providerId], references: [id], onDelete: Restrict)` |

Restricciones del modelo:

- `@@unique([userId, providerId, repoName])`
- `@@index([userId, displayOrder])`
- `@@index([socialAccountId])`
- `@@index([providerId])`
- `@@map("user_portfolio_projects")`

### NotificationType

Tabla: `notification_types`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| code | `String` | code | `@unique @db.VarChar(50)` |
| name | `String` | name | `@db.VarChar(100)` |
| sendsPush | `Boolean` | sends_push | `@default(false) @map("sends_push")` |
| sendsEmail | `Boolean` | sends_email | `@default(false) @map("sends_email")` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| notifications | `Notification[]` | Relación: Notification[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("notification_types")`

### Notification

Tabla: `notifications`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| recipientId | `String` | recipient_id | `@map("recipient_id") @db.Uuid` |
| actorId | `String?` | actor_id | `@map("actor_id") @db.Uuid` |
| typeId | `String` | type_id | `@map("type_id") @db.Uuid` |
| title | `String` | title | `@db.VarChar(120)` |
| body | `String` | body | `@db.VarChar(255)` |
| link | `String` | link | `@db.VarChar(500)` |
| groupKey | `String?` | group_key | `@map("group_key") @db.VarChar(100)` |
| readAt | `DateTime?` | read_at | `@map("read_at") @db.Timestamptz(6)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| recipient | `User` | Relación: User | `@relation("ReceivedNotifications", fields: [recipientId], references: [id], onDelete: Cascade)` |
| actor | `User?` | Relación: User? | `@relation("TriggeredNotifications", fields: [actorId], references: [id], onDelete: SetNull)` |
| type | `NotificationType` | Relación: NotificationType | `@relation(fields: [typeId], references: [id], onDelete: Restrict)` |

Restricciones del modelo:

- `@@index([recipientId, readAt])`
- `@@index([recipientId, createdAt(sort: Desc)])`
- `@@index([actorId])`
- `@@index([typeId])`
- `@@map("notifications")`

### PushSubscription

Tabla: `push_subscriptions`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(uuid()) @db.Uuid` |
| userId | `String` | user_id | `@map("user_id") @db.Uuid` |
| endpoint | `String` | endpoint | `@unique @db.VarChar(500)` |
| p256dh | `String` | p256dh | `@db.VarChar(255)` |
| auth | `String` | auth | `@db.VarChar(255)` |
| userAgent | `String?` | user_agent | `@map("user_agent") @db.VarChar(255)` |
| lastUsedAt | `DateTime?` | last_used_at | `@map("last_used_at") @db.Timestamptz(6)` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Cascade)` |

Restricciones del modelo:

- `@@index([userId])`
- `@@map("push_subscriptions")`

### NotificationPreference

Tabla: `notification_preferences`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| userId | `String` | user_id | `@id @map("user_id") @db.Uuid` |
| pushEnabled | `Boolean` | push_enabled | `@default(false) @map("push_enabled")` |
| emailEnabled | `Boolean` | email_enabled | `@default(true) @map("email_enabled")` |
| inAppEnabled | `Boolean` | in_app_enabled | `@default(true) @map("in_app_enabled")` |
| createdAt | `DateTime` | created_at | `@default(now()) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@updatedAt @map("updated_at") @db.Timestamptz(6)` |
| user | `User` | Relación: User | `@relation(fields: [userId], references: [id], onDelete: Cascade)` |

Restricciones del modelo:

- `@@map("notification_preferences")`

### RadarDocumentStatus

Tabla: `radar_document_statuses`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` |
| title | `String` | title | `@unique` |
| description | `String` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(dbgenerated("clock_timestamp()")) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@default(dbgenerated("clock_timestamp()")) @updatedAt @map("updated_at") @db.Timestamptz(6)` |
| documents | `RadarDocumentVerification[]` | Relación: RadarDocumentVerification[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("radar_document_statuses")`

### RadarDocumentSourceType

Tabla: `radar_document_source_types`.

| Campo | Tipo Prisma | Columna o relación | Definición y restricciones |
| --- | --- | --- | --- |
| id | `String` | id | `@id @default(dbgenerated("gen_random_uuid()")) @db.Uuid` |
| title | `String` | title | `@unique` |
| description | `String` | description | `Sin atributos explícitos` |
| createdAt | `DateTime` | created_at | `@default(dbgenerated("clock_timestamp()")) @map("created_at") @db.Timestamptz(6)` |
| updatedAt | `DateTime` | updated_at | `@default(dbgenerated("clock_timestamp()")) @updatedAt @map("updated_at") @db.Timestamptz(6)` |
| documents | `RadarDocumentVerification[]` | Relación: RadarDocumentVerification[] | `Sin atributos explícitos` |

Restricciones del modelo:

- `@@map("radar_document_source_types")`

## Sprint History

### Sprint 3

- Publicaciones de radar, auditoría y respaldos de CV.
- HU5: versiones documentales, catálogo de estados y tipos de fuente, sincronización con publicaciones.
- Integración de consentimientos para consultas de reclutamiento.
- Inventario de modelos, relaciones, claves e índices del esquema combinado. Los ajustes pendientes del estándar se solicitan al equipo propietario antes de modificar migraciones.

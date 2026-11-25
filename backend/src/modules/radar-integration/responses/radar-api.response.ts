import { RadarDocumentSourceType } from '../constants/radar-document-source-type.enum.js';
import { RadarDocumentStatus } from '../constants/radar-document-status.enum.js';
import { z } from 'zod';

const identifier = z
  .uuid()
  .meta({ example: 'a0000000-0000-4000-8000-000000000001' });
const timestamp = z.iso
  .datetime()
  .meta({ example: '2026-11-16T12:00:00.000Z' });
const score = z.number().min(0).max(10);
const scores = z.object({
  desarrollo: score,
  'cloud-devops': score,
  'data-ai': score,
  qa: score,
  ciberseguridad: score,
  'gobernanza-ti': score,
});
const evidence = z.record(
  z.string(),
  z.array(z.object({ id: identifier, name: z.string() })),
);
const reference = z.object({ type: z.string(), id: identifier });
const skill = z.object({
  id: identifier,
  name: z.string(),
  areaId: z.string().nullable(),
  isHighRelevance: z.boolean(),
  evidenceRefs: z.array(reference),
});
const applicationState = z.enum([
  'applied',
  'interview',
  'hired',
  'rejected',
  'withdrawn',
]);

export const radarResponseSchema = z.object({
  userId: identifier,
  status: z.enum(['empty', 'published']),
  version: z.number().int().nonnegative(),
  sourceRevision: z.number().int().nullable(),
  rubricVersion: z.string(),
  updatedAt: timestamp.nullable(),
  scores,
  average: score,
  variation: z.number().nullable(),
  evidence,
  skills: z.array(skill),
  previous: z
    .object({ version: z.number().int(), updatedAt: timestamp, scores })
    .nullable(),
  pending: z.number().int().nonnegative(),
  hasPending: z.boolean(),
  processingStatus: z.enum(['ready', 'pending', 'error']),
  inputRevision: z.number().int(),
  dictionaryVersion: z.string().nullable(),
});

export const radarSimulationEligibilitySchema = z.object({
  approved: z.array(z.object({ id: identifier, name: z.string() })),
  highRelevanceSkillIds: z.array(identifier),
});

export const cvRescanResponseSchema = z.object({
  cvId: identifier,
  extractionStatus: z
    .string()
    .describe('Estado del catálogo de extracción de CV.'),
  extractedCharacters: z.number().int().nonnegative(),
  reviewStatus: z.string().describe('Estado del catálogo de revisión de CV.'),
  nlpStatus: z.string().describe('Estado del análisis NLP del perfil.'),
});

export const radarReviewOperationResponseSchema = z.object({
  operationId: identifier,
  status: z.literal('completed'),
  kind: z.enum(['cv', 'skill']),
  targetId: identifier,
  decision: z.enum(['approved', 'rejected', 'revoked']),
  changed: z.boolean(),
  userId: identifier.nullable(),
  completedAt: timestamp,
});

export const radarNotificationsResponseSchema = z.array(
  z.object({
    id: identifier,
    message: z.string(),
    version: z.number().int(),
    createdAt: timestamp,
    readAt: timestamp.nullable(),
  }),
);

export const openedRadarNotificationResponseSchema = z.object({
  notification: z.object({
    id: identifier,
    version: z.number().int(),
    readAt: timestamp,
  }),
  radar: radarResponseSchema,
  compare: z.boolean(),
});

export const reviewQueueResponseSchema = z.array(
  z.object({
    id: z.string().describe('Identificador compuesto cv:UUID o skill:UUID.'),
    userId: identifier,
    userName: z.string(),
    type: z.enum([RadarDocumentSourceType.CV, 'skill']),
    title: z.string(),
    status: z.string(),
    date: timestamp,
    extractionStatus: z.string().optional(),
    extractedCharacters: z.number().int().optional(),
    areaId: z.string().nullable().optional(),
    evidenceRefs: z.array(reference).optional(),
  }),
);

export const documentVerificationResponseSchema = z.object({
  id: identifier,
  sourceId: identifier,
  sourceType: z.enum([
    RadarDocumentSourceType.CV,
    RadarDocumentSourceType.CERTIFICATION,
  ]),
  filename: z.string(),
  mime: z.string(),
  sizeBytes: z.number().int(),
  noticeRead: z.boolean(),
  radarVersion: z.number().int().nullable(),
  publishedIds: z.array(identifier),
  status: z.enum([
    RadarDocumentStatus.QUEUED,
    RadarDocumentStatus.READING,
    RadarDocumentStatus.APPROVED,
    RadarDocumentStatus.REVIEW,
    RadarDocumentStatus.LOW_CONFIDENCE,
    RadarDocumentStatus.MANUAL_APPROVED,
    RadarDocumentStatus.MANUAL_REJECTED,
    RadarDocumentStatus.LEGACY,
    RadarDocumentStatus.CANCELLED,
  ]),
  confidence: z.number().min(0).max(1).nullable(),
  reason: z.string(),
  active: z.boolean(),
  synced: z.boolean(),
  available: z.boolean(),
  createdAt: timestamp,
  decidedAt: timestamp.nullable(),
  skills: z.array(
    z.object({ id: identifier, name: z.string(), areaId: z.string() }),
  ),
  ownerName: z.string().optional(),
});
export const documentHistoryResponseSchema = z.array(
  documentVerificationResponseSchema,
);
export const documentMutationResponseSchema = z.object({ id: identifier });
export const companyAccessResponseSchema = z.object({
  userId: identifier,
  companyId: identifier,
});
export const vacancyResponseSchema = z.object({
  id: identifier,
  title: z.string(),
  companyId: identifier,
});
export const vacanciesResponseSchema = z.array(vacancyResponseSchema);
export const activeVacanciesResponseSchema = z.array(
  vacancyResponseSchema.extend({ description: z.string() }),
);
export const consentsResponseSchema = z.object({
  id: identifier,
  state: applicationState,
  consent: z.boolean(),
  consentCv: z.boolean(),
  consentContact: z.boolean(),
});
export const applicationResponseSchema = consentsResponseSchema.extend({
  jobOfferId: identifier,
});
export const applicationsResponseSchema = z.array(
  applicationResponseSchema.extend({ appliedAt: timestamp }),
);
export const applicationDecisionResponseSchema = z.object({
  id: identifier,
  state: applicationState,
});
export const applicantsResponseSchema = z.object({
  vacancy: z.object({ id: identifier, title: z.string(), target: scores }),
  totalApplications: z.number().int().nonnegative(),
  applicants: z.array(
    z.object({
      applicationId: identifier,
      userId: identifier,
      name: z.string(),
      headline: z.string(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
      appliedAt: timestamp,
      state: applicationState,
      canViewCv: z.boolean(),
      version: z.number().int(),
      average: score,
      scores,
      evidence,
      comparison: z.object({
        match: z.number().min(0).max(100),
        gaps: z.record(z.string(), z.number()),
      }),
      skills: z.array(z.string()),
    }),
  ),
});
export const areaEvidenceResponseSchema = z.object({
  education: z.array(
    z.object({
      id: identifier,
      degree: z.string(),
      institution: z.string(),
      year: z.number().int(),
      description: z.string().nullable(),
    }),
  ),
  certifications: z.array(
    z.object({
      id: identifier,
      name: z.string(),
      issuer: z.string(),
      year: z.number().int(),
    }),
  ),
  experiences: z.array(
    z.object({
      id: identifier,
      position: z.string(),
      companyName: z.string(),
      duration: z.string(),
      description: z.string().nullable(),
    }),
  ),
  tags: z.array(z.string()),
});

export const documentDecisionResponseSchema = z.union([
  documentMutationResponseSchema,
  radarReviewOperationResponseSchema,
]);

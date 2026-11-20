import type { SchemaObject } from '@nestjs/swagger';

const text: SchemaObject = {
  type: 'string',
  example: 'Ingeniería de software',
};
const uuid: SchemaObject = {
  type: 'string',
  format: 'uuid',
  example: '7dd01892-ef53-456b-8e5c-fde35324dc18',
};
const date: SchemaObject = {
  type: 'string',
  format: 'date-time',
  example: '2026-11-17T12:00:00.000Z',
};
const number: SchemaObject = { type: 'integer', minimum: 0, example: 0 };
const boolean: SchemaObject = { type: 'boolean' };
const nullable = (schema: SchemaObject): SchemaObject => ({
  ...schema,
  nullable: true,
});
const array = (items: SchemaObject): SchemaObject => ({ type: 'array', items });
const object = (
  properties: Record<string, SchemaObject>,
  required = Object.keys(properties),
): SchemaObject => ({ type: 'object', properties, required });
const selection = object({ id: uuid, name: text, description: nullable(text) });
const named = object({ id: uuid, title: text });
const education = object({
  id: uuid,
  institution: text,
  degree: text,
  startDate: date,
  endDate: nullable(date),
  description: nullable(text),
});
const directoryItem = object({
  id: uuid,
  fullName: text,
  headline: nullable(text),
  photoUrl: nullable(text),
  education: nullable(object({ degree: text, institution: text })),
  isAvailable: boolean,
  technicalAreas: array(text),
  orientationTypes: array(text),
});
const request = object({
  id: uuid,
  userId: uuid,
  status: {
    type: 'string',
    enum: ['PENDING', 'OFFERED', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'ENDED'],
  },
  queuedAt: date,
  createdAt: date,
  technicalAreaIds: { ...array(uuid), minItems: 1 },
  orientationTypeIds: { ...array(uuid), minItems: 1 },
});
const historyItem = object({
  ...request.properties,
  updatedAt: date,
  statusId: uuid,
});
const offer = object({
  id: uuid,
  userId: uuid,
  status: { type: 'string', enum: ['OFFERED', 'CONFIRMED', 'EXPIRED'] },
  offeredAt: date,
  expiresAt: date,
  requestId: nullable(uuid),
  confirmedAt: nullable(date),
  createdAt: date,
  updatedAt: date,
  statusId: uuid,
});
const capacity = object({
  percentage: { type: 'integer', minimum: 1, maximum: 100, example: 40 },
  approvedGraduates: number,
  activeMentors: number,
  reservedOffers: number,
  capacity: number,
  occupied: number,
  available: number,
});
const person = {
  id: uuid,
  firstName: text,
  lastName: text,
  email: { type: 'string', format: 'email' },
} satisfies Record<string, SchemaObject>;
const page = (items: SchemaObject, total = 'totalItems'): SchemaObject =>
  object({
    items: array(items),
    [total]: number,
    page: { type: 'integer', minimum: 1 },
    limit: { type: 'integer', minimum: 1 },
    totalPages: number,
  });
const suggestion = (code: string, field: string): SchemaObject =>
  object({
    code: { type: 'string', enum: [code] },
    field: { type: 'string', enum: [field] },
    message: text,
    title: text,
    benefitDescription: text,
    editReference: object({
      section: { type: 'string', enum: [field] },
      action: { type: 'string', enum: ['edit'] },
    }),
  });

export const MENTOR_API_SCHEMAS = {
  list: array(directoryItem),
  similar: { ...array(directoryItem), maxItems: 3 },
  directory: object(
    {
      items: array(
        object(
          { ...directoryItem.properties, sharedInterestsCount: number },
          directoryItem.required,
        ),
      ),
      page: { type: 'integer', minimum: 1 },
      pageSize: { type: 'integer', enum: [6] },
      totalItems: number,
      totalPages: number,
      effectiveSort: {
        type: 'string',
        enum: ['default', 'name_asc', 'name_desc', 'affinity'],
      },
      affinityStatus: {
        type: 'string',
        enum: ['ready', 'no_skills', 'unmapped_skills'],
      },
    },
    ['items', 'page', 'pageSize', 'totalItems', 'totalPages', 'effectiveSort'],
  ),
  profile: object({
    id: uuid,
    fullName: text,
    headline: nullable(text),
    aboutMe: nullable(text),
    isAvailable: boolean,
    photoUrl: nullable(text),
    city: nullable(named),
    educations: array(education),
    workExperiences: array(
      object({
        id: uuid,
        position: text,
        startDate: date,
        endDate: nullable(date),
        isCurrent: boolean,
        description: nullable(text),
        company: named,
      }),
    ),
    skills: array(object({ id: uuid, name: text, isCustom: boolean })),
    certifications: array(
      object({
        id: uuid,
        name: text,
        issuingOrganization: text,
        issueDate: date,
        documentUrl: nullable(text),
      }),
    ),
    technicalAreas: array(selection),
    orientationTypes: array(selection),
  }),
  selections: array(selection),
  technicalUpdate: object({
    technicalAreaIds: { ...array(uuid), minItems: 1 },
  }),
  orientationUpdate: object({
    orientationTypeIds: { ...array(uuid), minItems: 1 },
  }),
  participation: object({
    status: { type: 'string', enum: ['ACTIVE', 'DEACTIVATED', 'NEVER'] },
    areas: array(selection),
    orientations: array(selection),
  }),
  suggestions: object({
    suggestions: {
      type: 'array',
      maxItems: 4,
      items: {
        oneOf: [
          suggestion('MISSING_PROFILE_PHOTO', 'photoUrl'),
          suggestion('MISSING_PROFESSIONAL_DESCRIPTION', 'aboutMe'),
          suggestion('MISSING_SPECIALTY', 'mentorTechnicalAreas'),
          suggestion('MISSING_WORK_EXPERIENCE', 'workExperiences'),
        ],
      },
    },
    pendingCount: { type: 'integer', minimum: 0, maximum: 4 },
  }),
  capacity,
  overview: object({ ...capacity.properties, pendingRequests: number }),
  activation: object({ id: uuid }),
  request,
  updatedRequest: historyItem,
  currentRequest: nullable(
    object({
      ...historyItem.properties,
      email: person.email,
      offer: nullable(offer),
    }),
  ),
  history: { oneOf: [array(historyItem), page(historyItem, 'total')] },
  waiting: page(object({ ...person, queuedAt: date })),
  offers: page(
    object({
      ...person,
      status: offer.properties!.status as SchemaObject,
      offeredAt: date,
      expiresAt: date,
      confirmedAt: nullable(date),
    }),
  ),
  confirmation: object({
    id: uuid,
    status: { type: 'string', enum: ['ACTIVE'] },
    alreadyConfirmed: boolean,
  }),
  exit: object({
    id: uuid,
    status: { type: 'string', enum: ['ENDED'] },
    alreadyEnded: boolean,
  }),
} satisfies Record<string, SchemaObject>;

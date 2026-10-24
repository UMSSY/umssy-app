import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';

const RELATIONSHIPS = [
  {
    userKey: 'record-00979',
    keys: ['record-02715', 'record-00151', 'record-01369'],
    values: [
      'Orientación profesional',
      'Orientación técnica',
      'Revisión de CV',
    ],
  },
  {
    userKey: 'record-03051',
    keys: ['record-00806', 'record-01717', 'record-01066'],
    values: ['Orientación técnica', 'Revisión de CV', 'Búsqueda de empleo'],
  },
  {
    userKey: 'record-01197',
    keys: ['record-01334', 'record-01503', 'record-01085'],
    values: [
      'Revisión de CV',
      'Búsqueda de empleo',
      'Preparación para entrevistas',
    ],
  },
  {
    userKey: 'record-02670',
    keys: ['record-03039', 'record-03144', 'record-02693'],
    values: [
      'Búsqueda de empleo',
      'Preparación para entrevistas',
      'Orientación profesional',
    ],
  },
  {
    userKey: 'record-02601',
    keys: ['record-03467', 'record-02313', 'record-02299'],
    values: [
      'Preparación para entrevistas',
      'Orientación profesional',
      'Orientación técnica',
    ],
  },
  {
    userKey: 'record-03450',
    keys: ['record-01357', 'record-00322', 'record-02360'],
    values: [
      'Orientación profesional',
      'Orientación técnica',
      'Revisión de CV',
    ],
  },
  {
    userKey: 'record-03151',
    keys: ['record-01762', 'record-00996', 'record-01115'],
    values: ['Orientación técnica', 'Revisión de CV', 'Búsqueda de empleo'],
  },
  {
    userKey: 'record-03432',
    keys: ['record-02348', 'record-02817', 'record-03066'],
    values: [
      'Revisión de CV',
      'Búsqueda de empleo',
      'Preparación para entrevistas',
    ],
  },
  {
    userKey: 'record-01403',
    keys: ['record-01644', 'record-01176', 'record-01336'],
    values: [
      'Búsqueda de empleo',
      'Preparación para entrevistas',
      'Orientación profesional',
    ],
  },
  {
    userKey: 'record-00241',
    keys: ['record-00260', 'record-03092', 'record-03473'],
    values: [
      'Preparación para entrevistas',
      'Orientación profesional',
      'Orientación técnica',
    ],
  },
  {
    userKey: 'record-00283',
    keys: ['record-02266', 'record-03387', 'record-01495'],
    values: [
      'Orientación profesional',
      'Orientación técnica',
      'Revisión de CV',
    ],
  },
  {
    userKey: 'record-00412',
    keys: ['record-02480', 'record-01084', 'record-00170'],
    values: ['Orientación técnica', 'Revisión de CV', 'Búsqueda de empleo'],
  },
  {
    userKey: 'record-00122',
    keys: ['record-00206', 'record-01565', 'record-01817'],
    values: [
      'Revisión de CV',
      'Búsqueda de empleo',
      'Preparación para entrevistas',
    ],
  },
  {
    userKey: 'record-02093',
    keys: ['record-00306', 'record-02475', 'record-02484'],
    values: [
      'Búsqueda de empleo',
      'Preparación para entrevistas',
      'Orientación profesional',
    ],
  },
  {
    userKey: 'record-01983',
    keys: ['record-01690', 'record-01735', 'record-01822'],
    values: [
      'Preparación para entrevistas',
      'Orientación profesional',
      'Orientación técnica',
    ],
  },
  {
    userKey: 'record-02511',
    keys: ['record-01218', 'record-00054', 'record-03157'],
    values: [
      'Orientación profesional',
      'Orientación técnica',
      'Revisión de CV',
    ],
  },
  {
    userKey: 'record-00524',
    keys: ['record-00514', 'record-00784', 'record-01622'],
    values: ['Orientación técnica', 'Revisión de CV', 'Búsqueda de empleo'],
  },
  {
    userKey: 'record-00404',
    keys: ['record-02932', 'record-00746', 'record-03279'],
    values: [
      'Revisión de CV',
      'Búsqueda de empleo',
      'Preparación para entrevistas',
    ],
  },
  {
    userKey: 'record-01608',
    keys: ['record-02195', 'record-03118', 'record-00960'],
    values: [
      'Búsqueda de empleo',
      'Preparación para entrevistas',
      'Orientación profesional',
    ],
  },
  {
    userKey: 'record-03381',
    keys: ['record-02287', 'record-00501', 'record-00956'],
    values: [
      'Preparación para entrevistas',
      'Orientación profesional',
      'Orientación técnica',
    ],
  },
  {
    userKey: 'record-00334',
    keys: ['record-02019', 'record-02128', 'record-00794'],
    values: [
      'Orientación profesional',
      'Orientación técnica',
      'Revisión de CV',
    ],
  },
  {
    userKey: 'record-00205',
    keys: ['record-03099', 'record-02305', 'record-00777'],
    values: ['Orientación técnica', 'Revisión de CV', 'Búsqueda de empleo'],
  },
];
export async function seedMentorOrientationTypesFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.MentorOrientationTypeCreateManyInput[] =
    RELATIONSHIPS.flatMap((plan) =>
      plan.keys.map((key, index) => ({
        id: context.getId(key),
        mentorId: context.getId(plan.userKey),
        orientationTypeId: context.getReference(
          'orientation_types',
          plan.values[index],
        ),
        createdAt: context.anchor,
        updatedAt: context.anchor,
      })),
    );
  await tx.mentorOrientationType.createMany({ data, skipDuplicates: true });
  return data.length;
}

import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';

const RELATIONSHIPS = [
  {
    userKey: 'record-00979',
    keys: ['record-03335', 'record-02906'],
    values: ['Backend', 'Desarrollo Web'],
  },
  {
    userKey: 'record-03051',
    keys: ['record-01675', 'record-00540'],
    values: ['Desarrollo Web', 'Bases de Datos'],
  },
  {
    userKey: 'record-01197',
    keys: ['record-01386', 'record-02950'],
    values: ['Bases de Datos', 'QA'],
  },
  {
    userKey: 'record-02670',
    keys: ['record-00934', 'record-02429'],
    values: ['QA', 'Datos'],
  },
  {
    userKey: 'record-02601',
    keys: ['record-03208', 'record-02780'],
    values: ['Datos', 'Cloud'],
  },
  {
    userKey: 'record-03450',
    keys: ['record-00300', 'record-03241'],
    values: ['Cloud', 'Redes'],
  },
  {
    userKey: 'record-03151',
    keys: ['record-03407', 'record-03262'],
    values: ['Redes', 'Arquitectura'],
  },
  {
    userKey: 'record-03432',
    keys: ['record-00314', 'record-00446'],
    values: ['Arquitectura', 'Backend'],
  },
  {
    userKey: 'record-01403',
    keys: ['record-01705', 'record-02826'],
    values: ['Backend', 'Desarrollo Web'],
  },
  {
    userKey: 'record-00241',
    keys: ['record-01025', 'record-00480'],
    values: ['Desarrollo Web', 'Bases de Datos'],
  },
  {
    userKey: 'record-00283',
    keys: ['record-01227', 'record-01437'],
    values: ['Bases de Datos', 'QA'],
  },
  {
    userKey: 'record-00412',
    keys: ['record-02356', 'record-02420'],
    values: ['QA', 'Datos'],
  },
  {
    userKey: 'record-00122',
    keys: ['record-02669', 'record-00827'],
    values: ['Datos', 'Cloud'],
  },
  {
    userKey: 'record-02093',
    keys: ['record-01222', 'record-01058'],
    values: ['Cloud', 'Redes'],
  },
  {
    userKey: 'record-01983',
    keys: ['record-02981', 'record-01054'],
    values: ['Redes', 'Arquitectura'],
  },
  {
    userKey: 'record-02511',
    keys: ['record-03469', 'record-01203'],
    values: ['Arquitectura', 'Backend'],
  },
  {
    userKey: 'record-00524',
    keys: ['record-00618', 'record-01759'],
    values: ['Backend', 'Desarrollo Web'],
  },
  {
    userKey: 'record-00404',
    keys: ['record-03474', 'record-02662'],
    values: ['Desarrollo Web', 'Bases de Datos'],
  },
  {
    userKey: 'record-01608',
    keys: ['record-01189', 'record-00365'],
    values: ['Bases de Datos', 'QA'],
  },
  {
    userKey: 'record-03381',
    keys: ['record-03243', 'record-00637'],
    values: ['QA', 'Datos'],
  },
  {
    userKey: 'record-00334',
    keys: ['record-00129', 'record-02668'],
    values: ['Datos', 'Cloud'],
  },
  {
    userKey: 'record-00205',
    keys: ['record-01885', 'record-00873'],
    values: ['Cloud', 'Redes'],
  },
];
export async function seedMentorTechnicalAreasFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.MentorTechnicalAreaCreateManyInput[] =
    RELATIONSHIPS.flatMap((plan) =>
      plan.keys.map((key, index) => ({
        id: context.getId(key),
        mentorId: context.getId(plan.userKey),
        technicalAreaId: context.getReference(
          'technical_areas',
          plan.values[index],
        ),
        createdAt: context.anchor,
        updatedAt: context.anchor,
      })),
    );
  await tx.mentorTechnicalArea.createMany({ data, skipDuplicates: true });
  return data.length;
}

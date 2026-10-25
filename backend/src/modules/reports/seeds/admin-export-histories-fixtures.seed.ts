import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';

export async function seedAdminExportHistoriesFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.AdminExportHistoryCreateManyInput[] = [
    {
      id: context.getId('record-02333'),
      userId: context.adminId,
      createdAt: context.getDate('anchor', -1440, false),
      reportName: 'SEED_REGISTERED_USERS_01.csv',
      reportType: 'REGISTERED_USERS',
    },
    {
      id: context.getId('record-02796'),
      userId: context.adminId,
      createdAt: context.getDate('anchor', -2880, false),
      reportName: 'SEED_STUDENTS_02.csv',
      reportType: 'STUDENTS',
    },
    {
      id: context.getId('record-00679'),
      userId: context.adminId,
      createdAt: context.getDate('anchor', -4320, false),
      reportName: 'SEED_DEGREE_HOLDERS_03.csv',
      reportType: 'DEGREE_HOLDERS',
    },
    {
      id: context.getId('record-01686'),
      userId: context.adminId,
      createdAt: context.getDate('anchor', -5760, false),
      reportName: 'SEED_MENTORS_04.csv',
      reportType: 'MENTORS',
    },
    {
      id: context.getId('record-03342'),
      userId: context.adminId,
      createdAt: context.getDate('anchor', -7200, false),
      reportName: 'SEED_COMPANIES_05.csv',
      reportType: 'COMPANIES',
    },
    {
      id: context.getId('record-00402'),
      userId: context.adminId,
      createdAt: context.getDate('anchor', -8640, false),
      reportName: 'SEED_REJECTED_USERS_06.csv',
      reportType: 'REJECTED_USERS',
    },
    {
      id: context.getId('record-01140'),
      userId: context.adminId,
      createdAt: context.getDate('anchor', -10080, false),
      reportName: 'SEED_REGISTERED_USERS_07.csv',
      reportType: 'REGISTERED_USERS',
    },
    {
      id: context.getId('record-00790'),
      userId: context.adminId,
      createdAt: context.getDate('anchor', -11520, false),
      reportName: 'SEED_STUDENTS_08.csv',
      reportType: 'STUDENTS',
    },
    {
      id: context.getId('record-01346'),
      userId: context.adminId,
      createdAt: context.getDate('anchor', -12960, false),
      reportName: 'SEED_DEGREE_HOLDERS_09.csv',
      reportType: 'DEGREE_HOLDERS',
    },
    {
      id: context.getId('record-00585'),
      userId: context.adminId,
      createdAt: context.getDate('anchor', -14400, false),
      reportName: 'SEED_MENTORS_10.csv',
      reportType: 'MENTORS',
    },
    {
      id: context.getId('record-01327'),
      userId: context.adminId,
      createdAt: context.getDate('anchor', -15840, false),
      reportName: 'SEED_COMPANIES_11.csv',
      reportType: 'COMPANIES',
    },
    {
      id: context.getId('record-01337'),
      userId: context.adminId,
      createdAt: context.getDate('anchor', -17280, false),
      reportName: 'SEED_REJECTED_USERS_12.csv',
      reportType: 'REJECTED_USERS',
    },
    {
      id: context.getId('record-00071'),
      userId: context.adminId,
      createdAt: context.getDate('anchor', -18720, false),
      reportName: 'SEED_REGISTERED_USERS_13.csv',
      reportType: 'REGISTERED_USERS',
    },
    {
      id: context.getId('record-01270'),
      userId: context.adminId,
      createdAt: context.getDate('anchor', -20160, false),
      reportName: 'SEED_STUDENTS_14.csv',
      reportType: 'STUDENTS',
    },
    {
      id: context.getId('record-03479'),
      userId: context.adminId,
      createdAt: context.getDate('anchor', -21600, false),
      reportName: 'SEED_DEGREE_HOLDERS_15.csv',
      reportType: 'DEGREE_HOLDERS',
    },
    {
      id: context.getId('record-00677'),
      userId: context.adminId,
      createdAt: context.getDate('anchor', -23040, false),
      reportName: 'SEED_MENTORS_16.csv',
      reportType: 'MENTORS',
    },
    {
      id: context.getId('record-01499'),
      userId: context.adminId,
      createdAt: context.getDate('anchor', -24480, false),
      reportName: 'SEED_COMPANIES_17.csv',
      reportType: 'COMPANIES',
    },
    {
      id: context.getId('record-03081'),
      userId: context.adminId,
      createdAt: context.getDate('anchor', -25920, false),
      reportName: 'SEED_REJECTED_USERS_18.csv',
      reportType: 'REJECTED_USERS',
    },
  ];
  await tx.adminExportHistory.createMany({ data, skipDuplicates: true });
  return data.length;
}

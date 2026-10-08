import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { GeneratedReportsRepository } from '../repositories/generated-reports.repository.js';
import type { GeneratedReport } from '../types/generated-report.types.js';

const USER_ID = '6f1c2b8e-1f4a-4c3e-9d2a-1b2c3d4e5f60';

interface StoredRecord {
  userId: string;
  createdAt: Date;
  reportName: string;
  reportType: string;
}

function buildRecord(overrides: Partial<StoredRecord> = {}): StoredRecord {
  return {
    userId: USER_ID,
    createdAt: new Date('2026-10-05T11:50:04.560Z'),
    reportName: 'usuarios-registrados-todos.csv',
    reportType: 'REGISTERED_USERS',
    ...overrides,
  };
}

function buildReport(
  overrides: Partial<GeneratedReport> = {},
): GeneratedReport {
  return {
    id: 'nuevo',
    fileName: 'usuarios-rechazados-2026-10-08.csv',
    reportType: 'REJECTED_USERS',
    generatedAt: '2026-10-08T03:59:39.727Z',
    ...overrides,
  };
}

function buildPrisma(records: StoredRecord[] = []) {
  const prisma = {
    adminExportHistory: {
      findMany: vi.fn().mockResolvedValue(records),
      upsert: vi.fn().mockResolvedValue(undefined),
    },
    user: {
      findFirst: vi.fn().mockResolvedValue({ id: USER_ID }),
    },
  };

  return {
    prisma,
    repository: new GeneratedReportsRepository(
      prisma as unknown as PrismaService,
    ),
  };
}

describe('GeneratedReportsRepository', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('sin BD', () => {
    it('guarda y devuelve los reportes en memoria', async () => {
      const repository = new GeneratedReportsRepository();
      const report = buildReport();

      repository.create(report);

      expect(await repository.findAll()).toEqual([report]);
    });
  });

  describe('findAll', () => {
    it('espera la lectura de la BD y devuelve sus reportes desde la primera consulta', async () => {
      const { repository } = buildPrisma([buildRecord()]);

      expect(await repository.findAll()).toEqual([
        {
          id: `${USER_ID}_${new Date('2026-10-05T11:50:04.560Z').getTime()}`,
          fileName: 'usuarios-registrados-todos.csv',
          reportType: 'REGISTERED_USERS',
          generatedAt: '2026-10-05T11:50:04.560Z',
        },
      ]);
    });

    it('muestra en la siguiente consulta los reportes que otra instancia guardó en la BD', async () => {
      const { prisma, repository } = buildPrisma([]);
      await repository.findAll();

      prisma.adminExportHistory.findMany.mockResolvedValue([buildRecord()]);

      expect(await repository.findAll()).toHaveLength(1);
    });

    it('conserva la última lectura correcta si la BD falla', async () => {
      const { prisma, repository } = buildPrisma([buildRecord()]);
      await repository.findAll();

      prisma.adminExportHistory.findMany.mockRejectedValue(
        new Error('TableDoesNotExist'),
      );

      expect(await repository.findAll()).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('guarda el reporte en la BD a nombre del primer usuario', async () => {
      const { prisma, repository } = buildPrisma();
      const report = buildReport();

      repository.create(report);

      await vi.waitFor(() =>
        expect(prisma.adminExportHistory.upsert).toHaveBeenCalledWith({
          where: {
            userId_createdAt: {
              userId: USER_ID,
              createdAt: new Date(report.generatedAt),
            },
          },
          update: {
            reportName: report.fileName,
            reportType: report.reportType,
          },
          create: {
            userId: USER_ID,
            reportName: report.fileName,
            reportType: report.reportType,
            createdAt: new Date(report.generatedAt),
          },
        }),
      );
    });

    it('muestra el reporte recién creado aunque la BD todavía no lo tenga', async () => {
      const { repository } = buildPrisma([buildRecord()]);
      const report = buildReport();

      repository.create(report);

      expect(await repository.findAll()).toEqual([
        report,
        expect.objectContaining({ fileName: 'usuarios-registrados-todos.csv' }),
      ]);
    });

    it('no pierde el reporte con el paso del tiempo si no se pudo guardar en la BD', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2026-10-08T03:59:40.000Z'));
      const { prisma, repository } = buildPrisma();
      prisma.adminExportHistory.upsert.mockRejectedValue(
        new Error('TableDoesNotExist'),
      );
      const report = buildReport();

      repository.create(report);
      vi.setSystemTime(new Date('2026-10-08T04:10:00.000Z'));

      // Cada consulta sincroniza con la BD: el reporte debe seguir tras varias.
      await repository.findAll();
      expect(await repository.findAll()).toEqual([report]);
    });

    it('no duplica el reporte cuando ya aparece en la BD', async () => {
      const report = buildReport();
      const { prisma, repository } = buildPrisma();

      repository.create(report);
      prisma.adminExportHistory.findMany.mockResolvedValue([
        buildRecord({
          createdAt: new Date(report.generatedAt),
          reportName: report.fileName,
          reportType: report.reportType,
        }),
      ]);

      const reports = await repository.findAll();

      expect(reports).toHaveLength(1);
      expect(reports[0]).toMatchObject({
        fileName: report.fileName,
        generatedAt: report.generatedAt,
      });
    });

    it('no guarda en la BD si no hay usuarios, pero mantiene el reporte en el historial', async () => {
      const { prisma, repository } = buildPrisma();
      prisma.user.findFirst.mockResolvedValue(null);
      const report = buildReport();

      repository.create(report);

      await vi.waitFor(() => expect(prisma.user.findFirst).toHaveBeenCalled());
      expect(prisma.adminExportHistory.upsert).not.toHaveBeenCalled();
      expect(await repository.findAll()).toEqual([report]);
    });
  });
});

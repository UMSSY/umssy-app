import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import {
  REPORT_TYPES,
  type GeneratedReport,
  type ReportType,
} from '../types/generated-report.types.js';

// Un mismo reporte se identifica por su nombre y su fecha de generación,
// tanto en memoria como en la BD.
function getReportKey(report: GeneratedReport): string {
  return `${report.fileName}_${report.generatedAt}`;
}

function isReportType(value: string): value is ReportType {
  return (REPORT_TYPES as readonly string[]).includes(value);
}

@Injectable()
export class GeneratedReportsRepository {
  private readonly logger = new Logger(GeneratedReportsRepository.name);
  // Reportes registrados en este proceso que todavía no aparecen en la BD.
  private pendingReports: GeneratedReport[] = [];
  // Última lectura correcta de la BD.
  private storedReports: GeneratedReport[] = [];

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  async findAll(): Promise<readonly GeneratedReport[]> {
    await this.loadStoredReports();

    // Un reporte pendiente deja de serlo cuando ya aparece en la BD, así no se muestra dos veces.
    const storedKeys = new Set(this.storedReports.map(getReportKey));
    this.pendingReports = this.pendingReports.filter(
      (report) => !storedKeys.has(getReportKey(report)),
    );

    return [...this.pendingReports, ...this.storedReports];
  }

  create(report: GeneratedReport): GeneratedReport {
    this.pendingReports.unshift(report);
    void this.persist(report);

    return report;
  }

  private async loadStoredReports(): Promise<void> {
    if (!this.prisma) {
      return;
    }

    try {
      const records = await this.prisma.adminExportHistory.findMany({
        orderBy: { createdAt: 'desc' },
      });

      // Solo se muestran reportes que la plataforma sabe generar (CA 25):
      // un registro con un tipo desconocido no corresponde a ninguna exportación.
      this.storedReports = records.flatMap(
        ({ userId, createdAt, reportName, reportType }) =>
          isReportType(reportType)
            ? [
                {
                  id: `${userId}_${createdAt.getTime()}`,
                  fileName: reportName,
                  reportType,
                  generatedAt: createdAt.toISOString(),
                },
              ]
            : [],
      );
    } catch (error) {
      // Se conserva la última lectura correcta para no vaciar el historial.
      this.logger.error('Error al leer el historial de reportes', error);
    }
  }

  // Si la escritura falla, el reporte sigue pendiente y se muestra desde memoria.
  private async persist(report: GeneratedReport): Promise<void> {
    if (!this.prisma) {
      return;
    }

    try {
      // TODO: registrar al administrador autenticado en vez del primer usuario de la BD.
      const user = await this.prisma.user.findFirst();

      if (!user) {
        this.logger.warn(
          'No hay usuarios en la BD: el reporte generado no se guardó',
        );
        return;
      }

      const createdAt = new Date(report.generatedAt);

      await this.prisma.adminExportHistory.upsert({
        where: { userId_createdAt: { userId: user.id, createdAt } },
        update: { reportName: report.fileName, reportType: report.reportType },
        create: {
          userId: user.id,
          reportName: report.fileName,
          reportType: report.reportType,
          createdAt,
        },
      });
    } catch (error) {
      this.logger.error('Error al guardar el reporte generado', error);
    }
  }
}

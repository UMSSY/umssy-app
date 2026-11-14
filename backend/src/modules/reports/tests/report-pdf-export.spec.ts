import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { ReportAuthorNotFoundException } from '../exceptions/report-author-not-found.exception.js';
import { toReportUserPdfRow } from '../mappers/report-user-csv.mapper.js';
import { ReportUsersRepository } from '../repositories/report-users.repository.js';
import { ReportPdfService } from '../services/report-pdf.service.js';
import { ReportsService } from '../services/reports.service.js';
import type { ReportUser } from '../types/report-user.types.js';
import { buildReportPdfFilters, getAcademicPeriodStartDate } from '../utils/report-pdf-filters.util.js';

const USER: ReportUser = {
  id: 'u1',
  fullName: 'Ana Pérez',
  email: 'ana@umssy.test',
  userType: 'titulado',
  identifier: 'ID-1',
  documentType: 'academic_diploma',
  registeredAt: '2026-03-01T14:00:00.000Z',
  listedAt: '2026-03-01T14:00:00.000Z',
  registrationStatus: 'APPROVED',
  rejectionReason: null,
};

function buildService(author: { firstName: string; lastName: string } | null) {
  const repository = new ReportUsersRepository({} as PrismaService);
  vi.spyOn(repository, 'findAll').mockResolvedValue([USER, { ...USER, id: 'u2', registrationStatus: 'REJECTED' }]);
  vi.spyOn(repository, 'findAuthor').mockResolvedValue(author);
  const pdfService = new ReportPdfService();
  const render = vi.spyOn(pdfService, 'render');
  return { service: new ReportsService(repository, pdfService), render };
}

describe('exportación PDF de reportes', () => {
  it('genera el PDF de aceptados con autor, filtros, filas y nombre .pdf', async () => {
    const { service, render } = buildService({ firstName: 'Admin', lastName: 'Uno' });
    const file = await service.exportRegisteredUsersPdf({ userType: 'titulado', search: 'ana' }, 'admin-1');

    expect(file.fileName).toMatch(/^usuarios-registrados-.*\.pdf$/);
    expect(file.content.toString('latin1').startsWith('%PDF-1.4')).toBe(true);
    expect(render).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Reporte de usuarios aceptados',
        generatedBy: 'Admin Uno (Administrativo)',
        rows: [['Ana Pérez', 'ana@umssy.test', 'Titulado', 'Diploma académico', '01/03/2026']],
        filters: [
          { label: 'Tipo de usuario', value: 'Titulado' },
          { label: 'Aprobados desde', value: 'Todas las fechas' },
          { label: 'Búsqueda', value: '"ana"' },
        ],
      }),
    );
  });

  it('genera el PDF de rechazados con su propia definición', async () => {
    const { service, render } = buildService({ firstName: 'Admin', lastName: 'Uno' });
    const file = await service.exportRejectedUsersPdf({}, 'admin-1');

    expect(file.fileName).toMatch(/^usuarios-rechazados-.*\.pdf$/);
    expect(render).toHaveBeenCalledWith(expect.objectContaining({ title: 'Reporte de usuarios rechazados', dateColumnLabel: 'Fecha de rechazo' }));
  });

  it('rechaza la exportación si el administrador no tiene nombre registrado', async () => {
    const { service } = buildService({ firstName: ' ', lastName: '' });
    await expect(service.exportRegisteredUsersPdf({}, 'admin-1')).rejects.toBeInstanceOf(ReportAuthorNotFoundException);

    const missing = buildService(null);
    await expect(missing.service.exportRejectedUsersPdf({}, 'admin-1')).rejects.toBeInstanceOf(ReportAuthorNotFoundException);
  });
});

describe('filtros del PDF', () => {
  it('convierte la gestión en la fecha de inicio del semestre', () => {
    expect(getAcademicPeriodStartDate('I-2025')).toBe('01/01/2025');
    expect(getAcademicPeriodStartDate('II-2025')).toBe('01/07/2025');
  });

  it('usa valores por defecto cuando no hay filtros', () => {
    expect(buildReportPdfFilters('Rechazados desde', { period: 'II-2026' })).toEqual([
      { label: 'Tipo de usuario', value: 'Todos' },
      { label: 'Rechazados desde', value: '01/07/2026' },
      { label: 'Búsqueda', value: 'ninguna' },
    ]);
  });

  it('arma la fila del PDF con guion cuando falta el documento', () => {
    expect(
      toReportUserPdfRow({ ...USER, documentType: null }),
    ).toEqual(['Ana Pérez', 'ana@umssy.test', 'Titulado', '-', '01/03/2026']);
  });
});

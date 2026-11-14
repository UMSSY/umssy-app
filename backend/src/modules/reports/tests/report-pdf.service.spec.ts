import { REGISTERED_USERS_PDF } from '../constants/report-pdf.constants.js';
import { ReportPdfService, formatReportDateTime } from '../services/report-pdf.service.js';
import type { ReportPdfContent } from '../types/report-pdf.types.js';

const GENERATED_AT = new Date('2026-11-13T18:30:00.000Z');

function content(rows: string[][]): ReportPdfContent {
  return {
    ...REGISTERED_USERS_PDF,
    generatedBy: 'Ana Perez (Administrativo)',
    generatedAt: GENERATED_AT,
    filters: [{ label: 'Tipo de usuario', value: 'Todos' }],
    rows,
  };
}

const row = (index: number) => [`Usuario ${index}`, `usuario${index}@umssy.test`, 'Titulado', 'Diploma', '01/01/2026'];
const pageCount = (pdf: Buffer) => Number(/\/Count (\d+)/.exec(pdf.toString('latin1'))?.[1]);

describe('ReportPdfService', () => {
  const service = new ReportPdfService();

  it('genera un PDF válido con el encabezado institucional, los metadatos y las filas', () => {
    const pdf = service.render(content([row(1)]));
    const text = pdf.toString('latin1');

    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(text).toContain('(UMSSY)');
    expect(text).toContain('(Reporte de usuarios aceptados)');
    expect(text).toContain('(Ana Perez \\(Administrativo\\))');
    expect(text).toContain('(usuario1@umssy.test)');
    expect(text).toContain('(1 usuario)');
    expect(pageCount(pdf)).toBe(1);
  });

  it('pagina la tabla y numera todas las páginas', () => {
    const pdf = service.render(content(Array.from({ length: 60 }, (_, index) => row(index))));
    const text = pdf.toString('latin1');
    const total = pageCount(pdf);

    expect(total).toBeGreaterThan(1);
    expect(text).toContain(`(P\\341gina 1 de ${total})`);
    expect(text).toContain(`(P\\341gina ${total} de ${total})`);
    expect(text).toContain('(60 usuarios)');
  });

  it('muestra un aviso cuando no hay registros', () => {
    const text = service.render(content([])).toString('latin1');
    expect(text).toContain('(No hay resultados disponibles para exportar.)');
  });

  it('formatea la fecha de generación en hora de Bolivia', () => {
    expect(formatReportDateTime(GENERATED_AT)).toBe('13/11/2026 14:30');
  });
});

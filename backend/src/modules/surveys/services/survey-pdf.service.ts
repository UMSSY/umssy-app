import { Injectable } from '@nestjs/common';
import {
  SURVEY_PDF_COLORS as COLORS,
  SURVEY_PDF_LAYOUT,
} from '../constants/survey-pdf.constants.js';
import { SURVEY_DISPLAY_STATUS_LABELS } from '../constants/survey.constants.js';
import type { SurveyStatisticsResponse } from '../responses/survey-statistics.response.js';
import { SimplePdfDocument } from '../utils/simple-pdf-document.js';

@Injectable()
export class SurveyPdfService {
  async generatePdf(statistics: SurveyStatisticsResponse): Promise<Buffer> {
    const doc = new SimplePdfDocument();

    const { printWidth, leftX, pageBottomLimit } = SURVEY_PDF_LAYOUT;

    doc.rect(leftX, 26, printWidth, 3, COLORS.navy);
    doc.rect(leftX, 29, printWidth * 0.25, 1.5, COLORS.crimson);

    doc.text('UNIVERSIDAD MAYOR DE SAN SIMÓN', leftX, 36, {
      fontSize: 10,
      font: 'Helvetica-Bold',
      color: COLORS.navy,
    });
    doc.text('DIRECCIÓN DE PLANIFICACIÓN ACADÉMICA', leftX, 48, {
      fontSize: 7,
      font: 'Helvetica',
      color: COLORS.inkMuted,
    });

    const refCode = `INF-UMSSY-${statistics.id.slice(0, 8).toUpperCase()}`;
    const issueDate = new Date().toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.text(refCode, 380, 36, {
      fontSize: 7,
      font: 'Helvetica-Bold',
      color: COLORS.navy,
      align: 'right',
      width: 179,
    });
    doc.text(`Emisión: ${issueDate}`, 380, 48, {
      fontSize: 6.5,
      font: 'Helvetica',
      color: COLORS.inkMuted,
      align: 'right',
      width: 179,
    });

    let curY = 62;
    doc.rect(leftX, curY, printWidth, 0.5, undefined, COLORS.border);
    curY += 8;

    doc.text('INFORME ESTADÍSTICO DE RESULTADOS', leftX, curY, {
      fontSize: 11,
      font: 'Helvetica-Bold',
      color: COLORS.navy,
    });
    curY += 15;

    const careerLabel = statistics.career?.title ?? 'Todas las carreras';
    const periodLabel = statistics.academicPeriod ?? 'General';
    const statusLabel = SURVEY_DISPLAY_STATUS_LABELS[statistics.status];
    const opensStr = statistics.opensAt ? new Date(statistics.opensAt).toLocaleDateString('es-BO') : 'N/D';
    const closesStr = statistics.closesAt ? new Date(statistics.closesAt).toLocaleDateString('es-BO') : 'N/D';

    const titleLines = doc.wrapText(statistics.title, printWidth - 20, 9, true);
    const titleHeight = titleLines.length * 11;
    const fichaH = Math.max(50, titleHeight + 36);

    doc.rect(leftX, curY, printWidth, fichaH, COLORS.cardBackground, COLORS.border, 0.5);

    let tY = curY + 7;
    for (const tLine of titleLines) {
      doc.text(tLine, leftX + 10, tY, {
        fontSize: 9,
        font: 'Helvetica-Bold',
        color: COLORS.inkDark,
      });
      tY += 11;
    }

    const metaY = curY + titleHeight + 11;
    doc.text(
      `Carrera: ${careerLabel}   |   Gestión: ${periodLabel}   |   Vigencia: ${opensStr} - ${closesStr}   |   Estado: ${statusLabel}`,
      leftX + 10,
      metaY,
      {
        fontSize: 7,
        font: 'Helvetica',
        color: COLORS.inkMuted,
      },
    );

    const statsRowY = metaY + 11;
    doc.text(
      `Muestra Total: ${statistics.totalResponses} respuestas registradas   |   Preguntas Formuladas: ${statistics.questions.length} preguntas analizadas`,
      leftX + 10,
      statsRowY,
      {
        fontSize: 7,
        font: 'Helvetica-Bold',
        color: COLORS.crimson,
      },
    );

    curY += fichaH + 12;

    doc.text('Resultados Detallados y Gráficos de Comparación', leftX, curY, {
      fontSize: 9.5,
      font: 'Helvetica-Bold',
      color: COLORS.navy,
    });
    curY += 14;

    statistics.questions.forEach((q, idx) => {
      const maxCount = Math.max(...q.options.map((o) => o.count), 0);
      const stmtWidth = 370;
      const stmtLines = doc.wrapText(`${idx + 1}. ${q.statement}`, stmtWidth, 8, true);
      const stmtHeight = stmtLines.length * 11;
      const headerH = Math.max(22, stmtHeight + 8);

      const optLabelWidth = 230;
      const optionRowHeights = q.options.map((opt) => {
        const lines = doc.wrapText(opt.label, optLabelWidth, 7.5, false);
        return Math.max(20, lines.length * 10 + 6);
      });
      const optionsTotalH = optionRowHeights.reduce((acc, h) => acc + h, 0) + 8;
      const cardTotalH = headerH + optionsTotalH;

      if (curY + cardTotalH > pageBottomLimit) {
        doc.addPage();
        curY = 36;
      }

      const cardY = curY;
      doc.rect(leftX, cardY, printWidth, cardTotalH, COLORS.cardSurface, COLORS.border, 0.5);

      doc.rect(leftX, cardY, printWidth, headerH, COLORS.cardBackground);
      doc.rect(leftX, cardY + headerH, printWidth, 0.5, undefined, COLORS.border);

      let stmtY = cardY + 6;
      for (const line of stmtLines) {
        doc.text(line, leftX + 10, stmtY, {
          fontSize: 8,
          font: 'Helvetica-Bold',
          color: COLORS.inkDark,
        });
        stmtY += 11;
      }

      const isSingleChoice = q.type?.toLowerCase() === 'single_choice';
      const typeLabel = isSingleChoice ? 'Opción única' : 'Opción múltiple';
      doc.text(`[${typeLabel}] · ${q.answeredCount} respuestas`, leftX + stmtWidth + 10, cardY + 7, {
        fontSize: 6.5,
        font: 'Helvetica',
        color: COLORS.inkMuted,
        align: 'right',
        width: printWidth - stmtWidth - 20,
      });

      let optY = cardY + headerH + 5;
      q.options.forEach((opt, optIndex) => {
        const rowH = optionRowHeights[optIndex];
        const isTop = opt.count === maxCount && opt.count > 0;
        const barMaxWidth = 160;
        const barWidth = Math.max(2, (opt.percentage / 100) * barMaxWidth);

        if (isTop) {
          doc.rect(leftX + 4, optY - 1, printWidth - 8, rowH, COLORS.leadBackground);
        }

        const lines = doc.wrapText(opt.label, optLabelWidth, 7.5, isTop);
        const labelH = lines.length * 10;
        const labelY = optY + (rowH - labelH) / 2;

        const numY = optY + (rowH - 8) / 2;
        doc.text(`${optIndex + 1}`, leftX + 10, numY, {
          fontSize: 7,
          font: 'Helvetica-Bold',
          color: isTop ? COLORS.leadBar : COLORS.inkMuted,
        });

        let lineY = labelY;
        for (const line of lines) {
          doc.text(line, leftX + 24, lineY, {
            fontSize: 7.5,
            font: isTop ? 'Helvetica-Bold' : 'Helvetica',
            color: isTop ? COLORS.navy : COLORS.inkBody,
          });
          lineY += 10;
        }

        const barX = leftX + 260;
        const barH = 6.5;
        const barY = optY + (rowH - barH) / 2;

        doc.rect(barX, barY, barMaxWidth, barH, COLORS.track);
        if (barWidth > 0 && opt.count > 0) {
          doc.rect(barX, barY, barWidth, barH, isTop ? COLORS.leadBar : COLORS.comparisonBar);
        }

        const statsY = optY + (rowH - 8) / 2;
        doc.text(`${opt.count} v.`, leftX + 426, statsY, {
          fontSize: 7,
          font: isTop ? 'Helvetica-Bold' : 'Helvetica',
          color: isTop ? COLORS.navy : COLORS.inkBody,
          align: 'right',
          width: 35,
        });

        doc.text(`${opt.percentage.toFixed(1)}%`, leftX + 465, statsY - 0.5, {
          fontSize: 7.5,
          font: 'Helvetica-Bold',
          color: isTop ? COLORS.leadBar : COLORS.inkDark,
          align: 'right',
          width: 48,
        });

        optY += rowH;
      });

      curY += cardTotalH + 9;
    });

    const totalPages = doc.pageCount;
    for (let p = 0; p < totalPages; p++) {
      doc.setPage(p);

      if (p > 0) {
        doc.rect(leftX, 18, printWidth, 0.5, undefined, COLORS.border);
        doc.text('UNIVERSIDAD MAYOR DE SAN SIMÓN · SISTEMA UMSSY', leftX, 11, {
          fontSize: 6,
          font: 'Helvetica',
          color: COLORS.inkMuted,
        });
        doc.text(`INFORME ESTADÍSTICO · ${refCode}`, leftX + printWidth * 0.5, 11, {
          fontSize: 6,
          font: 'Helvetica-Bold',
          color: COLORS.navy,
          align: 'right',
          width: printWidth * 0.5,
        });
      }

      doc.rect(leftX, 808, printWidth, 0.5, undefined, COLORS.border);
      doc.text(
        'Universidad Mayor de San Simón · Sistema UMSSY · Informe Oficial de Encuesta',
        leftX,
        813,
        {
          fontSize: 6.5,
          font: 'Helvetica',
          color: COLORS.inkMuted,
        },
      );
      doc.text(`Página ${p + 1} de ${totalPages}`, leftX + 350, 813, {
        fontSize: 6.5,
        font: 'Helvetica-Bold',
        color: COLORS.navy,
        align: 'right',
        width: printWidth - 350,
      });
    }

    return doc.build();
  }
}

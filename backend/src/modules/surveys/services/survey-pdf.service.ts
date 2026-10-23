import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { SurveyStatisticsResponse } from '../responses/survey-statistics.response.js';

@Injectable()
export class SurveyPdfService {
  async generatePdf(statistics: SurveyStatisticsResponse): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 36,
          bufferPages: true,
          info: {
            Title: `Informe Estadístico - ${statistics.title}`,
            Author: 'Universidad Mayor de San Simón - UMSSY',
            Subject: 'Resultados Oficiales de Encuesta',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));

        // Paleta de colores ejecutiva sobria
        const cNavy = '#0F2D59';
        const cCrimson = '#A31D1D';
        const cInkDark = '#1E293B';
        const cInkBody = '#334155';
        const cInkMuted = '#64748B';
        const cCardBg = '#F8FAFC';
        const cBorder = '#E2E8F0';
        const cTrack = '#EEF2F6';
        const cLeadBar = '#1D4ED8';   // Opción mayoritaria / líder
        const cCompBar = '#94A3B8';   // Barras comparativas
        const cLeadBg = '#EFF6FF';

        const printWidth = 523;
        const leftX = 36;
        const pageBottomLimit = 715;

        // --- ENCABEZADO INSTITUCIONAL ---
        doc.rect(leftX, 26, printWidth, 3).fill(cNavy);
        doc.rect(leftX, 29, printWidth * 0.25, 1.5).fill(cCrimson);

        doc.fontSize(10).font('Helvetica-Bold').fillColor(cNavy).text('UNIVERSIDAD MAYOR DE SAN SIMÓN', leftX, 36);
        doc.fontSize(7).font('Helvetica').fillColor(cInkMuted).text('DIRECCIÓN DE PLANIFICACIÓN ACADÉMICA', leftX, 48);

        const refCode = `INF-UMSSY-${statistics.id.slice(0, 8).toUpperCase()}`;
        const issueDate = new Date().toLocaleDateString('es-BO', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        doc.fontSize(7).font('Helvetica-Bold').fillColor(cNavy).text(refCode, 380, 36, { width: 179, align: 'right' });
        doc.fontSize(6.5).font('Helvetica').fillColor(cInkMuted).text(`Emisión: ${issueDate}`, 380, 48, { width: 179, align: 'right' });

        let curY = 62;
        doc.rect(leftX, curY, printWidth, 0.5).fill(cBorder);
        curY += 8;

        // Título del informe
        doc.fontSize(11).font('Helvetica-Bold').fillColor(cNavy).text('INFORME ESTADÍSTICO DE RESULTADOS', leftX, curY);
        curY += 15;

        // Ficha técnica compacta de la encuesta
        const careerLabel = statistics.career?.title ?? 'Todas las carreras';
        const periodLabel = statistics.academicPeriod ?? 'General';
        const statusLabel = statistics.status === 'published' ? 'Publicada' : 'Borrador';
        const opensStr = statistics.opensAt ? new Date(statistics.opensAt).toLocaleDateString('es-BO') : 'N/D';
        const closesStr = statistics.closesAt ? new Date(statistics.closesAt).toLocaleDateString('es-BO') : 'N/D';

        doc.font('Helvetica-Bold').fontSize(9);
        const titleHeight = doc.heightOfString(statistics.title, { width: printWidth - 20 });
        const fichaH = Math.max(48, titleHeight + 36);

        doc.roundedRect(leftX, curY, printWidth, fichaH, 3).fillAndStroke(cCardBg, cBorder);
        doc.fontSize(9).font('Helvetica-Bold').fillColor(cInkDark).text(statistics.title, leftX + 10, curY + 7, { width: printWidth - 20 });

        // Metadatos en una línea limpia
        const metaY = curY + titleHeight + 11;
        doc.fontSize(7).font('Helvetica').fillColor(cInkMuted);
        doc.text('Carrera: ', leftX + 10, metaY, { continued: true })
          .font('Helvetica-Bold').fillColor(cInkDark).text(careerLabel, { continued: true })
          .font('Helvetica').fillColor(cInkMuted).text('   |   Gestión: ', { continued: true })
          .font('Helvetica-Bold').fillColor(cInkDark).text(periodLabel, { continued: true })
          .font('Helvetica').fillColor(cInkMuted).text('   |   Vigencia: ', { continued: true })
          .font('Helvetica-Bold').fillColor(cInkDark).text(`${opensStr} - ${closesStr}`, { continued: true })
          .font('Helvetica').fillColor(cInkMuted).text('   |   Estado: ', { continued: true })
          .font('Helvetica-Bold').fillColor(cNavy).text(statusLabel);

        const statsRowY = metaY + 11;
        doc.fontSize(7).font('Helvetica').fillColor(cInkMuted);
        doc.text('Muestra Total: ', leftX + 10, statsRowY, { continued: true })
          .font('Helvetica-Bold').fillColor(cCrimson).text(`${statistics.totalResponses} respuestas registradas`, { continued: true })
          .font('Helvetica').fillColor(cInkMuted).text('   |   Preguntas Formuladas: ', { continued: true })
          .font('Helvetica-Bold').fillColor(cNavy).text(`${statistics.questions.length} preguntas analizadas`);

        curY += fichaH + 12;

        // --- SUBTÍTULO DE RESULTADOS Y COMPARATIVAS ---
        doc.fontSize(9.5).font('Helvetica-Bold').fillColor(cNavy).text('Resultados Detallados y Gráficos de Comparación', leftX, curY);
        curY += 13;

        // --- LISTADO DE PREGUNTAS CON GRÁFICOS COMPARATIVOS ---
        statistics.questions.forEach((q, idx) => {
          // Determinar el valor máximo para resaltar la opción predominante
          const maxCount = Math.max(...q.options.map((o) => o.count), 0);
          const topOption = q.options.find((o) => o.count === maxCount && o.count > 0);

          // Cálculo dinámico de altura para el enunciado
          doc.font('Helvetica-Bold').fontSize(8);
          const stmtWidth = 370;
          const stmtHeight = doc.heightOfString(`${idx + 1}. ${q.statement}`, { width: stmtWidth });
          const headerH = Math.max(22, stmtHeight + 10);

          // Cálculo de altura para cada opción (para permitir que textos largos fluyan sin solaparse)
          doc.font('Helvetica').fontSize(7.5);
          const optLabelWidth = 230;
          const optionHeights = q.options.map((opt) => {
            const h = doc.heightOfString(opt.label, { width: optLabelWidth });
            return Math.max(20, h + 8);
          });
          const optionsTotalH = optionHeights.reduce((acc, h) => acc + h, 0) + 8;
          const cardTotalH = headerH + optionsTotalH;

          // Salto de página natural si excede el límite
          if (curY + cardTotalH > pageBottomLimit) {
            doc.addPage();
            curY = 36;
          }

          const cardY = curY;
          doc.roundedRect(leftX, cardY, printWidth, cardTotalH, 3).fillAndStroke('#FFFFFF', cBorder);

          // Franja de encabezado de la pregunta
          doc.roundedRect(leftX, cardY, printWidth, headerH, 2).fill('#F8FAFC');
          doc.rect(leftX, cardY + headerH, printWidth, 0.5).fill(cBorder);

          // Enunciado
          doc.fontSize(8).font('Helvetica-Bold').fillColor(cInkDark).text(
            `${idx + 1}. ${q.statement}`,
            leftX + 10,
            cardY + 6,
            { width: stmtWidth },
          );

          // Metadatos de la pregunta a la derecha
          const isSingleChoice = q.type?.toLowerCase() === 'single_choice';
          const typeLabel = isSingleChoice ? 'Opción única' : 'Opción múltiple';
          doc.fontSize(6.5).font('Helvetica').fillColor(cInkMuted).text(
            `[${typeLabel}] · ${q.answeredCount} respuestas`,
            leftX + stmtWidth + 10,
            cardY + 7,
            { width: printWidth - stmtWidth - 20, align: 'right' },
          );

          // Opciones y barras de comparación
          let optY = cardY + headerH + 5;
          q.options.forEach((opt, optIndex) => {
            const rowH = optionHeights[optIndex];
            const isTop = opt.count === maxCount && opt.count > 0;
            const barMaxWidth = 160;
            const barWidth = Math.max(2, (opt.percentage / 100) * barMaxWidth);

            // Resaltado sutil para la opción predominante
            if (isTop) {
              doc.roundedRect(leftX + 4, optY - 1, printWidth - 8, rowH, 2).fill(cLeadBg);
            }

            // Altura exacta del texto para centrado vertical impecable
            doc.font(isTop ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5);
            const labelH = doc.heightOfString(opt.label, { width: optLabelWidth });
            const labelY = optY + (rowH - labelH) / 2;

            // Número ordinal centrado verticalmente
            const numY = optY + (rowH - 8) / 2;
            doc.fontSize(7).font('Helvetica-Bold').fillColor(isTop ? cLeadBar : cInkMuted).text(
              `${optIndex + 1}`,
              leftX + 10,
              numY,
              { width: 12 },
            );

            // Etiqueta de la opción (con ancho amplio de 230pt, fluye en múltiples líneas si es necesario)
            doc.fontSize(7.5).font(isTop ? 'Helvetica-Bold' : 'Helvetica').fillColor(isTop ? cNavy : cInkBody).text(
              opt.label,
              leftX + 24,
              labelY,
              { width: optLabelWidth },
            );

            // Barra gráfica horizontal comparativa
            const barX = leftX + 260;
            const barH = 6.5;
            const barY = optY + (rowH - barH) / 2;

            doc.roundedRect(barX, barY, barMaxWidth, barH, 2).fill(cTrack);
            if (barWidth > 0 && opt.count > 0) {
              doc.roundedRect(barX, barY, barWidth, barH, 2).fill(isTop ? cLeadBar : cCompBar);
            }

            // Datos numéricos: Votos y porcentaje
            const statsY = optY + (rowH - 8) / 2;
            doc.fontSize(7).font(isTop ? 'Helvetica-Bold' : 'Helvetica').fillColor(isTop ? cNavy : cInkBody).text(
              `${opt.count} v.`,
              leftX + 426,
              statsY,
              { width: 35, align: 'right' },
            );

            doc.fontSize(7.5).font('Helvetica-Bold').fillColor(isTop ? cLeadBar : cInkDark).text(
              `${opt.percentage.toFixed(1)}%`,
              leftX + 465,
              statsY - 0.5,
              { width: 48, align: 'right' },
            );

            optY += rowH;
          });

          curY += cardTotalH + 9;
        });

        // --- ENCABEZADOS Y PIES DE PÁGINA GLOBALES ---
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          const savedBottomMargin = doc.page.margins.bottom;
          doc.page.margins.bottom = 0;

          // Cabecera corrida a partir de la página 2
          if (i > 0) {
            doc.rect(leftX, 18, printWidth, 0.5).fill(cBorder);
            doc.fontSize(6).font('Helvetica').fillColor(cInkMuted).text(
              'UNIVERSIDAD MAYOR DE SAN SIMÓN · SISTEMA UMSSY',
              leftX,
              11,
              { width: printWidth * 0.6, lineBreak: false },
            );
            doc.fontSize(6).font('Helvetica-Bold').fillColor(cNavy).text(
              `INFORME ESTADÍSTICO · ${refCode}`,
              leftX + printWidth * 0.6,
              11,
              { width: printWidth * 0.4, align: 'right', lineBreak: false },
            );
          }

          // Pie de página oficial
          doc.rect(leftX, 808, printWidth, 0.5).fill(cBorder);
          doc.fontSize(6.5).font('Helvetica').fillColor(cInkMuted).text(
            'Universidad Mayor de San Simón · Sistema UMSSY · Informe Oficial de Encuesta',
            leftX,
            813,
            { width: 350, lineBreak: false },
          );
          doc.fontSize(6.5).font('Helvetica-Bold').fillColor(cNavy).text(
            `Página ${i + 1} de ${pages.count}`,
            leftX + 350,
            813,
            { width: printWidth - 350, align: 'right', lineBreak: false },
          );

          doc.page.margins.bottom = savedBottomMargin;
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

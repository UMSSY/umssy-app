import { Injectable } from '@nestjs/common';
import type { SurveyStatisticsResponse } from '../responses/survey-statistics.response.js';

class SimplePdfDocument {
  private pages: string[][] = [[]];
  private curPage = 0;
  readonly pageW = 595.28;
  readonly pageH = 841.89;

  addPage() {
    this.pages.push([]);
    this.curPage = this.pages.length - 1;
  }

  get pageCount(): number {
    return this.pages.length;
  }

  setPage(idx: number) {
    if (idx >= 0 && idx < this.pages.length) {
      this.curPage = idx;
    }
  }

  private hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return [Math.round(r * 1000) / 1000, Math.round(g * 1000) / 1000, Math.round(b * 1000) / 1000];
  }

  private escapeWinAnsi(text: string): string {
    let res = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const code = text.charCodeAt(i);
      if (ch === '\\') res += '\\\\';
      else if (ch === '(') res += '\\(';
      else if (ch === ')') res += '\\)';
      else if (code >= 32 && code <= 126) {
        res += ch;
      } else if (code >= 160 && code <= 255) {
        res += '\\' + code.toString(8).padStart(3, '0');
      } else {
        const norm = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (norm.length === 1 && norm.charCodeAt(0) >= 32 && norm.charCodeAt(0) <= 126) {
          res += norm;
        } else {
          res += '?';
        }
      }
    }
    return res;
  }

  rect(x: number, y: number, w: number, h: number, fillHex?: string, strokeHex?: string, strokeW = 0.5) {
    const pdfY = this.pageH - y - h;
    let cmd = 'q ';
    if (fillHex) {
      const [r, g, b] = this.hexToRgb(fillHex);
      cmd += `${r} ${g} ${b} rg `;
    }
    if (strokeHex) {
      const [r, g, b] = this.hexToRgb(strokeHex);
      cmd += `${r} ${g} ${b} RG ${strokeW} w `;
    }
    cmd += `${x.toFixed(2)} ${pdfY.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re `;
    if (fillHex && strokeHex) cmd += 'B ';
    else if (fillHex) cmd += 'f ';
    else if (strokeHex) cmd += 'S ';
    cmd += 'Q\n';

    this.pages[this.curPage].push(cmd);
  }

  text(
    str: string,
    x: number,
    y: number,
    opts: {
      fontSize?: number;
      font?: 'Helvetica' | 'Helvetica-Bold';
      color?: string;
      align?: 'left' | 'right';
      width?: number;
    } = {},
  ) {
    const fontSize = opts.fontSize ?? 8;
    const font = opts.font ?? 'Helvetica';
    const fontRef = font === 'Helvetica-Bold' ? '/F2' : '/F1';
    const [r, g, b] = this.hexToRgb(opts.color ?? '#000000');
    const safeStr = this.escapeWinAnsi(str);

    let drawX = x;
    const approxCharW = fontSize * (font === 'Helvetica-Bold' ? 0.58 : 0.52);
    const textW = str.length * approxCharW;

    if (opts.align === 'right' && opts.width) {
      drawX = x + opts.width - textW;
    }

    const pdfY = this.pageH - y - fontSize * 0.82;
    const cmd = `BT ${fontRef} ${fontSize} Tf ${r} ${g} ${b} rg 1 0 0 1 ${drawX.toFixed(2)} ${pdfY.toFixed(2)} Tm (${safeStr}) Tj ET\n`;
    this.pages[this.curPage].push(cmd);
  }

  wrapText(text: string, maxWidth: number, fontSize: number, isBold = false): string[] {
    const approxCharW = fontSize * (isBold ? 0.58 : 0.52);
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let curLine = '';

    for (const word of words) {
      const testLine = curLine ? `${curLine} ${word}` : word;
      if (testLine.length * approxCharW <= maxWidth) {
        curLine = testLine;
      } else {
        if (curLine) lines.push(curLine);
        curLine = word;
      }
    }
    if (curLine) lines.push(curLine);
    return lines.length > 0 ? lines : [''];
  }

  build(): Buffer {
    const objs: string[] = [];
    const addObj = (content: string) => {
      objs.push(content);
      return objs.length;
    };

    // 1: Catalog
    addObj('<< /Type /Catalog /Pages 2 0 R >>');
    // 2: Pages (marcador)
    addObj('');
    // 3: Font F1 (Helvetica)
    addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    // 4: Font F2 (Helvetica-Bold)
    addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

    const pageObjIds: number[] = [];
    for (const pageOps of this.pages) {
      const streamContent = pageOps.join('');
      const streamLen = Buffer.byteLength(streamContent, 'utf-8');
      const streamObjId = addObj(`<< /Length ${streamLen} >>\nstream\n${streamContent}endstream`);
      const pageObjId = addObj(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.pageW} ${this.pageH}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamObjId} 0 R >>`,
      );
      pageObjIds.push(pageObjId);
    }

    // Actualizar objeto 2 (Pages)
    objs[1] = `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjIds.length} >>`;

    // Ensamblar PDF en memoria
    let out = '%PDF-1.4\n';
    const offsets: number[] = [];
    for (let i = 0; i < objs.length; i++) {
      offsets.push(Buffer.byteLength(out, 'utf-8'));
      out += `${i + 1} 0 obj\n${objs[i]}\nendobj\n`;
    }

    const startXref = Buffer.byteLength(out, 'utf-8');
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets) {
      out += `${offset.toString().padStart(10, '0')} 00000 n \n`;
    }
    out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

    return Buffer.from(out, 'utf-8');
  }
}

@Injectable()
export class SurveyPdfService {
  async generatePdf(statistics: SurveyStatisticsResponse): Promise<Buffer> {
    const doc = new SimplePdfDocument();

    const cNavy = '#0F2D59';
    const cCrimson = '#A31D1D';
    const cInkDark = '#1E293B';
    const cInkBody = '#334155';
    const cInkMuted = '#64748B';
    const cCardBg = '#F8FAFC';
    const cBorder = '#E2E8F0';
    const cTrack = '#EEF2F6';
    const cLeadBar = '#1D4ED8';
    const cCompBar = '#94A3B8';
    const cLeadBg = '#EFF6FF';

    const printWidth = 523;
    const leftX = 36;
    const pageBottomLimit = 735;

    // --- ENCABEZADO INSTITUCIONAL ---
    doc.rect(leftX, 26, printWidth, 3, cNavy);
    doc.rect(leftX, 29, printWidth * 0.25, 1.5, cCrimson);

    doc.text('UNIVERSIDAD MAYOR DE SAN SIMÓN', leftX, 36, {
      fontSize: 10,
      font: 'Helvetica-Bold',
      color: cNavy,
    });
    doc.text('DIRECCIÓN DE PLANIFICACIÓN ACADÉMICA', leftX, 48, {
      fontSize: 7,
      font: 'Helvetica',
      color: cInkMuted,
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
      color: cNavy,
      align: 'right',
      width: 179,
    });
    doc.text(`Emisión: ${issueDate}`, 380, 48, {
      fontSize: 6.5,
      font: 'Helvetica',
      color: cInkMuted,
      align: 'right',
      width: 179,
    });

    let curY = 62;
    doc.rect(leftX, curY, printWidth, 0.5, undefined, cBorder);
    curY += 8;

    // Título del informe
    doc.text('INFORME ESTADÍSTICO DE RESULTADOS', leftX, curY, {
      fontSize: 11,
      font: 'Helvetica-Bold',
      color: cNavy,
    });
    curY += 15;

    // Ficha técnica compacta de la encuesta
    const careerLabel = statistics.career?.title ?? 'Todas las carreras';
    const periodLabel = statistics.academicPeriod ?? 'General';
    const statusLabel = statistics.status === 'published' ? 'Publicada' : 'Borrador';
    const opensStr = statistics.opensAt ? new Date(statistics.opensAt).toLocaleDateString('es-BO') : 'N/D';
    const closesStr = statistics.closesAt ? new Date(statistics.closesAt).toLocaleDateString('es-BO') : 'N/D';

    const titleLines = doc.wrapText(statistics.title, printWidth - 20, 9, true);
    const titleHeight = titleLines.length * 11;
    const fichaH = Math.max(50, titleHeight + 36);

    doc.rect(leftX, curY, printWidth, fichaH, cCardBg, cBorder, 0.5);

    let tY = curY + 7;
    for (const tLine of titleLines) {
      doc.text(tLine, leftX + 10, tY, {
        fontSize: 9,
        font: 'Helvetica-Bold',
        color: cInkDark,
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
        color: cInkMuted,
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
        color: cCrimson,
      },
    );

    curY += fichaH + 12;

    // Subtítulo de resultados
    doc.text('Resultados Detallados y Gráficos de Comparación', leftX, curY, {
      fontSize: 9.5,
      font: 'Helvetica-Bold',
      color: cNavy,
    });
    curY += 14;

    // Listado de preguntas con gráficos comparativos
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

      // Salto de página natural si excede el límite
      if (curY + cardTotalH > pageBottomLimit) {
        doc.addPage();
        curY = 36;
      }

      const cardY = curY;
      doc.rect(leftX, cardY, printWidth, cardTotalH, '#FFFFFF', cBorder, 0.5);

      // Franja de encabezado de la pregunta
      doc.rect(leftX, cardY, printWidth, headerH, '#F8FAFC');
      doc.rect(leftX, cardY + headerH, printWidth, 0.5, undefined, cBorder);

      // Enunciado
      let stmtY = cardY + 6;
      for (const line of stmtLines) {
        doc.text(line, leftX + 10, stmtY, {
          fontSize: 8,
          font: 'Helvetica-Bold',
          color: cInkDark,
        });
        stmtY += 11;
      }

      // Metadatos de la pregunta a la derecha
      const isSingleChoice = q.type?.toLowerCase() === 'single_choice';
      const typeLabel = isSingleChoice ? 'Opción única' : 'Opción múltiple';
      doc.text(`[${typeLabel}] · ${q.answeredCount} respuestas`, leftX + stmtWidth + 10, cardY + 7, {
        fontSize: 6.5,
        font: 'Helvetica',
        color: cInkMuted,
        align: 'right',
        width: printWidth - stmtWidth - 20,
      });

      // Opciones y barras
      let optY = cardY + headerH + 5;
      q.options.forEach((opt, optIndex) => {
        const rowH = optionRowHeights[optIndex];
        const isTop = opt.count === maxCount && opt.count > 0;
        const barMaxWidth = 160;
        const barWidth = Math.max(2, (opt.percentage / 100) * barMaxWidth);

        if (isTop) {
          doc.rect(leftX + 4, optY - 1, printWidth - 8, rowH, cLeadBg);
        }

        const lines = doc.wrapText(opt.label, optLabelWidth, 7.5, isTop);
        const labelH = lines.length * 10;
        const labelY = optY + (rowH - labelH) / 2;

        // Número ordinal
        const numY = optY + (rowH - 8) / 2;
        doc.text(`${optIndex + 1}`, leftX + 10, numY, {
          fontSize: 7,
          font: 'Helvetica-Bold',
          color: isTop ? cLeadBar : cInkMuted,
        });

        // Etiqueta multilínea de la opción
        let lineY = labelY;
        for (const line of lines) {
          doc.text(line, leftX + 24, lineY, {
            fontSize: 7.5,
            font: isTop ? 'Helvetica-Bold' : 'Helvetica',
            color: isTop ? cNavy : cInkBody,
          });
          lineY += 10;
        }

        // Barra gráfica horizontal comparativa
        const barX = leftX + 260;
        const barH = 6.5;
        const barY = optY + (rowH - barH) / 2;

        doc.rect(barX, barY, barMaxWidth, barH, cTrack);
        if (barWidth > 0 && opt.count > 0) {
          doc.rect(barX, barY, barWidth, barH, isTop ? cLeadBar : cCompBar);
        }

        // Datos numéricos: Votos y porcentaje
        const statsY = optY + (rowH - 8) / 2;
        doc.text(`${opt.count} v.`, leftX + 426, statsY, {
          fontSize: 7,
          font: isTop ? 'Helvetica-Bold' : 'Helvetica',
          color: isTop ? cNavy : cInkBody,
          align: 'right',
          width: 35,
        });

        doc.text(`${opt.percentage.toFixed(1)}%`, leftX + 465, statsY - 0.5, {
          fontSize: 7.5,
          font: 'Helvetica-Bold',
          color: isTop ? cLeadBar : cInkDark,
          align: 'right',
          width: 48,
        });

        optY += rowH;
      });

      curY += cardTotalH + 9;
    });

    // Encabezados y pies de página globales
    const totalPages = doc.pageCount;
    for (let p = 0; p < totalPages; p++) {
      doc.setPage(p);

      // Cabecera corrida a partir de la página 2
      if (p > 0) {
        doc.rect(leftX, 18, printWidth, 0.5, undefined, cBorder);
        doc.text('UNIVERSIDAD MAYOR DE SAN SIMÓN · SISTEMA UMSSY', leftX, 11, {
          fontSize: 6,
          font: 'Helvetica',
          color: cInkMuted,
        });
        doc.text(`INFORME ESTADÍSTICO · ${refCode}`, leftX + printWidth * 0.5, 11, {
          fontSize: 6,
          font: 'Helvetica-Bold',
          color: cNavy,
          align: 'right',
          width: printWidth * 0.5,
        });
      }

      // Pie de página oficial
      doc.rect(leftX, 808, printWidth, 0.5, undefined, cBorder);
      doc.text(
        'Universidad Mayor de San Simón · Sistema UMSSY · Informe Oficial de Encuesta',
        leftX,
        813,
        {
          fontSize: 6.5,
          font: 'Helvetica',
          color: cInkMuted,
        },
      );
      doc.text(`Página ${p + 1} de ${totalPages}`, leftX + 350, 813, {
        fontSize: 6.5,
        font: 'Helvetica-Bold',
        color: cNavy,
        align: 'right',
        width: printWidth - 350,
      });
    }

    return doc.build();
  }
}

import { Injectable } from '@nestjs/common';
import { SimplePdfDocument } from '../../../common/utils/simple-pdf-document.js';
import { toBoliviaTime } from '../../../common/utils/date-time.js';
import {
  REPORT_PDF_BASE_COLUMNS,
  REPORT_PDF_COLORS,
  REPORT_PDF_DATE_COLUMN_WIDTH,
  REPORT_PDF_PAGE,
  REPORT_PDF_TEXT,
} from '../constants/report-pdf.constants.js';
import type {
  ReportPdfColumn,
  ReportPdfContent,
  ReportPdfFilter,
} from '../types/report-pdf.types.js';

const { width: PAGE_WIDTH, height: PAGE_HEIGHT, margin: MARGIN } = REPORT_PDF_PAGE;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CARD_HEIGHT = 48;
const CARD_GAP = 12;
const CARD_PADDING = 12;
const PILL_HEIGHT = 17;
const PILL_PADDING = 8;
const PILL_GAP = 6;
const TABLE_HEADER_HEIGHT = 24;
const TABLE_FONT_SIZE = 8;
const ROW_LINE_HEIGHT = 10;
const ROW_MIN_HEIGHT = 24;
const CELL_PADDING = 6;
const EMPTY_CELL = '-';

function approxWidth(text: string, fontSize: number, bold = false): number {
  return text.length * fontSize * (bold ? 0.58 : 0.52);
}

function truncate(text: string, maxWidth: number, fontSize: number, bold = false): string {
  if (approxWidth(text, fontSize, bold) <= maxWidth) return text;
  let value = text;
  while (value.length > 1 && approxWidth(`${value}...`, fontSize, bold) > maxWidth) {
    value = value.slice(0, -1);
  }
  return `${value}...`;
}

export function formatReportDateTime(date: Date): string {
  const { date: isoDate, time } = toBoliviaTime(date);
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year} ${time}`;
}

@Injectable()
export class ReportPdfService {
  render(content: ReportPdfContent): Buffer {
    const doc = new SimplePdfDocument(PAGE_WIDTH, PAGE_HEIGHT);
    const columns: ReportPdfColumn[] = [
      ...REPORT_PDF_BASE_COLUMNS,
      { label: content.dateColumnLabel, width: REPORT_PDF_DATE_COLUMN_WIDTH },
    ];

    let y = this.drawPageHeader(doc);
    y = this.drawIntro(doc, y, content);
    y = this.drawTableHeader(doc, y, columns);

    if (content.rows.length === 0) {
      doc.text(REPORT_PDF_TEXT.emptyTable, MARGIN + CELL_PADDING, y + 10, {
        fontSize: 10,
        color: REPORT_PDF_COLORS.muted,
      });
    }

    content.rows.forEach((row, rowIndex) => {
      const cells = columns.map((column, index) =>
        doc.wrapText(row[index] || EMPTY_CELL, column.width - CELL_PADDING * 2, TABLE_FONT_SIZE),
      );
      const lineCount = Math.max(1, ...cells.map((lines) => lines.length));
      const rowHeight = Math.max(ROW_MIN_HEIGHT, lineCount * ROW_LINE_HEIGHT + 10);

      if (y + rowHeight > PAGE_HEIGHT - REPORT_PDF_PAGE.footerLimit) {
        doc.addPage();
        y = this.drawTableHeader(doc, this.drawPageHeader(doc), columns);
      }

      if (rowIndex % 2 === 0) {
        doc.rect(MARGIN, y, CONTENT_WIDTH, rowHeight, REPORT_PDF_COLORS.rowStripe);
      }

      let x = MARGIN;
      cells.forEach((lines, columnIndex) => {
        lines.forEach((line, lineIndex) => {
          doc.text(line, x + CELL_PADDING, y + 8 + lineIndex * ROW_LINE_HEIGHT, {
            fontSize: TABLE_FONT_SIZE,
            color: REPORT_PDF_COLORS.text,
          });
        });
        x += columns[columnIndex]!.width;
      });
      y += rowHeight;
    });

    this.drawFooters(doc, formatReportDateTime(content.generatedAt));
    return doc.build();
  }

  private drawPageHeader(doc: SimplePdfDocument): number {
    doc.text(REPORT_PDF_TEXT.universityName, MARGIN, MARGIN + 4, {
      fontSize: 12,
      font: 'Helvetica-Bold',
      color: REPORT_PDF_COLORS.text,
    });
    doc.text(REPORT_PDF_TEXT.universitySubtitle, MARGIN, MARGIN + 21, {
      fontSize: 8.5,
      color: REPORT_PDF_COLORS.muted,
    });
    doc.text(REPORT_PDF_TEXT.brand, MARGIN, MARGIN + 6, {
      fontSize: 16,
      font: 'Helvetica-Bold',
      color: REPORT_PDF_COLORS.navy,
      align: 'right',
      width: CONTENT_WIDTH,
    });
    const dividerY = MARGIN + 42;
    doc.rect(MARGIN, dividerY, CONTENT_WIDTH, 2.5, REPORT_PDF_COLORS.navy);
    return dividerY + 16;
  }

  private drawIntro(doc: SimplePdfDocument, top: number, content: ReportPdfContent): number {
    doc.text(content.title, MARGIN, top, {
      fontSize: 20,
      font: 'Helvetica-Bold',
      color: REPORT_PDF_COLORS.navy,
    });
    doc.text(content.subtitle, MARGIN, top + 25, {
      fontSize: 10,
      color: REPORT_PDF_COLORS.muted,
    });

    const cardsBottom = this.drawCards(doc, top + 44, [
      { label: REPORT_PDF_TEXT.generatedAtCard, value: formatReportDateTime(content.generatedAt) },
      { label: REPORT_PDF_TEXT.generatedByCard, value: content.generatedBy },
      { label: REPORT_PDF_TEXT.totalCard, value: REPORT_PDF_TEXT.totalRecords(content.rows.length) },
    ]);
    return this.drawFilterPills(doc, cardsBottom + 14, content.filters) + 16;
  }

  private drawCards(doc: SimplePdfDocument, top: number, cards: { label: string; value: string }[]): number {
    const cardWidth = (CONTENT_WIDTH - CARD_GAP * (cards.length - 1)) / cards.length;
    cards.forEach((card, index) => {
      const x = MARGIN + index * (cardWidth + CARD_GAP);
      doc.rect(x, top, cardWidth, CARD_HEIGHT, REPORT_PDF_COLORS.cardBackground, REPORT_PDF_COLORS.border);
      doc.text(card.label, x + CARD_PADDING, top + 10, {
        fontSize: 7,
        font: 'Helvetica-Bold',
        color: REPORT_PDF_COLORS.muted,
      });
      doc.text(truncate(card.value, cardWidth - CARD_PADDING * 2, 11, true), x + CARD_PADDING, top + 25, {
        fontSize: 11,
        font: 'Helvetica-Bold',
        color: REPORT_PDF_COLORS.text,
      });
    });
    return top + CARD_HEIGHT;
  }

  private drawFilterPills(doc: SimplePdfDocument, top: number, filters: readonly ReportPdfFilter[]): number {
    const pillsStartX = MARGIN + approxWidth(REPORT_PDF_TEXT.filtersLabel, 9, true) + PILL_GAP * 2;
    const maxX = PAGE_WIDTH - MARGIN;
    let x = pillsStartX;
    let rowTop = top;

    doc.text(REPORT_PDF_TEXT.filtersLabel, MARGIN, rowTop + 4, {
      fontSize: 9,
      font: 'Helvetica-Bold',
      color: REPORT_PDF_COLORS.text,
    });

    for (const filter of filters) {
      const text = truncate(`${filter.label}: ${filter.value}`, maxX - pillsStartX - PILL_PADDING * 2, 8);
      const pillWidth = approxWidth(text, 8) + PILL_PADDING * 2;
      if (x > pillsStartX && x + pillWidth > maxX) {
        x = pillsStartX;
        rowTop += PILL_HEIGHT + PILL_GAP;
      }
      doc.rect(x, rowTop, pillWidth, PILL_HEIGHT, REPORT_PDF_COLORS.pillBackground, REPORT_PDF_COLORS.border);
      doc.text(text, x + PILL_PADDING, rowTop + 4.5, { fontSize: 8, color: REPORT_PDF_COLORS.text });
      x += pillWidth + PILL_GAP;
    }
    return rowTop + PILL_HEIGHT;
  }

  private drawTableHeader(doc: SimplePdfDocument, top: number, columns: ReportPdfColumn[]): number {
    doc.rect(MARGIN, top, CONTENT_WIDTH, TABLE_HEADER_HEIGHT, REPORT_PDF_COLORS.navy);
    let x = MARGIN;
    for (const column of columns) {
      doc.text(column.label, x + CELL_PADDING, top + 8, {
        fontSize: TABLE_FONT_SIZE,
        font: 'Helvetica-Bold',
        color: REPORT_PDF_COLORS.white,
      });
      x += column.width;
    }
    return top + TABLE_HEADER_HEIGHT;
  }

  private drawFooters(doc: SimplePdfDocument, generatedAt: string): void {
    const footerY = PAGE_HEIGHT - 28;
    for (let index = 0; index < doc.pageCount; index++) {
      doc.setPage(index);
      doc.text(REPORT_PDF_TEXT.footer(generatedAt), MARGIN, footerY, {
        fontSize: 8,
        color: REPORT_PDF_COLORS.muted,
      });
      doc.text(REPORT_PDF_TEXT.pageLabel(index + 1, doc.pageCount), MARGIN, footerY, {
        fontSize: 8,
        color: REPORT_PDF_COLORS.muted,
        align: 'right',
        width: CONTENT_WIDTH,
      });
    }
  }
}

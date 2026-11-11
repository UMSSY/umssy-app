import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage, type RGB } from "pdf-lib";
import { BOLIVIA_TIME_ZONE } from "@/shared/constants/date-time.constants";
import type { ExportedFile } from "../types/registered-user.types";
import type { ReportPdfFilter, ReportPdfMetadata } from "../types/report-pdf.types";

interface PdfColor {
  pdf: RGB;
  css: string;
}

interface TextStyle {
  size: number;
  color: PdfColor;
  bold?: boolean;
}

interface PdfContext {
  document: PDFDocument;
  regularFont: PDFFont;
  boldFont: PDFFont;
  canvasContext: CanvasRenderingContext2D;
  sealLogo: PDFImage;
  brandLogo: PDFImage;
}

interface ReportColumn {
  label: string;
  width: number;
  aliases: string[];
}

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const PAGE_MARGIN = 35;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const FOOTER_LIMIT = 45;
const TEXT_IMAGE_SCALE = 3;
const EMPTY_CELL = "-";

const HEADER_TOP = PAGE_HEIGHT - PAGE_MARGIN;
const SEAL_RADIUS = 22;
const DIVIDER_THICKNESS = 2.5;
const DIVIDER_GAP = 14;

const CARD_HEIGHT = 48;
const CARD_GAP = 12;
const CARD_RADIUS = 6;
const CARD_PADDING = 12;

const PILL_HEIGHT = 17;
const PILL_PADDING = 8;
const PILL_GAP = 6;
const PILL_FONT_SIZE = 8;

const TABLE_HEADER_HEIGHT = 24;
const TABLE_FONT_SIZE = 8;
const ROW_LINE_HEIGHT = 10;
const ROW_MIN_HEIGHT = 24;
const CELL_PADDING = 6;

const SEAL_LOGO_PATH = "/icons/umss-institutional-seal.svg";
const BRAND_LOGO_PATH = "/icons/umssy-logo-web.svg";

const NAVY: PdfColor = { pdf: rgb(0.03, 0.21, 0.36), css: "#08365c" };
const TEXT: PdfColor = { pdf: rgb(0.12, 0.15, 0.18), css: "#1f262e" };
const MUTED: PdfColor = { pdf: rgb(0.35, 0.4, 0.45), css: "#5a6673" };
const WHITE: PdfColor = { pdf: rgb(1, 1, 1), css: "#ffffff" };
const CARD_BACKGROUND = rgb(0.96, 0.97, 0.98);
const CARD_BORDER = rgb(0.85, 0.88, 0.91);
const PILL_BACKGROUND = rgb(0.92, 0.93, 0.95);
const ROW_STRIPE = rgb(0.96, 0.97, 0.98);

const UNIVERSITY_NAME = "Universidad Mayor de San Simón";
const UNIVERSITY_SUBTITLE = "Ingeniería de Sistemas · Acreditación y comunidad";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("es-BO", {
  timeZone: BOLIVIA_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function buildReportColumns(dateColumnLabel: string): ReportColumn[] {
  return [
    { label: "Nombre", width: 170, aliases: ["nombre", "nombre completo", "usuario"] },
    { label: "Correo", width: 200, aliases: ["correo", "correo electronico", "email"] },
    { label: "Tipo de usuario", width: 120, aliases: ["tipo de usuario", "tipo"] },
    { label: "Carrera", width: 162, aliases: ["carrera"] },
    {
      label: dateColumnLabel,
      width: 120,
      aliases: ["fecha de aprobacion", "fecha de rechazo", "fecha de registro", "fecha"],
    },
  ];
}

export function parseReportCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let isQuoted = false;
  const csv = content.replace(/^\uFEFF/, "");

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];

    if (isQuoted) {
      if (character === '"' && csv[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        isQuoted = false;
      } else {
        value += character;
      }
      continue;
    }

    if (character === '"' && value.length === 0) {
      isQuoted = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n") {
      row.push(value.replace(/\r$/, ""));
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value.replace(/\r$/, ""));
    if (row.some((cell) => cell.length > 0)) rows.push(row);
  }

  return rows;
}

function normalizeHeader(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function toReportTableRows(rows: string[][], dateColumnLabel = "Fecha de aprobación"): string[][] {
  const headers = (rows[0] ?? []).map(normalizeHeader);
  const columnIndexes = buildReportColumns(dateColumnLabel).map(({ aliases }) =>
    aliases.map((alias) => headers.indexOf(alias)).find((index) => index >= 0) ?? -1,
  );

  return rows.slice(1).map((row) =>
    columnIndexes.map((columnIndex) => {
      const value = columnIndex >= 0 ? row[columnIndex]?.trim() : undefined;
      return value || EMPTY_CELL;
    }),
  );
}

export function formatReportDateTime(date: Date): string {
  const parts = Object.fromEntries(DATE_TIME_FORMATTER.formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.day}/${parts.month}/${parts.year} - ${parts.hour}:${parts.minute}`;
}

function canvasToPng(canvas: HTMLCanvasElement, errorMessage: string): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error(errorMessage))), "image/png");
  });
}

async function loadLogo(document: PDFDocument, path: string): Promise<PDFImage> {
  const errorMessage = "No se pudo preparar el logotipo institucional.";
  const response = await fetch(path);
  if (!response.ok) throw new Error("No se pudo cargar el logotipo institucional.");

  const imageUrl = URL.createObjectURL(new Blob([await response.text()], { type: "image/svg+xml" }));
  const image = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(errorMessage));
      image.src = imageUrl;
    });

    const canvas = window.document.createElement("canvas");
    canvas.width = image.naturalWidth || 1200;
    canvas.height = image.naturalHeight || 400;
    const context = canvas.getContext("2d");
    if (!context) throw new Error(errorMessage);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const imageData = await canvasToPng(canvas, errorMessage);
    return document.embedPng(await imageData.arrayBuffer());
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function fitImage(image: PDFImage, maxWidth: number, maxHeight: number) {
  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
  return { width: image.width * ratio, height: image.height * ratio };
}

function getFont(context: PdfContext, bold?: boolean): PDFFont {
  return bold ? context.boldFont : context.regularFont;
}

function getCanvasFont(size: number, bold?: boolean): string {
  return `${bold ? "bold " : ""}${size * TEXT_IMAGE_SCALE}px sans-serif`;
}

function canEncodeText(font: PDFFont, value: string): boolean {
  try {
    font.encodeText(value);
    return true;
  } catch {
    return false;
  }
}

function measureText(context: PdfContext, value: string, style: Pick<TextStyle, "size" | "bold">): number {
  const font = getFont(context, style.bold);
  if (canEncodeText(font, value)) return font.widthOfTextAtSize(value, style.size);

  context.canvasContext.font = getCanvasFont(style.size, style.bold);
  return context.canvasContext.measureText(value).width / TEXT_IMAGE_SCALE;
}

async function drawUnicodeText(context: PdfContext, page: PDFPage, value: string, x: number, baseline: number, style: TextStyle) {
  const errorMessage = "No se pudo preparar el texto del reporte.";
  const canvas = window.document.createElement("canvas");
  const canvasContext = canvas.getContext("2d");
  if (!canvasContext) throw new Error(errorMessage);

  const canvasFont = getCanvasFont(style.size, style.bold);
  canvasContext.font = canvasFont;
  canvas.width = Math.max(1, Math.ceil(canvasContext.measureText(value).width) + 2 * TEXT_IMAGE_SCALE);
  canvas.height = Math.ceil(style.size * TEXT_IMAGE_SCALE * 1.4);
  canvasContext.font = canvasFont;
  canvasContext.fillStyle = style.color.css;
  canvasContext.textBaseline = "top";
  canvasContext.fillText(value, TEXT_IMAGE_SCALE, 0);

  const imageData = await canvasToPng(canvas, errorMessage);
  const image = await context.document.embedPng(await imageData.arrayBuffer());
  const height = canvas.height / TEXT_IMAGE_SCALE;
  page.drawImage(image, {
    x: x - 1,
    y: baseline - (height - style.size),
    width: canvas.width / TEXT_IMAGE_SCALE,
    height,
  });
}

async function drawText(context: PdfContext, page: PDFPage, rawValue: string, x: number, baseline: number, style: TextStyle) {
  const value = rawValue.replace(/\s+/g, " ").trim();
  if (!value) return;

  const font = getFont(context, style.bold);
  if (canEncodeText(font, value)) {
    page.drawText(value, { x, y: baseline, size: style.size, font, color: style.color.pdf });
    return;
  }

  // El navegador representa letras que la fuente estándar del PDF no puede codificar.
  await drawUnicodeText(context, page, value, x, baseline, style);
}

function truncateText(context: PdfContext, value: string, maxWidth: number, style: TextStyle): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (measureText(context, text, style) <= maxWidth) return text;

  let truncated = text;
  while (truncated.length > 1 && measureText(context, `${truncated}...`, style) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated.trimEnd()}...`;
}

function breakLongWord(word: string, width: number, measure: (text: string) => number): string[] {
  const parts: string[] = [];
  let part = "";

  for (const character of word) {
    if (part && measure(part + character) > width) {
      parts.push(part);
      part = character;
    } else {
      part += character;
    }
  }

  if (part) parts.push(part);
  return parts;
}

function wrapText(value: string, width: number, measure: (text: string) => number): string[] {
  const lines: string[] = [];
  let line = "";

  for (const word of value.split(/\s+/).filter(Boolean)) {
    const chunks = measure(word) > width ? breakLongWord(word, width, measure) : [word];

    for (const chunk of chunks) {
      const candidate = line ? `${line} ${chunk}` : chunk;
      if (line && measure(candidate) > width) {
        lines.push(line);
        line = chunk;
      } else {
        line = candidate;
      }
    }
  }

  if (line || lines.length === 0) lines.push(line);
  return lines;
}

function roundedRectanglePath(width: number, height: number, radius: number): string {
  const r = Math.min(radius, width / 2, height / 2);
  const k = r * 0.5523;
  return [
    `M ${r} 0`,
    `L ${width - r} 0`,
    `C ${width - r + k} 0 ${width} ${r - k} ${width} ${r}`,
    `L ${width} ${height - r}`,
    `C ${width} ${height - r + k} ${width - r + k} ${height} ${width - r} ${height}`,
    `L ${r} ${height}`,
    `C ${r - k} ${height} 0 ${height - r + k} 0 ${height - r}`,
    `L 0 ${r}`,
    `C 0 ${r - k} ${r - k} 0 ${r} 0`,
    "Z",
  ].join(" ");
}

function drawRoundedRectangle(
  page: PDFPage,
  box: { x: number; top: number; width: number; height: number; radius: number },
  colors: { fill: RGB; border?: RGB },
) {
  page.drawSvgPath(roundedRectanglePath(box.width, box.height, box.radius), {
    x: box.x,
    y: box.top,
    color: colors.fill,
    ...(colors.border && { borderColor: colors.border, borderWidth: 0.75 }),
  });
}

async function drawPageHeader(context: PdfContext, page: PDFPage): Promise<number> {
  const sealCenterY = HEADER_TOP - SEAL_RADIUS;
  const sealCenterX = PAGE_MARGIN + SEAL_RADIUS;
  page.drawCircle({ x: sealCenterX, y: sealCenterY, size: SEAL_RADIUS, color: NAVY.pdf });
  const sealSize = fitImage(context.sealLogo, SEAL_RADIUS * 1.15, SEAL_RADIUS * 1.45);
  page.drawImage(context.sealLogo, {
    x: sealCenterX - sealSize.width / 2,
    y: sealCenterY - sealSize.height / 2,
    ...sealSize,
  });

  const textX = PAGE_MARGIN + SEAL_RADIUS * 2 + 10;
  await drawText(context, page, UNIVERSITY_NAME, textX, sealCenterY + 3, { size: 12, color: TEXT, bold: true });
  await drawText(context, page, UNIVERSITY_SUBTITLE, textX, sealCenterY - 11, { size: 8.5, color: MUTED });

  const brandSize = fitImage(context.brandLogo, 150, SEAL_RADIUS * 2);
  page.drawImage(context.brandLogo, {
    x: PAGE_WIDTH - PAGE_MARGIN - brandSize.width,
    y: sealCenterY - brandSize.height / 2,
    ...brandSize,
  });

  const dividerY = HEADER_TOP - SEAL_RADIUS * 2 - 10;
  page.drawLine({
    start: { x: PAGE_MARGIN, y: dividerY },
    end: { x: PAGE_WIDTH - PAGE_MARGIN, y: dividerY },
    thickness: DIVIDER_THICKNESS,
    color: NAVY.pdf,
  });

  return dividerY - DIVIDER_GAP;
}

async function drawMetadataCards(context: PdfContext, page: PDFPage, top: number, cards: { label: string; value: string }[]) {
  const cardWidth = (CONTENT_WIDTH - CARD_GAP * (cards.length - 1)) / cards.length;
  const labelStyle: TextStyle = { size: 7, color: MUTED, bold: true };
  const valueStyle: TextStyle = { size: 11, color: TEXT, bold: true };

  for (const [index, card] of cards.entries()) {
    const x = PAGE_MARGIN + index * (cardWidth + CARD_GAP);
    drawRoundedRectangle(
      page,
      { x, top, width: cardWidth, height: CARD_HEIGHT, radius: CARD_RADIUS },
      { fill: CARD_BACKGROUND, border: CARD_BORDER },
    );
    await drawText(context, page, card.label, x + CARD_PADDING, top - 17, labelStyle);
    const value = truncateText(context, card.value, cardWidth - CARD_PADDING * 2, valueStyle);
    await drawText(context, page, value, x + CARD_PADDING, top - 35, valueStyle);
  }

  return top - CARD_HEIGHT;
}

async function drawFilterPills(context: PdfContext, page: PDFPage, top: number, filters: ReportPdfFilter[]) {
  const labelStyle: TextStyle = { size: 9, color: TEXT, bold: true };
  const pillStyle: TextStyle = { size: PILL_FONT_SIZE, color: TEXT };
  const label = "Filtros aplicados:";
  const labelWidth = measureText(context, label, labelStyle);
  const pillsStartX = PAGE_MARGIN + labelWidth + PILL_GAP * 2;
  const maxX = PAGE_WIDTH - PAGE_MARGIN;
  let x = pillsStartX;
  let rowTop = top;

  await drawText(context, page, label, PAGE_MARGIN, rowTop - 12, labelStyle);

  for (const filter of filters) {
    const text = truncateText(context, `${filter.label}: ${filter.value}`, maxX - pillsStartX - PILL_PADDING * 2, pillStyle);
    const pillWidth = measureText(context, text, pillStyle) + PILL_PADDING * 2;

    if (x > pillsStartX && x + pillWidth > maxX) {
      x = pillsStartX;
      rowTop -= PILL_HEIGHT + PILL_GAP;
    }

    drawRoundedRectangle(
      page,
      { x, top: rowTop, width: pillWidth, height: PILL_HEIGHT, radius: PILL_HEIGHT / 2 },
      { fill: PILL_BACKGROUND, border: CARD_BORDER },
    );
    await drawText(context, page, text, x + PILL_PADDING, rowTop - 11.5, pillStyle);
    x += pillWidth + PILL_GAP;
  }

  return rowTop - PILL_HEIGHT;
}

async function drawReportIntro(
  context: PdfContext,
  page: PDFPage,
  top: number,
  metadata: ReportPdfMetadata,
  totalRecords: number,
): Promise<number> {
  await drawText(context, page, metadata.title, PAGE_MARGIN, top - 20, { size: 20, color: NAVY, bold: true });
  await drawText(context, page, metadata.subtitle, PAGE_MARGIN, top - 37, { size: 10, color: MUTED });

  const cardsBottom = await drawMetadataCards(context, page, top - 52, [
    { label: "FECHA DE GENERACIÓN", value: formatReportDateTime(metadata.generatedAt ?? new Date()) },
    { label: "GENERADO POR", value: metadata.generatedBy },
    { label: "TOTAL DE REGISTROS", value: `${totalRecords} ${totalRecords === 1 ? "usuario" : "usuarios"}` },
  ]);

  const filtersBottom = await drawFilterPills(context, page, cardsBottom - 14, metadata.filters);
  return filtersBottom - 16;
}

function drawTableHeader(context: PdfContext, page: PDFPage, top: number, columns: ReportColumn[]): number {
  page.drawRectangle({
    x: PAGE_MARGIN,
    y: top - TABLE_HEADER_HEIGHT,
    width: CONTENT_WIDTH,
    height: TABLE_HEADER_HEIGHT,
    color: NAVY.pdf,
  });

  let x = PAGE_MARGIN;
  for (const column of columns) {
    page.drawText(column.label, {
      x: x + CELL_PADDING,
      y: top - 15,
      size: TABLE_FONT_SIZE,
      font: context.boldFont,
      color: WHITE.pdf,
    });
    x += column.width;
  }

  return top - TABLE_HEADER_HEIGHT;
}

function drawPageFooter(context: PdfContext, page: PDFPage, pageNumber: number, pageCount: number, generatedAt: string) {
  const footerStyle = { size: 8, font: context.regularFont, color: MUTED.pdf };
  page.drawText(`UMSSY · Reporte generado el ${generatedAt}`, { x: PAGE_MARGIN, y: 20, ...footerStyle });
  const pageLabel = `Página ${pageNumber} de ${pageCount}`;
  page.drawText(pageLabel, {
    x: PAGE_WIDTH - PAGE_MARGIN - context.regularFont.widthOfTextAtSize(pageLabel, 8),
    y: 20,
    ...footerStyle,
  });
}

export async function createReportPdf(csvFile: Blob, fileName: string, metadata: ReportPdfMetadata): Promise<ExportedFile> {
  const generatedAt = metadata.generatedAt ?? new Date();
  const reportMetadata = { ...metadata, generatedAt };
  const columns = buildReportColumns(metadata.dateColumnLabel);
  const dataRows = toReportTableRows(parseReportCsv(await csvFile.text()), metadata.dateColumnLabel);

  const pdfDocument = await PDFDocument.create();
  pdfDocument.setTitle(metadata.title);
  pdfDocument.setAuthor("UMSSY");
  pdfDocument.setSubject(metadata.subtitle);

  const [regularFont, boldFont] = await Promise.all([
    pdfDocument.embedFont(StandardFonts.Helvetica),
    pdfDocument.embedFont(StandardFonts.HelveticaBold),
  ]);
  const [sealLogo, brandLogo] = await Promise.all([
    loadLogo(pdfDocument, SEAL_LOGO_PATH),
    loadLogo(pdfDocument, BRAND_LOGO_PATH),
  ]);
  const canvasContext = window.document.createElement("canvas").getContext("2d");
  if (!canvasContext) throw new Error("No se pudo preparar el texto del reporte.");

  const context: PdfContext = { document: pdfDocument, regularFont, boldFont, canvasContext, sealLogo, brandLogo };
  const cellStyle: TextStyle = { size: TABLE_FONT_SIZE, color: TEXT };
  const pages: PDFPage[] = [];

  let page = pdfDocument.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pages.push(page);
  let y = await drawPageHeader(context, page);
  y = await drawReportIntro(context, page, y, reportMetadata, dataRows.length);
  y = drawTableHeader(context, page, y, columns);

  if (dataRows.length === 0) {
    await drawText(context, page, "No hay resultados disponibles para exportar.", PAGE_MARGIN + CELL_PADDING, y - 17, {
      size: 10,
      color: MUTED,
    });
  }

  for (const [rowIndex, dataRow] of dataRows.entries()) {
    const wrappedCells = columns.map((column, columnIndex) =>
      wrapText(dataRow[columnIndex] ?? EMPTY_CELL, column.width - CELL_PADDING * 2, (text) =>
        measureText(context, text, cellStyle),
      ),
    );
    const lineCount = Math.max(1, ...wrappedCells.map((lines) => lines.length));
    const rowHeight = Math.max(ROW_MIN_HEIGHT, lineCount * ROW_LINE_HEIGHT + 10);

    if (y - rowHeight < FOOTER_LIMIT) {
      page = pdfDocument.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pages.push(page);
      y = drawTableHeader(context, page, await drawPageHeader(context, page), columns);
    }

    page.drawRectangle({
      x: PAGE_MARGIN,
      y: y - rowHeight,
      width: CONTENT_WIDTH,
      height: rowHeight,
      color: rowIndex % 2 === 0 ? ROW_STRIPE : WHITE.pdf,
    });

    let cellX = PAGE_MARGIN;
    for (const [columnIndex, lines] of wrappedCells.entries()) {
      for (const [lineIndex, line] of lines.entries()) {
        await drawText(context, page, line, cellX + CELL_PADDING, y - 15 - lineIndex * ROW_LINE_HEIGHT, cellStyle);
      }
      cellX += columns[columnIndex]?.width ?? 0;
    }

    y -= rowHeight;
  }

  const generatedAtLabel = formatReportDateTime(generatedAt);
  pages.forEach((pdfPage, index) => drawPageFooter(context, pdfPage, index + 1, pages.length, generatedAtLabel));

  const pdfBytes = await pdfDocument.save();
  return {
    file: new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" }),
    fileName: fileName.replace(/\.csv$/i, ".pdf"),
  };
}

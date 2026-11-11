import { PDFDocument, StandardFonts, rgb, type PDFImage, type PDFPage, type PDFFont } from "pdf-lib";
import type { ExportedFile } from "../types/registered-user.types";

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const PAGE_MARGIN = 35;
const COLUMN_WIDTHS = [150, 160, 115, 95, 140, 112];
const ROW_LINE_HEIGHT = 10;
const TABLE_HEADER_HEIGHT = 24;
const TABLE_FONT_SIZE = 7.5;
const TEXT_IMAGE_SCALE = 3;
const LOGO_PATHS = ["/icons/umssy-logo-web.svg", "/icons/umss-institutional-seal.svg"];

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

async function loadLogo(document: PDFDocument, path: string): Promise<PDFImage> {
  const response = await fetch(path);
  if (!response.ok) throw new Error("No se pudo cargar el logotipo institucional.");

  const imageUrl = URL.createObjectURL(new Blob([await response.text()], { type: "image/svg+xml" }));
  const image = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("No se pudo preparar el logotipo institucional."));
      image.src = imageUrl;
    });

    const canvas = window.document.createElement("canvas");
    canvas.width = image.naturalWidth || 1200;
    canvas.height = image.naturalHeight || 400;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo preparar el logotipo institucional.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const imageData = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo preparar el logotipo institucional."))), "image/png");
    });

    return document.embedPng(await imageData.arrayBuffer());
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
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

function wrapText(
  value: string,
  width: number,
  measure: (text: string) => number,
): string[] {
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

function canEncodeText(font: PDFFont, value: string): boolean {
  try {
    font.encodeText(value.replace(/\s+/g, " "));
    return true;
  } catch {
    return false;
  }
}

async function drawUnicodeText(document: PDFDocument, page: PDFPage, value: string, x: number, baseline: number) {
  const canvas = window.document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo preparar el texto del reporte.");

  context.font = `${TABLE_FONT_SIZE * TEXT_IMAGE_SCALE}px sans-serif`;
  canvas.width = Math.max(1, Math.ceil(context.measureText(value).width) + 2 * TEXT_IMAGE_SCALE);
  canvas.height = Math.ceil(TABLE_FONT_SIZE * TEXT_IMAGE_SCALE * 1.4);
  context.font = `${TABLE_FONT_SIZE * TEXT_IMAGE_SCALE}px sans-serif`;
  context.fillStyle = "#1f262e";
  context.textBaseline = "top";
  context.fillText(value, TEXT_IMAGE_SCALE, 0);

  const imageData = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo preparar el texto del reporte."))), "image/png");
  });
  const image = await document.embedPng(await imageData.arrayBuffer());
  const height = canvas.height / TEXT_IMAGE_SCALE;
  page.drawImage(image, {
    x: x - 1,
    y: baseline - (height - TABLE_FONT_SIZE),
    width: canvas.width / TEXT_IMAGE_SCALE,
    height,
  });
}

function drawPageHeader(
  page: PDFPage,
  title: string,
  regularFont: PDFFont,
  boldFont: PDFFont,
  logos: PDFImage[],
): number {
  const navy = rgb(0.03, 0.21, 0.36);
  const muted = rgb(0.35, 0.4, 0.45);
  const logo = logos[0];
  const seal = logos[1];
  const logoSize = logo.scale(0.1);
  const sealSize = seal.scale(0.2);

  page.drawImage(logo, {
    x: PAGE_MARGIN,
    y: PAGE_HEIGHT - 68,
    width: Math.min(logoSize.width, 145),
    height: Math.min(logoSize.height, 48),
  });
  page.drawImage(seal, {
    x: PAGE_WIDTH - PAGE_MARGIN - 34,
    y: PAGE_HEIGHT - 76,
    width: Math.min(sealSize.width, 34),
    height: Math.min(sealSize.height, 52),
  });
  page.drawText(title, { x: 205, y: PAGE_HEIGHT - 45, size: 15, font: boldFont, color: navy, maxWidth: 430 });
  page.drawText(`Reporte institucional | Generado ${new Date().toLocaleDateString("es-BO")}`, {
    x: 205,
    y: PAGE_HEIGHT - 63,
    size: 8,
    font: regularFont,
    color: muted,
  });
  page.drawLine({
    start: { x: PAGE_MARGIN, y: PAGE_HEIGHT - 88 },
    end: { x: PAGE_WIDTH - PAGE_MARGIN, y: PAGE_HEIGHT - 88 },
    thickness: 1,
    color: navy,
  });

  return PAGE_HEIGHT - 101 - TABLE_HEADER_HEIGHT;
}

export async function createReportPdf(csvFile: Blob, fileName: string, title: string): Promise<ExportedFile> {
  const rows = parseReportCsv(await csvFile.text());
  const pdfDocument = await PDFDocument.create();
  pdfDocument.setTitle(title);
  pdfDocument.setAuthor("UMSSY");
  pdfDocument.setSubject("Reporte institucional de usuarios");

  const [regularFont, boldFont] = await Promise.all([
    pdfDocument.embedFont(StandardFonts.Helvetica),
    pdfDocument.embedFont(StandardFonts.HelveticaBold),
  ]);
  const logos = await Promise.all(LOGO_PATHS.map((path) => loadLogo(pdfDocument, path)));
  const measurementCanvas = window.document.createElement("canvas");
  const measurementContext = measurementCanvas.getContext("2d");
  if (!measurementContext) throw new Error("No se pudo preparar el texto del reporte.");
  measurementContext.font = `${TABLE_FONT_SIZE * TEXT_IMAGE_SCALE}px sans-serif`;
  const tableHeaders = rows[0] ?? [];
  const dataRows = rows.slice(1);
  const pages: PDFPage[] = [];
  let page = pdfDocument.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pages.push(page);
  let y = drawPageHeader(page, title, regularFont, boldFont, logos);

  page.drawRectangle({
    x: PAGE_MARGIN,
    y: y - 4,
    width: PAGE_WIDTH - PAGE_MARGIN * 2,
    height: TABLE_HEADER_HEIGHT,
    color: rgb(0.03, 0.21, 0.36),
  });

  let x = PAGE_MARGIN;
  tableHeaders.forEach((header, index) => {
    page.drawText(header, { x: x + 5, y: y + 5, size: 7.5, font: boldFont, color: rgb(1, 1, 1), maxWidth: COLUMN_WIDTHS[index] - 10 });
    x += COLUMN_WIDTHS[index] ?? 0;
  });
  y -= 4;

  if (dataRows.length === 0) {
    page.drawText("No hay resultados disponibles para exportar.", {
      x: PAGE_MARGIN + 5,
      y: y - 17,
      size: 10,
      font: regularFont,
      color: rgb(0.35, 0.4, 0.45),
    });
  }

  for (const [rowIndex, dataRow] of dataRows.entries()) {
    const wrappedValues = COLUMN_WIDTHS.map((width, columnIndex) => {
      const value = dataRow[columnIndex] ?? "";
      const useImage = !canEncodeText(regularFont, value);
      const measure = useImage
        ? (text: string) => measurementContext.measureText(text).width / TEXT_IMAGE_SCALE
        : (text: string) => regularFont.widthOfTextAtSize(text, TABLE_FONT_SIZE);
      return { lines: wrapText(value, width - 10, measure), useImage };
    });
    const lineCount = Math.max(1, ...wrappedValues.map(({ lines }) => lines.length));
    const rowHeight = Math.max(24, lineCount * ROW_LINE_HEIGHT + 8);

    if (y - rowHeight < 40) {
      page = pdfDocument.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pages.push(page);
      y = drawPageHeader(page, title, regularFont, boldFont, logos);
      page.drawRectangle({
        x: PAGE_MARGIN,
        y: y - 4,
        width: PAGE_WIDTH - PAGE_MARGIN * 2,
        height: TABLE_HEADER_HEIGHT,
        color: rgb(0.03, 0.21, 0.36),
      });
      x = PAGE_MARGIN;
      tableHeaders.forEach((header, index) => {
        page.drawText(header, { x: x + 5, y: y + 5, size: 7.5, font: boldFont, color: rgb(1, 1, 1), maxWidth: COLUMN_WIDTHS[index] - 10 });
        x += COLUMN_WIDTHS[index] ?? 0;
      });
      y -= 4;
    }

    page.drawRectangle({
      x: PAGE_MARGIN,
      y: y - rowHeight,
      width: PAGE_WIDTH - PAGE_MARGIN * 2,
      height: rowHeight,
      color: rowIndex % 2 === 0 ? rgb(0.96, 0.97, 0.98) : rgb(1, 1, 1),
    });

    let cellX = PAGE_MARGIN;
    for (const [columnIndex, { lines, useImage }] of wrappedValues.entries()) {
      for (const [lineIndex, line] of lines.entries()) {
        const baseline = y - 13 - lineIndex * ROW_LINE_HEIGHT;
        if (useImage && line) {
          // El navegador representa letras que la fuente estándar del PDF no puede codificar.
          await drawUnicodeText(pdfDocument, page, line, cellX + 5, baseline);
        } else {
          page.drawText(line, {
            x: cellX + 5,
            y: baseline,
            size: TABLE_FONT_SIZE,
            font: regularFont,
            color: rgb(0.12, 0.15, 0.18),
            maxWidth: COLUMN_WIDTHS[columnIndex] - 10,
          });
        }
      }
      cellX += COLUMN_WIDTHS[columnIndex] ?? 0;
    }

    y -= rowHeight;
  }

  pages.forEach((pdfPage, index) => {
    pdfPage.drawText(`Página ${index + 1} de ${pages.length}`, {
      x: PAGE_WIDTH - PAGE_MARGIN - 85,
      y: 20,
      size: 8,
      font: regularFont,
      color: rgb(0.35, 0.4, 0.45),
    });
  });

  const pdfBytes = await pdfDocument.save();
  return {
    file: new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" }),
    fileName: fileName.replace(/\.csv$/i, ".pdf"),
  };
}
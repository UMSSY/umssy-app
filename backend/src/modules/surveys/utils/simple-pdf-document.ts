import {
  PDF_BOLD_CHAR_WIDTH_RATIO,
  PDF_DEFAULT_FONT_SIZE,
  PDF_DEFAULT_TEXT_COLOR,
  PDF_PAGE_HEIGHT,
  PDF_PAGE_WIDTH,
  PDF_REGULAR_CHAR_WIDTH_RATIO,
} from '../constants/survey-pdf.constants.js';
import type { PdfTextOptions } from '../types/pdf-text-options.type.js';

export class SimplePdfDocument {
  private pages: string[][] = [[]];
  private curPage = 0;
  readonly pageW = PDF_PAGE_WIDTH;
  readonly pageH = PDF_PAGE_HEIGHT;

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
        const norm = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
        if (norm.length === 1 && norm.charCodeAt(0) >= 32 && norm.charCodeAt(0) <= 126) {
          res += norm;
        } else {
          res += '?';
        }
      }
    }
    return res;
  }

  private charWidth(fontSize: number, isBold: boolean): number {
    return fontSize * (isBold ? PDF_BOLD_CHAR_WIDTH_RATIO : PDF_REGULAR_CHAR_WIDTH_RATIO);
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

  text(str: string, x: number, y: number, opts: PdfTextOptions = {}) {
    const fontSize = opts.fontSize ?? PDF_DEFAULT_FONT_SIZE;
    const font = opts.font ?? 'Helvetica';
    const fontRef = font === 'Helvetica-Bold' ? '/F2' : '/F1';
    const [r, g, b] = this.hexToRgb(opts.color ?? PDF_DEFAULT_TEXT_COLOR);
    const safeStr = this.escapeWinAnsi(str);

    let drawX = x;
    const textW = str.length * this.charWidth(fontSize, font === 'Helvetica-Bold');

    if (opts.align === 'right' && opts.width) {
      drawX = x + opts.width - textW;
    }

    const pdfY = this.pageH - y - fontSize * 0.82;
    const cmd = `BT ${fontRef} ${fontSize} Tf ${r} ${g} ${b} rg 1 0 0 1 ${drawX.toFixed(2)} ${pdfY.toFixed(2)} Tm (${safeStr}) Tj ET\n`;
    this.pages[this.curPage].push(cmd);
  }

  wrapText(text: string, maxWidth: number, fontSize: number, isBold = false): string[] {
    const approxCharW = this.charWidth(fontSize, isBold);
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

    addObj('<< /Type /Catalog /Pages 2 0 R >>');
    addObj('');
    addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
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

    objs[1] = `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjIds.length} >>`;

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

import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import * as mupdf from 'mupdf';
import { createWorker, type Worker } from 'tesseract.js';
import type { FileContent } from '../../files/types/file.types.js';
import {
  MIN_PDF_TEXT_LENGTH,
  OCR_CACHE_PATH,
  OCR_ENGINE_MODE,
  OCR_LANGUAGE,
  PDF_MIME_TYPE,
  PDF_RENDER_SCALE,
  PDF_TEXT_CONFIDENCE,
} from '../constants/document-reading.constants.js';
import type { DocumentText } from '../types/document-text.types.js';

@Injectable()
export class DocumentTextExtractorService implements OnModuleDestroy {
  private worker: Promise<Worker> | null = null;

  async extract(file: FileContent): Promise<DocumentText> {
    if (file.mimeType === PDF_MIME_TYPE) {
      const embedded = this.readPdfText(file.content);
      if (embedded.replace(/\s/g, '').length >= MIN_PDF_TEXT_LENGTH) {
        return { text: embedded, confidence: PDF_TEXT_CONFIDENCE };
      }
      // PDF escaneado: la primera página se convierte en imagen y se lee con OCR
      return this.recognize(this.renderFirstPage(file.content));
    }
    return this.recognize(file.content);
  }

  async onModuleDestroy() {
    if (this.worker) await (await this.worker).terminate();
  }

  private readPdfText(content: Buffer): string {
    const document = mupdf.Document.openDocument(content, PDF_MIME_TYPE);
    const pages: string[] = [];
    for (let index = 0; index < document.countPages(); index += 1) {
      pages.push(document.loadPage(index).toStructuredText('preserve-whitespace').asText());
    }
    return pages.join('\n');
  }

  private renderFirstPage(content: Buffer): Buffer {
    const document = mupdf.Document.openDocument(content, PDF_MIME_TYPE);
    const matrix = mupdf.Matrix.scale(PDF_RENDER_SCALE, PDF_RENDER_SCALE);
    const pixmap = document.loadPage(0).toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
    return Buffer.from(pixmap.asPNG());
  }

  private async recognize(image: Buffer): Promise<DocumentText> {
    // El motor se crea una sola vez y se reutiliza en las siguientes lecturas
    this.worker ??= createWorker(OCR_LANGUAGE, OCR_ENGINE_MODE, { cachePath: OCR_CACHE_PATH });
    const { data } = await (await this.worker).recognize(image);
    return { text: data.text, confidence: data.confidence / 100 };
  }
}


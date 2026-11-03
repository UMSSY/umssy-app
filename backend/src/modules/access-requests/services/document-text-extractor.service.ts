import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import * as mupdf from 'mupdf';
import type { Worker } from 'tesseract.js';
import { createTesseractWorker } from '../../../common/ocr/tesseract-ocr.js';
import type { FileContent } from '../../files/types/file.types.js';
import { OCR_LANGUAGE, OCR_TESSERACT_MODEL, PDF_MIME_TYPE, PDF_RENDER_SCALE } from '../constants/document-reading.constants.js';
import type { DocumentText, DocumentTextRegion } from '../types/document-text.types.js';

/** Tesseract informa la confianza de 0 a 100; el resto del flujo trabaja de 0 a 1. */
const toUnitConfidence = (value: number) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value / 100)) : 0);

@Injectable()
export class DocumentTextExtractorService implements OnModuleDestroy {
  private tesseractWorker: Promise<Worker> | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private closing = false;

  extract(file: FileContent): Promise<DocumentText> {
    if (this.closing) return Promise.reject(new Error('OCR service is shutting down'));
    const job = this.queue.then(async () => {
      const worker = await this.getTesseractWorker();
      try {
        return file.mimeType === PDF_MIME_TYPE
          ? await this.recognizePdf(worker, file.content)
          : await this.recognizeImage(worker, file.content);
      } catch (error) {
        this.tesseractWorker = null;
        await worker.terminate().catch(() => undefined);
        throw error;
      }
    });
    this.queue = job.then(() => undefined, () => undefined);
    return job;
  }

  async onModuleDestroy() {
    this.closing = true;
    await this.queue;
    const pending = this.tesseractWorker;
    this.tesseractWorker = null;
    if (pending) await (await pending).terminate();
  }

  private async getTesseractWorker(): Promise<Worker> {
    this.tesseractWorker ??= createTesseractWorker(OCR_TESSERACT_MODEL, [OCR_LANGUAGE]);
    try {
      return await this.tesseractWorker;
    } catch (cause) {
      this.tesseractWorker = null;
      throw new Error('Tesseract initialization failed: check the OCR models (pnpm ocr:models) and OCR_MODEL_DIR', { cause });
    }
  }

  private async recognizeImage(worker: Worker, content: Buffer): Promise<DocumentText> {
    const image = new mupdf.Image(content);
    try {
      const source = image.toPixmap();
      try {
        const rgb = source.convertToColorSpace(mupdf.ColorSpace.DeviceRGB, false);
        try {
          return await this.recognizePixmap(worker, rgb, 1);
        } finally {
          if (rgb !== source) rgb.destroy();
        }
      } finally {
        source.destroy();
      }
    } finally {
      image.destroy();
    }
  }

  private async recognizePdf(worker: Worker, content: Buffer): Promise<DocumentText> {
    const document = mupdf.Document.openDocument(content, PDF_MIME_TYPE);
    const pages: DocumentText[] = [];
    try {
      // Render every page, including mixed PDFs: embedded headers must not hide scanned names.
      for (let index = 0; index < document.countPages(); index += 1) {
        const page = document.loadPage(index);
        try {
          const pixmap = page.toPixmap(
            mupdf.Matrix.scale(PDF_RENDER_SCALE, PDF_RENDER_SCALE),
            mupdf.ColorSpace.DeviceRGB, false, true,
          );
          try {
            pages.push(await this.recognizePixmap(worker, pixmap, index + 1));
          } finally {
            pixmap.destroy();
          }
        } finally {
          page.destroy();
        }
      }
    } finally {
      document.destroy();
    }
    const nonempty = pages.filter((page) => page.text.trim());
    return {
      engine: 'tesseract',
      text: pages.map((page) => page.text).join('\n'),
      confidence: nonempty.length ? Math.min(...nonempty.map((page) => page.confidence)) : 0,
      regions: pages.flatMap((page) => page.regions ?? []),
    };
  }

  private async recognizePixmap(worker: Worker, pixmap: mupdf.Pixmap, page: number): Promise<DocumentText> {
    // Tesseract no lee píxeles crudos: se le entrega la página renderizada como PNG.
    const png = Buffer.from(pixmap.asPNG());
    const { data } = await worker.recognize(png, {}, { text: true, blocks: true });
    const regions: DocumentTextRegion[] = (data.blocks ?? [])
      .flatMap((block) => block.paragraphs ?? [])
      .flatMap((paragraph) => paragraph.lines ?? [])
      .filter((line) => line.text.trim())
      .map((line) => ({
        text: line.text.trim(),
        confidence: toUnitConfidence(line.confidence),
        page,
        box: { x: line.bbox.x0, y: line.bbox.y0, width: line.bbox.x1 - line.bbox.x0, height: line.bbox.y1 - line.bbox.y0 },
      }));
    return { engine: 'tesseract', text: data.text, confidence: toUnitConfidence(data.confidence), regions };
  }
}

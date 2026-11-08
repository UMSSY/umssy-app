import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import * as mupdf from 'mupdf';
import { PSM, type Worker } from 'tesseract.js';
import { createTesseractWorker } from '../../../common/ocr/tesseract-ocr.js';
import type { FileContent } from '../../files/types/file.types.js';
import type { DocumentText, DocumentTextRegion } from '../types/document-text.types.js';

const TESSERACT_CONFIDENCE_MAX = 100;
const PAGE_SEGMENTATION_KEEPING_HEADINGS = PSM.AUTO;

const toUnitConfidence = (percent: number) =>
  Number.isFinite(percent) ? Math.min(1, Math.max(0, percent / TESSERACT_CONFIDENCE_MAX)) : 0;

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
        return file.mimeType === 'application/pdf'
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
    this.tesseractWorker ??= this.createWorker();
    try {
      return await this.tesseractWorker;
    } catch (cause) {
      this.tesseractWorker = null;
      throw new Error('Tesseract initialization failed: check the OCR models (pnpm ocr:models) and OCR_MODEL_DIR', { cause });
    }
  }

  private async createWorker(): Promise<Worker> {
    const worker = await createTesseractWorker('4.0.0_best', ['spa']);
    try {
      await worker.setParameters({ tessedit_pageseg_mode: PAGE_SEGMENTATION_KEEPING_HEADINGS });
    } catch (error) {
      await worker.terminate().catch(() => undefined);
      throw error;
    }
    return worker;
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
    const document = mupdf.Document.openDocument(content, 'application/pdf');
    const pages: DocumentText[] = [];
    try {
      for (let index = 0; index < document.countPages(); index += 1) {
        const page = document.loadPage(index);
        try {
          const pixmap = page.toPixmap(
            mupdf.Matrix.scale(2, 2),
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

import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import * as mupdf from 'mupdf';
import type { PaddleOcrService } from 'paddleocr';
import { createPaddleWorker, recognizeWithPaddle } from '../../../common/ocr/paddle-ocr.js';
import type { FileContent } from '../../files/types/file.types.js';
import {
  PADDLE_DETECTION_MODEL, PADDLE_DICTIONARY, PADDLE_PRESET,
  PADDLE_RECOGNITION_MODEL, PDF_MIME_TYPE, PDF_RENDER_SCALE,
} from '../constants/document-reading.constants.js';
import type { DocumentText } from '../types/document-text.types.js';

@Injectable()
export class DocumentTextExtractorService implements OnModuleDestroy {
  private paddleWorker: Promise<PaddleOcrService> | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private closing = false;

  extract(file: FileContent): Promise<DocumentText> {
    if (this.closing) return Promise.reject(new Error('OCR service is shutting down'));
    const job = this.queue.then(async () => {
      if (process.env.OCR_ENGINE && process.env.OCR_ENGINE !== 'paddle') {
        throw new Error('This document flow requires OCR_ENGINE=paddle');
      }
      const worker = await this.getPaddleWorker();
      try {
        return file.mimeType === PDF_MIME_TYPE
          ? await this.recognizePdf(worker, file.content)
          : await this.recognizeImage(worker, file.content);
      } catch (error) {
        this.paddleWorker = null;
        await worker.destroy().catch(() => undefined);
        throw error;
      }
    });
    this.queue = job.then(() => undefined, () => undefined);
    return job;
  }

  async onModuleDestroy() {
    this.closing = true;
    await this.queue;
    const pending = this.paddleWorker;
    this.paddleWorker = null;
    if (pending) await (await pending).destroy();
  }

  private async getPaddleWorker(): Promise<PaddleOcrService> {
    this.paddleWorker ??= createPaddleWorker({
      detection: PADDLE_DETECTION_MODEL,
      recognition: PADDLE_RECOGNITION_MODEL,
      dictionary: PADDLE_DICTIONARY,
      preset: PADDLE_PRESET,
    });
    try {
      return await this.paddleWorker;
    } catch (cause) {
      this.paddleWorker = null;
      throw new Error('PaddleOCR initialization failed: check models and ONNX Runtime', { cause });
    }
  }

  private async recognizeImage(worker: PaddleOcrService, content: Buffer): Promise<DocumentText> {
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

  private async recognizePdf(worker: PaddleOcrService, content: Buffer): Promise<DocumentText> {
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
      engine: 'paddle',
      text: pages.map((page) => page.text).join('\n'),
      confidence: nonempty.length ? Math.min(...nonempty.map((page) => page.confidence)) : 0,
      regions: pages.flatMap((page) => page.regions ?? []),
    };
  }

  private async recognizePixmap(worker: PaddleOcrService, pixmap: mupdf.Pixmap, page: number): Promise<DocumentText> {
    const result = await recognizeWithPaddle(worker, {
      width: pixmap.getWidth(), height: pixmap.getHeight(),
      data: Uint8Array.from(pixmap.getPixels()),
    });
    return { ...result, engine: 'paddle', regions: result.regions.map((region) => ({ ...region, page })) };
  }
}

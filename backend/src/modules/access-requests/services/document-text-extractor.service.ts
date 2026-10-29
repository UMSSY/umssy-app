import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import * as mupdf from 'mupdf';
import type { PaddleOcrService } from 'paddleocr';
import { createWorker, type Worker } from 'tesseract.js';
import { createPaddleWorker, recognizeWithPaddle } from '../../../common/ocr/paddle-ocr.js';
import type { FileContent } from '../../files/types/file.types.js';
import {
  MIN_PDF_TEXT_LENGTH,
  OCR_TESSERACT_MODEL_PATH,
  OCR_ENGINE_MODE,
  OCR_LANGUAGE,
  PADDLE_DETECTION_MODEL,
  PADDLE_DICTIONARY,
  PADDLE_PRESET,
  PADDLE_RECOGNITION_MODEL,
  PDF_MIME_TYPE,
  PDF_RENDER_SCALE,
  PDF_TEXT_CONFIDENCE,
} from '../constants/document-reading.constants.js';
import type { DocumentText } from '../types/document-text.types.js';

@Injectable()
export class DocumentTextExtractorService implements OnModuleDestroy {
  private readonly logger = new Logger(DocumentTextExtractorService.name);
  private paddleWorker: Promise<PaddleOcrService | null> | null = null;
  private tesseractWorker: Promise<Worker> | null = null;
  private tesseractQueue: Promise<unknown> = Promise.resolve();

  async extract(file: FileContent): Promise<DocumentText> {
    if (file.mimeType === PDF_MIME_TYPE) {
      const embedded = this.readPdfText(file.content);
      if (embedded.replace(/\s/g, '').length >= MIN_PDF_TEXT_LENGTH) {
        return { text: embedded, confidence: PDF_TEXT_CONFIDENCE };
      }
      // PDF escaneado: la primera página se convierte en imagen y se lee con OCR
      return this.recognizePdfPage(file.content);
    }
    return this.recognizeImage(file.content);
  }

  async onModuleDestroy() {
    if (this.paddleWorker) {
      try {
        const paddle = await this.paddleWorker;
        await paddle?.destroy?.();
      } catch (error) {
        this.logger.warn(`Error al destruir worker de PaddleOCR: ${(error as Error).message}`);
      }
    }
    if (this.tesseractWorker) {
      try {
        const tesseract = await this.tesseractWorker;
        await tesseract.terminate();
      } catch (error) {
        this.logger.warn(`Error al destruir worker de Tesseract: ${(error as Error).message}`);
      }
    }
  }

  private readPdfText(content: Buffer): string {
    const document = mupdf.Document.openDocument(content, PDF_MIME_TYPE);
    const pages: string[] = [];
    for (let index = 0; index < document.countPages(); index += 1) {
      pages.push(document.loadPage(index).toStructuredText('preserve-whitespace').asText());
    }
    return pages.join('\n');
  }

  private async recognizeImage(imageBuffer: Buffer): Promise<DocumentText> {
    const paddle = await this.getPaddleWorker();
    if (paddle) {
      try {
        const image = new mupdf.Image(imageBuffer);
        const pixmap = image.toPixmap().convertToColorSpace(mupdf.ColorSpace.DeviceRGB, false);
        return await recognizeWithPaddle(paddle, {
          width: pixmap.getWidth(),
          height: pixmap.getHeight(),
          data: pixmap.getPixels(),
        });
      } catch (error) {
        this.logger.warn(`PaddleOCR falló en imagen, aplicando fallback a Tesseract: ${(error as Error).message}`);
      }
    }
    return this.recognizeWithTesseract(imageBuffer);
  }

  private async recognizePdfPage(content: Buffer): Promise<DocumentText> {
    const document = mupdf.Document.openDocument(content, PDF_MIME_TYPE);
    const matrix = mupdf.Matrix.scale(PDF_RENDER_SCALE, PDF_RENDER_SCALE);
    const pixmap = document.loadPage(0).toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);

    const paddle = await this.getPaddleWorker();
    if (paddle) {
      try {
        const rgbPixmap = pixmap.convertToColorSpace(mupdf.ColorSpace.DeviceRGB, false);
        return await recognizeWithPaddle(paddle, {
          width: rgbPixmap.getWidth(),
          height: rgbPixmap.getHeight(),
          data: rgbPixmap.getPixels(),
        });
      } catch (error) {
        this.logger.warn(`PaddleOCR falló en página PDF, aplicando fallback a Tesseract: ${(error as Error).message}`);
      }
    }
    return this.recognizeWithTesseract(Buffer.from(pixmap.asPNG()));
  }

  private async getPaddleWorker(): Promise<PaddleOcrService | null> {
    if (process.env.OCR_ENGINE === 'tesseract') return null;
    if (this.paddleWorker !== null) {
      return this.paddleWorker;
    }

    this.paddleWorker = (async () => {
      try {
        const [detExists, recExists, dictExists] = await Promise.all([
          this.fileExists(PADDLE_DETECTION_MODEL),
          this.fileExists(PADDLE_RECOGNITION_MODEL),
          this.fileExists(PADDLE_DICTIONARY),
        ]);

        if (!detExists || !recExists || !dictExists) {
          this.logger.log('Modelos de PaddleOCR no encontrados localmente. Se usará Tesseract como fallback.');
          return null;
        }

        return await createPaddleWorker({
          detection: PADDLE_DETECTION_MODEL,
          recognition: PADDLE_RECOGNITION_MODEL,
          dictionary: PADDLE_DICTIONARY,
          preset: PADDLE_PRESET,
        });
      } catch (error) {
        this.logger.warn(`No se pudo inicializar PaddleOCR: ${(error as Error).message}. Se usará Tesseract.`);
        return null;
      }
    })();

    return this.paddleWorker;
  }

  private recognizeWithTesseract(image: Buffer): Promise<DocumentText> {
    const job = this.tesseractQueue.then(async () => {
      this.tesseractWorker ??= this.createTesseractWorker();
      try {
        const { data } = await (await this.tesseractWorker).recognize(image);
        return { text: data.text, confidence: data.confidence / 100 };
      } catch (error) {
        const failedWorker = this.tesseractWorker;
        this.tesseractWorker = null;
        if (failedWorker) await failedWorker.then((worker) => worker.terminate(), () => undefined).catch(() => undefined);
        throw error;
      }
    });
    this.tesseractQueue = job.then(() => undefined, () => undefined);
    return job;
  }

  private async createTesseractWorker(): Promise<Worker> {
    await access(join(OCR_TESSERACT_MODEL_PATH, OCR_LANGUAGE + '.traineddata'));
    return createWorker(OCR_LANGUAGE, OCR_ENGINE_MODE, {
      langPath: OCR_TESSERACT_MODEL_PATH,
      gzip: false,
      cacheMethod: 'none',
    });
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }
}

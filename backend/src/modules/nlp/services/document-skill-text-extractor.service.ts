import { createHash } from 'node:crypto';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Injectable } from '@nestjs/common';
import { createWorker, OEM, type Worker } from 'tesseract.js';
import { NLP_DOCUMENT_LIMITS, NLP_DOCUMENT_MIME_TYPES, NLP_DOCUMENT_READ_ERROR, NLP_OCR_LANGUAGES, NLP_OCR_MODEL, NLP_OCR_MODEL_DIRECTORY } from '../constants/nlp-document.constants.js';
import { NLP_SOURCE_TEXT_MAX_LENGTH } from '../constants/nlp-validation.constants.js';

@Injectable()
export class DocumentSkillTextExtractorService {
  private queue: Promise<unknown> = Promise.resolve();
  private queued = 0;
  private readonly texts = new Map<string, string>();

  async extract(content: Buffer, mimeType: string): Promise<string> {
    if (!content.length || content.length > NLP_DOCUMENT_LIMITS.maxBytes || !NLP_DOCUMENT_MIME_TYPES.has(mimeType)) {
      throw new Error(NLP_DOCUMENT_READ_ERROR);
    }
    const key = createHash('sha256').update(mimeType).update(content).digest('hex');
    const cached = this.texts.get(key);
    if (cached !== undefined) return cached;
    if (this.queued >= NLP_DOCUMENT_LIMITS.maxQueuedExtractions) throw new Error(NLP_DOCUMENT_READ_ERROR);
    this.queued += 1;
    const job = this.queue.then(async () => {
      const existing = this.texts.get(key);
      if (existing !== undefined) return existing;
      const text = await this.read(content, mimeType);
      if (text.length > NLP_SOURCE_TEXT_MAX_LENGTH) throw new Error(NLP_DOCUMENT_READ_ERROR);
      if (this.texts.size >= NLP_DOCUMENT_LIMITS.maxCachedTexts) this.texts.delete(this.texts.keys().next().value!);
      this.texts.set(key, text);
      return text;
    });
    this.queue = job.then(() => undefined, () => undefined);
    try { return await job; } finally { this.queued -= 1; }
  }

  private async read(content: Buffer, mimeType: string): Promise<string> {
    const mupdf = await import('mupdf');
    const deadline = Date.now() + NLP_DOCUMENT_LIMITS.timeoutMs;
    if (mimeType !== 'application/pdf') {
      const image = new mupdf.Image(content);
      try { this.checkPixels(image.getWidth(), image.getHeight()); }
      finally { image.destroy(); }
      return this.ocr(content, deadline);
    }

    const document = mupdf.Document.openDocument(content, mimeType);
    try {
      if (document.needsPassword() || document.countPages() > NLP_DOCUMENT_LIMITS.maxPages) throw new Error(NLP_DOCUMENT_READ_ERROR);
      let text = '';
      for (let index = 0; index < document.countPages(); index += 1) {
        if (Date.now() >= deadline) throw new Error(NLP_DOCUMENT_READ_ERROR);
        const page = document.loadPage(index);
        try {
          const structured = page.toStructuredText('preserve-images');
          let embedded = '';
          let hasImages = false;
          try {
            embedded = structured.asText();
            structured.walk({ onImageBlock: () => { hasImages = true; } });
          } finally { structured.destroy(); }
          text += `${embedded}\n`;
          // Image blocks may contain skills even when a PDF also has a text header.
          if (!embedded.trim() || hasImages) {
            const [x0, y0, x1, y1] = page.getBounds();
            const scale = NLP_DOCUMENT_LIMITS.renderScale;
            this.checkPixels(Math.ceil((x1 - x0) * scale), Math.ceil((y1 - y0) * scale));
            const pixmap = page.toPixmap(mupdf.Matrix.scale(scale, scale), mupdf.ColorSpace.DeviceRGB, false, true);
            try { text += `${await this.ocr(Buffer.from(pixmap.asPNG()), deadline)}\n`; }
            finally { pixmap.destroy(); }
          }
          if (text.length > NLP_SOURCE_TEXT_MAX_LENGTH) throw new Error(NLP_DOCUMENT_READ_ERROR);
        } finally { page.destroy(); }
      }
      if (!text.trim()) throw new Error(NLP_DOCUMENT_READ_ERROR);
      return text;
    } finally { document.destroy(); }
  }

  private checkPixels(width: number, height: number): void {
    if (!Number.isFinite(width * height) || width <= 0 || height <= 0 || width * height > NLP_DOCUMENT_LIMITS.maxPixels) {
      throw new Error(NLP_DOCUMENT_READ_ERROR);
    }
  }

  private async ocr(content: Buffer, deadline: number): Promise<string> {
    const langPath = resolve(process.env.OCR_MODEL_DIR ?? NLP_OCR_MODEL_DIRECTORY, NLP_OCR_MODEL);
    await Promise.all(NLP_OCR_LANGUAGES.map((language) => access(resolve(langPath, `${language}.traineddata`))));
    let worker: Worker | undefined;
    let expired = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => { expired = true; reject(new Error(NLP_DOCUMENT_READ_ERROR)); }, Math.max(0, deadline - Date.now()));
    });
    const task = (async () => {
      const created = await createWorker(NLP_OCR_LANGUAGES, OEM.LSTM_ONLY, {
        langPath,
        gzip: false,
        cacheMethod: 'none',
        // Jobs already reject their promises; suppress Tesseract's additional uncaught throw.
        errorHandler: () => undefined,
      });
      if (expired) { await created.terminate(); throw new Error(NLP_DOCUMENT_READ_ERROR); }
      worker = created;
      const { data } = await worker.recognize(content);
      if (!data.text.trim()) throw new Error(NLP_DOCUMENT_READ_ERROR);
      return data.text;
    })();
    try { return await Promise.race([task, timeout]); }
    finally {
      clearTimeout(timer);
      if (worker) await worker.terminate();
    }
  }
}

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as mupdf from 'mupdf';
import { DocumentSkillTextExtractorService } from '../services/document-skill-text-extractor.service.js';

const models = resolve(process.env.OCR_MODEL_DIR ?? 'ocr-models', 'default');
const hasModels = ['spa', 'eng'].every((language) => existsSync(resolve(models, `${language}.traineddata`)));

describe.skipIf(!hasModels)('Document OCR with real local models (no database)', () => {
  it('recognizes skills in PNG, JPEG and a scanned PDF with no embedded text', async () => {
    const source = new mupdf.PDFDocument();
    const font = new mupdf.Font('Helvetica');
    const fontRef = source.addSimpleFont(font);
    const pageRef = source.addPage([0, 0, 600, 200], 0, { Font: { F1: fontRef } }, 'BT /F1 32 Tf 30 100 Td (Python Docker React) Tj ET');
    source.insertPage(-1, pageRef);
    const page = source.loadPage(0);
    const pixmap = page.toPixmap(mupdf.Matrix.scale(2, 2), mupdf.ColorSpace.DeviceRGB, false, true);
    const scanned = new mupdf.PDFDocument();
    const image = new mupdf.Image(pixmap);
    const imageRef = scanned.addImage(image);
    const scannedRef = scanned.addPage([0, 0, 600, 200], 0, { XObject: { Im1: imageRef } }, 'q 600 0 0 200 0 0 cm /Im1 Do Q');
    scanned.insertPage(-1, scannedRef);
    const pdf = scanned.saveToBuffer({});
    try {
      const extractor = new DocumentSkillTextExtractorService();
      for (const [mime, content] of [
        ['image/png', pixmap.asPNG()],
        ['image/jpeg', pixmap.asJPEG(90)],
        ['application/pdf', pdf.asUint8Array()],
      ] as const) {
        const text = await extractor.extract(Buffer.from(content), mime);
        expect(text).toMatch(/Python/);
        expect(text).toMatch(/Docker/);
        expect(text).toMatch(/React/);
      }
    } finally {
      pdf.destroy(); scannedRef.destroy(); imageRef.destroy(); image.destroy(); scanned.destroy();
      pixmap.destroy(); page.destroy(); pageRef.destroy(); fontRef.destroy(); font.destroy(); source.destroy();
    }
  }, 90_000);
});

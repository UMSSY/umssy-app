import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWorker, OEM, type ImageLike } from 'tesseract.js';

export type TesseractModel = 'default' | '4.0.0_best';

function resolveModelDir(model: TesseractModel): string {
  const currentDir =
    typeof __dirname !== 'undefined'
      ? __dirname
      : dirname(fileURLToPath(import.meta.url));

  const candidates = [
    process.env.OCR_MODEL_DIR
      ? resolve(process.env.OCR_MODEL_DIR, model)
      : null,
    process.env.OCR_MODEL_DIR ? resolve(process.env.OCR_MODEL_DIR) : null,
    resolve(process.cwd(), 'ocr-models', model),
    resolve(process.cwd(), 'backend', 'ocr-models', model),
    resolve(process.cwd(), 'umssy-app', 'backend', 'ocr-models', model),
    resolve(currentDir, '../../../ocr-models', model),
    resolve(currentDir, '../../ocr-models', model),
    resolve(currentDir, '../../../../ocr-models', model),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return resolve(process.env.OCR_MODEL_DIR ?? 'ocr-models', model);
}

export async function createTesseractWorker(
  model: TesseractModel = 'default',
  languages: string[] = ['spa'],
) {
  if (!['default', '4.0.0_best'].includes(model)) {
    throw new Error(`Unsupported Tesseract model: ${model}`);
  }

  const langPath = resolveModelDir(model);
  const availableLangs = languages.filter((lang) => {
    const file = resolve(langPath, `${lang}.traineddata`);
    return existsSync(file);
  });
  const effectiveLanguages =
    availableLangs.length > 0 ? availableLangs : languages;

  return createWorker(effectiveLanguages, OEM.LSTM_ONLY, {
    langPath,
    gzip: false,
    cacheMethod: 'none',
  });
}

export async function recognizeWithTesseract(
  image: ImageLike,
  model: TesseractModel = 'default',
  languages: string[] = ['spa'],
) {
  const worker = await createTesseractWorker(model, languages);
  try {
    const { data } = await worker.recognize(image);
    return { text: data.text, confidence: data.confidence, model };
  } finally {
    await worker.terminate();
  }
}

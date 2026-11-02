import { createWorker, OEM } from 'tesseract.js';
import { resolve } from 'node:path';

for (const model of ['default', '4.0.0_best']) {
  const worker = await createWorker(['spa', 'eng'], OEM.LSTM_ONLY, {
    langPath: resolve(process.env.OCR_MODEL_DIR ?? 'ocr-models', model),
    gzip: false,
    cacheMethod: 'none',
  });
  try {
    if (process.argv[2]) {
      const { data } = await worker.recognize(process.argv[2]);
      console.log(
        JSON.stringify({ model, text: data.text, confidence: data.confidence }),
      );
    } else {
      console.log(`${model}: Spanish and English models initialized`);
    }
  } finally {
    await worker.terminate();
  }
}

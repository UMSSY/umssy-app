import { mkdir, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

const root = resolve(process.env.OCR_MODEL_DIR ?? 'ocr-models');

async function exists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// Tesseract models
for (const model of ['default', '4.0.0_best']) {
  await mkdir(resolve(root, model), { recursive: true });
  for (const language of ['spa', 'eng']) {
    const dest = resolve(root, model, `${language}.traineddata`);
    if (await exists(dest)) {
      console.log(`${model}/${language}: already present`);
      continue;
    }
    const url =
      model === 'default'
        ? `https://cdn.jsdelivr.net/npm/@tesseract.js-data/${language}@1.0.0/4.0.0_best_int/${language}.traineddata.gz`
        : `https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0_best/${language}.traineddata.gz`;
    const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
    if (!response.ok)
      throw new Error(`Model download failed: ${response.status} ${url}`);
    const data = gunzipSync(Buffer.from(await response.arrayBuffer()));
    await writeFile(dest, data);
    console.log(`${model}/${language}: ${data.length} bytes`);
  }
}

// PaddleOCR models
const paddleDir = resolve(root, 'paddle');
await mkdir(paddleDir, { recursive: true });
const PADDLE_BASE =
  'https://huggingface.co/x3zvawq/paddleocr-js-onnx/resolve/main/ppocr_v5_mobile/';
const paddleFiles = [
  'PP-OCRv5_mobile_det_infer.onnx',
  'PP-OCRv5_mobile_rec_infer.onnx',
  'ppocrv5_dict.txt',
];

for (const file of paddleFiles) {
  const dest = resolve(paddleDir, file);
  if (await exists(dest)) {
    console.log(`paddle/${file}: already present`);
    continue;
  }
  const url = `${PADDLE_BASE}${file}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!response.ok)
    throw new Error(`Paddle model download failed: ${response.status} ${url}`);
  const data = Buffer.from(await response.arrayBuffer());
  await writeFile(dest, data);
  console.log(`paddle/${file}: ${data.length} bytes`);
}

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

const root = resolve(process.env.OCR_MODEL_DIR ?? 'ocr-models');
for (const model of ['default', '4.0.0_best']) {
  await mkdir(resolve(root, model), { recursive: true });
  for (const language of ['spa', 'eng']) {
    const url =
      model === 'default'
        ? `https://cdn.jsdelivr.net/npm/@tesseract.js-data/${language}@1.0.0/4.0.0_best_int/${language}.traineddata.gz`
        : `https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0_best/${language}.traineddata.gz`;
    const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
    if (!response.ok)
      throw new Error(`Model download failed: ${response.status} ${url}`);
    const data = gunzipSync(Buffer.from(await response.arrayBuffer()));
    await writeFile(resolve(root, model, `${language}.traineddata`), data);
    console.log(`${model}/${language}: ${data.length} bytes`);
  }
}

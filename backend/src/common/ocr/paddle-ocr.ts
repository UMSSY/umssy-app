import { readFile } from 'node:fs/promises';
import {
  PaddleOcrService,
  type OrtModule,
  type PaddleOcrModelPresetName,
} from 'paddleocr';

export interface PaddleModelFiles {
  detection: string;
  recognition: string;
  dictionary: string;
  preset: PaddleOcrModelPresetName;
}

export interface PaddleOcrInput {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
}

export async function createPaddleWorker(files: PaddleModelFiles) {
  const ort = await import('onnxruntime-node').catch((cause: unknown) => {
    throw new Error(
      'PaddleOCR requires onnxruntime-node on a supported platform; node:22-alpine is not supported. Use Tesseract or a glibc image.',
      { cause },
    );
  });
  const [detection, recognition, dictionary] = await Promise.all([
    readFile(files.detection),
    readFile(files.recognition),
    readFile(files.dictionary, 'utf8'),
  ]);

  const dictLines = dictionary.trimEnd().split(/\r?\n/);
  // Cuando el diccionario empieza con blank/vacío y useSpaceChar está activo,
  // se añade el espacio al final para cumplir con el número de clases esperadas.
  if (dictLines[0] === '' && dictLines.length === 18384) {
    dictLines.push(' ');
  }

  return PaddleOcrService.createInstance({
    ort: ort as unknown as OrtModule,
    modelPreset: files.preset,
    detection: { modelBuffer: Uint8Array.from(detection).buffer },
    recognition: {
      modelBuffer: Uint8Array.from(recognition).buffer,
      charactersDictionary: dictLines,
    },
  });
}

export async function recognizeWithPaddle(
  worker: PaddleOcrService,
  input: PaddleOcrInput,
): Promise<{ text: string; confidence: number }> {
  const data =
    input.data instanceof Uint8Array && !(input.data instanceof Uint8ClampedArray)
      ? input.data
      : new Uint8Array(
          input.data.buffer,
          input.data.byteOffset,
          input.data.byteLength,
        );

  const results = await worker.recognize({
    width: input.width,
    height: input.height,
    data,
  });
  const text = results.map((item) => item.text).filter(Boolean).join('\n');
  const confidence =
    results.length > 0
      ? results.reduce((sum, item) => sum + item.confidence, 0) / results.length
      : 0;
  return { text, confidence };
}

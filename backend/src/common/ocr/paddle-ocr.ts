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
  return PaddleOcrService.createInstance({
    ort: ort as unknown as OrtModule,
    modelPreset: files.preset,
    detection: { modelBuffer: Uint8Array.from(detection).buffer },
    recognition: {
      modelBuffer: Uint8Array.from(recognition).buffer,
      charactersDictionary: dictionary.trimEnd().split(/\r?\n/),
    },
  });
}

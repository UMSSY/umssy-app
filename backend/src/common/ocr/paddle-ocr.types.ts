import type { PaddleOcrModelPresetName } from 'paddleocr';

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

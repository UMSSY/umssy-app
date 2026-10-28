import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Idioma del motor OCR para diplomas de la UMSS
export const OCR_LANGUAGE = 'spa';

// Motor LSTM de Tesseract (el más preciso)
export const OCR_ENGINE_MODE = 1;

// Carpeta temporal donde Tesseract guarda el modelo de idioma descargado (fuera del repositorio)
export const OCR_CACHE_PATH = join(tmpdir(), 'umssy-ocr');

// Escala para convertir una página de PDF escaneado en imagen legible por el OCR
export const PDF_RENDER_SCALE = 2;

// Si un PDF trae menos texto que esto, se considera escaneado y se pasa por OCR
export const MIN_PDF_TEXT_LENGTH = 40;

// Confianza asignada al texto que el PDF ya trae (no pasa por OCR)
export const PDF_TEXT_CONFIDENCE = 0.95;

export const PDF_MIME_TYPE = 'application/pdf';

export const DIPLOMA_KEYWORDS = ['diploma academico', 'titulo en provision nacional', 'titulo profesional'] as const;

export const UNIVERSITY_KEYWORDS = ['universidad mayor de san simon'] as const;

export const MIN_GRADUATION_YEAR = 1950;


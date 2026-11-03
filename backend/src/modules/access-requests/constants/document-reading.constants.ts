// Idioma del motor OCR para diplomas de la UMSS
export const OCR_LANGUAGE = 'spa';

// Modelo LSTM de Tesseract de precisión completa. Los archivos los descarga `pnpm ocr:models`
// en `${OCR_MODEL_DIR ?? 'ocr-models'}/4.0.0_best` y el dockerfile los copia a la imagen.
export const OCR_TESSERACT_MODEL = '4.0.0_best' as const;

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

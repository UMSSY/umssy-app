export interface OcrBoundingBox {
  x: number; // Porcentaje desde la izquierda (0-100)
  y: number; // Porcentaje desde arriba (0-100)
  width: number; // Porcentaje de ancho (0-100)
  height: number; // Porcentaje de alto (0-100)
}

export interface OcrFieldMark {
  fieldKey: string;
  label: string; // ej. "Nombre", "Carrera", "Año de egreso", "Carnet", "Código SIS"
  declaredValue: string;
  recognizedValue: string | null;
  confidence: number; // 0 - 100
  matches: boolean; // CA7
  isNotFound: boolean; // CA5 y CA9: No figura en el documento
  isDoubtful: boolean; // CA4: Dudoso (baja confianza < 70% o no coincide)
  bbox?: OcrBoundingBox; // CA1, CA2, CA3, CA4, CA5
}

export interface OcrAnalysisResult {
  readAt: string; // ISO date de lectura
  reader: "Sistema"; // CA14
  isClear: boolean; // CA10: false si lectura poco clara
  manualReviewReason?: string | null; // CA12: ej. "Documento poco legible", "El apellido no coincide"
  confidenceAverage: number;
  matchingCount: number; // CA8
  pendingCount: number; // CA8
  fields: OcrFieldMark[];
}

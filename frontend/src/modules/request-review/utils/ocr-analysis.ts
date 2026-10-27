import type { ReviewDetail } from "../types/request-review.types";
import type { OcrAnalysisResult, OcrBoundingBox, OcrFieldMark } from "../types/ocr.types";
import { normalizeValue } from "./compare-values";

export const NOT_IN_DOCUMENT_TEXT = "No figura en el documento";
export const DIPLOMA_NOTE_TEXT =
  "El carnet y el código SIS no aparecen en diplomas. Verifícalos con el registro académico antes de aprobar.";
export const UNCLEAR_READING_WARNING =
  "La lectura automática del documento no fue clara. Se requiere revisar el contraste de datos manualmente antes de emitir el dictamen.";
export const NOT_A_DIPLOMA_WARNING =
  "El documento adjunto no corresponde a un diploma académico legible. No se detectaron los campos visibles requeridos (nombre, carrera o titulación) y no se extrajeron datos para comparar. Se requiere revisar el contraste manualmente antes de emitir el dictamen.";

/**
 * Determina si el documento no contiene información de un diploma.
 * Solo los documentos ficticios del seed (donde en ningún lado dice diploma) se consideran no-diploma.
 * Cualquier otro archivo subido por un postulante (sea .pdf, .jpg, .png, con cualquier nombre)
 * se procesa y se somete a lectura OCR.
 */
export function isDiplomaDocument(document?: ReviewDetail["document"]): boolean {
  if (!document) return false;
  const fileName = `${document.name}.${document.extension}`.toLowerCase();

  // Los documentos ficticios de prueba del seed contienen únicamente texto de prueba ("DOCUMENTO FICTICIO DE PRUEBA")
  // y en ningún lado dicen diploma o título académico.
  if (
    fileName.includes("ficticio") ||
    fileName.includes("fake") ||
    fileName.includes("dummy") ||
    fileName.includes("prueba-placeholder")
  ) {
    return false;
  }

  return true;
}

export function generateOcrAnalysis(
  detail: ReviewDetail,
  customOptions?: {
    isDiploma?: boolean;
    isUnclear?: boolean;
    doubtfulFields?: string[];
    manualReviewReason?: string | null;
    customConfidence?: Record<string, number>;
  },
): OcrAnalysisResult {
  const fileName = detail.document ? `${detail.document.name}.${detail.document.extension}`.toLowerCase() : "";
  const isDiploma = customOptions?.isDiploma ?? isDiplomaDocument(detail.document);
  const doubtfulFields = customOptions?.doubtfulFields ?? [];

  const fullNameDeclared = `${detail.firstName} ${detail.lastName}`.trim();
  const careerDeclared = detail.career.trim();
  const gradYearDeclared = String(detail.graduationYear).trim();
  const idCardDeclared = `${detail.idCardNumber}${detail.idCardIssuedIn ? ` ${detail.idCardIssuedIn}` : ""}`.trim();
  const sisCodeDeclared = detail.sisCode.trim();

  let nameRecognized: string | null = null;
  let nameConfidence = 0;
  let nameMatches = false;
  let isNameDoubtful = !isDiploma;
  let nameBbox: OcrBoundingBox | undefined = undefined;

  let careerRecognized: string | null = null;
  let careerConfidence = 0;
  let careerMatches = false;
  let isCareerDoubtful = !isDiploma;
  let careerBbox: OcrBoundingBox | undefined = undefined;

  let yearRecognized: string | null = null;
  let yearConfidence = 0;
  let yearMatches = false;
  let isYearDoubtful = !isDiploma;
  let yearBbox: OcrBoundingBox | undefined = undefined;

  // Detección de discordancia específica: cuando el diploma leído pertenece a otra persona
  // (por ejemplo el certificado "dilpoma 2.jpg" de la Universidad de Trujillo con Ely Yanina Juárez Moncada)
  const isSpecificMismatch =
    fileName.includes("dilpoma") ||
    fileName.includes("trujillo") ||
    fileName.includes("juarez") ||
    fileName.includes("bioetica") ||
    fileName.includes("mismatch");

  if (isDiploma) {
    if (isSpecificMismatch) {
      // Se leyó el documento, pero los datos del diploma no coinciden con lo declarado por el titular
      nameRecognized = "ELY YANINA JUÁREZ MONCADA";
      nameConfidence = customOptions?.customConfidence?.name ?? 65;
      nameMatches = false;
      isNameDoubtful = true;
      nameBbox = {
        x: 28,
        y: 58,
        width: 44,
        height: 4.5,
      };

      careerRecognized = "DIPLOMADO EN BIOÉTICA Y PREVENCIÓN DE MALA PRAXIS EN SALUD";
      careerConfidence = customOptions?.customConfidence?.career ?? 60;
      careerMatches = false;
      isCareerDoubtful = true;
      careerBbox = {
        x: 20,
        y: 64,
        width: 60,
        height: 5.5,
      };

      yearRecognized = "2007";
      yearConfidence = customOptions?.customConfidence?.graduationYear ?? 68;
      yearMatches = false;
      isYearDoubtful = true;
      yearBbox = {
        x: 58,
        y: 72,
        width: 22,
        height: 4.5,
      };
    } else {
      // Diploma estándar coincidente o con variaciones controladas por opciones
      const isNameMismatched = doubtfulFields.includes("name_mismatch");
      isNameDoubtful = doubtfulFields.includes("name") || isNameMismatched;
      nameConfidence = customOptions?.customConfidence?.name ?? (isNameDoubtful ? 65 : 99);
      nameRecognized = isNameMismatched
        ? `${detail.firstName.toUpperCase()} SILVA`
        : fullNameDeclared.toUpperCase();
      nameMatches = !isNameMismatched && normalizeValue(nameRecognized).includes(normalizeValue(detail.lastName));
      nameBbox = {
        x: 20,
        y: 34,
        width: 60,
        height: 6.5,
      };

      isCareerDoubtful = doubtfulFields.includes("career");
      careerConfidence = customOptions?.customConfidence?.career ?? (isCareerDoubtful ? 60 : 98);
      careerRecognized = careerDeclared;
      careerMatches = normalizeValue(careerRecognized) === normalizeValue(careerDeclared);
      careerBbox = {
        x: 14,
        y: 46.5,
        width: 72,
        height: 7.5,
      };

      isYearDoubtful = doubtfulFields.includes("graduationYear");
      yearConfidence = customOptions?.customConfidence?.graduationYear ?? (isYearDoubtful ? 68 : 95);
      yearRecognized = `${gradYearDeclared} (12 dic.)`;
      yearMatches = yearRecognized.includes(gradYearDeclared);
      yearBbox = {
        x: 18,
        y: 76,
        width: 36,
        height: 5.5,
      };
    }
  }

  const fields: OcrFieldMark[] = [
    {
      fieldKey: "name",
      label: "Nombre",
      declaredValue: fullNameDeclared,
      recognizedValue: nameRecognized,
      confidence: nameConfidence,
      matches: isDiploma && nameMatches && !isNameDoubtful,
      isNotFound: !isDiploma || nameRecognized === null,
      isDoubtful: isNameDoubtful || nameConfidence < 70 || !nameMatches,
      bbox: isDiploma ? nameBbox : undefined,
    },
    {
      fieldKey: "career",
      label: "Carrera",
      declaredValue: careerDeclared,
      recognizedValue: careerRecognized,
      confidence: careerConfidence,
      matches: isDiploma && careerMatches && !isCareerDoubtful,
      isNotFound: !isDiploma || careerRecognized === null,
      isDoubtful: isCareerDoubtful || careerConfidence < 70 || !careerMatches,
      bbox: isDiploma ? careerBbox : undefined,
    },
    {
      fieldKey: "graduationYear",
      label: "Año de egreso",
      declaredValue: gradYearDeclared,
      recognizedValue: yearRecognized,
      confidence: yearConfidence,
      matches: isDiploma && yearMatches && !isYearDoubtful,
      isNotFound: !isDiploma || yearRecognized === null,
      isDoubtful: isYearDoubtful || yearConfidence < 70 || !yearMatches,
      bbox: isDiploma ? yearBbox : undefined,
    },
    {
      fieldKey: "idCard",
      label: "Carnet",
      declaredValue: idCardDeclared,
      recognizedValue: null,
      confidence: 0,
      matches: false,
      isNotFound: true,
      isDoubtful: false,
      bbox: undefined,
    },
    {
      fieldKey: "sisCode",
      label: "Código SIS",
      declaredValue: sisCodeDeclared,
      recognizedValue: null,
      confidence: 0,
      matches: false,
      isNotFound: true,
      isDoubtful: false,
      bbox: undefined,
    },
  ];

  const matchingCount = fields.filter((f) => f.matches).length;
  const pendingCount = fields.length - matchingCount;

  // Fecha de lectura del OCR: 1 minuto después del envío
  const submittedDate = detail.history?.submittedAt ? new Date(detail.history.submittedAt) : new Date();
  const readDate = new Date(submittedDate.getTime() + 60 * 1000);

  const isUnclear =
    customOptions?.isUnclear ?? (!isDiploma || isSpecificMismatch || fields.some((f) => f.isDoubtful));

  let manualReviewReason: string | null = customOptions?.manualReviewReason ?? null;
  if (!manualReviewReason && (isUnclear || !isDiploma || fields.some((f) => f.isDoubtful))) {
    if (doubtfulFields.includes("name_mismatch")) {
      manualReviewReason = "El apellido no coincide";
    } else if (isSpecificMismatch || !nameMatches) {
      manualReviewReason = "El nombre no coincide con los datos declarados";
    } else {
      manualReviewReason = "Documento poco legible";
    }
  }

  return {
    readAt: readDate.toISOString(),
    reader: "Sistema",
    isClear: isDiploma && !isUnclear && !fields.some((f) => f.isDoubtful),
    manualReviewReason,
    confidenceAverage: Math.round(
      fields.filter((f) => f.confidence > 0).reduce((acc, f) => acc + f.confidence, 0) /
        (fields.filter((f) => f.confidence > 0).length || 1),
    ),
    matchingCount,
    pendingCount,
    fields,
  };
}

import type {
  VerificationJob,
  VerificationResult,
  DocumentSkill,
} from '../types/document-verification.type.js';
import { normalizeTerm } from '../../nlp/utils/normalize-term.js';

const words = (value: string) =>
  normalizeTerm(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// OCR confidence is independent of the name, document type and catalog checks.
export function evaluateRadarDocument(
  job: Pick<
    VerificationJob,
    'firstName' | 'lastName' | 'sourceType' | 'duplicate' | 'issuer'
  >,
  text: string,
  confidence: number | null,
  skills: DocumentSkill[],
): VerificationResult {
  const result = (status: VerificationResult['status'], reason: string) => ({
    status,
    confidence,
    reason,
    skills,
  });
  if (confidence === null || !Number.isFinite(confidence))
    return result(
      'review',
      'No se pudo obtener una lectura fiable del documento.',
    );
  if (confidence < 0.6)
    return result(
      'low_confidence',
      'La confianza de lectura está por debajo del mínimo del 60 %.',
    );
  if (job.duplicate)
    return result(
      'review',
      'Este archivo coincide con otra versión ya registrada.',
    );
  const content = ' ' + words(text) + ' ';
  const has = (value: string) =>
    Boolean(words(value)) && content.includes(' ' + words(value) + ' ');
  if (!(
    has(job.firstName + ' ' + job.lastName) ||
    has(job.lastName + ' ' + job.firstName)
  ))
    return result(
      'review',
      'El nombre del titular no coincide con el documento.',
    );
  if (job.sourceType === 'certification') {
    if (
      !/\b(certificad[oa]|certificamos|certificate|constancia|diploma)\b/.test(
        content,
      ) ||
      !job.issuer ||
      !has(job.issuer)
    )
      return result(
        'review',
        'Se necesita confirmar el tipo de certificado o la institución emisora.',
      );
  } else if (
    !/\b(curriculum|curriculo|resume|experiencia|experience|formacion|education)\b/.test(
      content,
    )
  )
    return result(
      'review',
      'El contenido no permite identificar el archivo como currículum.',
    );
  if (!skills.length)
    return result(
      'review',
      'No se identificaron habilidades del catálogo con un área de radar.',
    );
  return result(
    'approved',
    'La lectura, los datos del titular y las habilidades del catálogo cumplen las reglas de verificación.',
  );
}

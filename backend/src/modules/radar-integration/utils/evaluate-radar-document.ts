import { RadarDocumentSourceType } from '../constants/radar-document-source-type.enum.js';
import { RadarDocumentStatus } from '../constants/radar-document-status.enum.js';
import type { VerificationDocumentContext } from '../types/verification-document-context.types.js';
import type { VerificationResult } from '../types/verification-result.types.js';
import type { DocumentSkill } from '../types/document-skill.types.js';
import { normalizeTerm } from '../../nlp/utils/normalize-term.js';

const words = (value: string) =>
  normalizeTerm(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export function evaluateRadarDocument(
  job: Pick<
    VerificationDocumentContext,
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
      RadarDocumentStatus.REVIEW,
      'No se pudo obtener una lectura fiable del documento.',
    );
  if (confidence < 0.6)
    return result(
      RadarDocumentStatus.LOW_CONFIDENCE,
      'La confianza de lectura está por debajo del mínimo del 60 %.',
    );
  if (job.duplicate)
    return result(
      RadarDocumentStatus.REVIEW,
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
      RadarDocumentStatus.REVIEW,
      'El nombre del titular no coincide con el documento.',
    );
  if (job.sourceType === RadarDocumentSourceType.CERTIFICATION) {
    if (
      !/\b(certificad[oa]|certificamos|certificate|constancia|diploma)\b/.test(
        content,
      ) ||
      !job.issuer ||
      !has(job.issuer)
    )
      return result(
        RadarDocumentStatus.REVIEW,
        'Se necesita confirmar el tipo de certificado o la institución emisora.',
      );
  } else if (
    !/\b(curriculum|curriculo|resume|experiencia|experience|formacion|education)\b/.test(
      content,
    )
  )
    return result(
      RadarDocumentStatus.REVIEW,
      'El contenido no permite identificar el archivo como currículum.',
    );
  if (!skills.length)
    return result(
      RadarDocumentStatus.REVIEW,
      'No se identificaron habilidades del catálogo con un área de radar.',
    );
  return result(
    RadarDocumentStatus.APPROVED,
    'La lectura, los datos del titular y las habilidades del catálogo cumplen las reglas de verificación.',
  );
}

import {
  ACADEMIC_PERIOD_PATTERN,
  getAcademicPeriod,
} from '../../reports/utils/academic-period.js';

interface VariationPeriodSource {
  academicPeriod?: string | null;
  closesAt?: Date | null;
  now?: Date;
}

// La gestión de una encuesta suele ser el año de la cohorte ("2020") o "Todas", que no son semestres.
export function resolveVariationPeriod({
  academicPeriod,
  closesAt,
  now = new Date(),
}: VariationPeriodSource): string | undefined {
  if (academicPeriod && ACADEMIC_PERIOD_PATTERN.test(academicPeriod)) {
    return academicPeriod;
  }

  return getAcademicPeriod((closesAt ?? now).toISOString());
}

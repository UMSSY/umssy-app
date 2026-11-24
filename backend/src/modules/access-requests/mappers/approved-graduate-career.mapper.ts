import type { ApprovedGraduateCareer } from '../types/approved-graduate-career.types.js';
import type { ApprovedGraduateCareerRecord } from '../types/approved-graduate-career-record.types.js';

export function toApprovedGraduateCareers(
  records: ApprovedGraduateCareerRecord[],
): ApprovedGraduateCareer[] {
  return records.flatMap((record) =>
    record.approvedUserId
      ? [{ userId: record.approvedUserId, careerId: record.careerId }]
      : [],
  );
}

import type { AccessRequestsRepository } from '../repositories/access-requests.repository.js';
import { ACCESS_REQUEST_STATUS } from '../types/access-request.enum.js';

type RequestStatusRow = NonNullable<Awaited<ReturnType<AccessRequestsRepository['findByRequestCode']>>>;

// Incluye el nombre completo únicamente cuando la solicitud está rechazada.
// No expone C.I., SIS, teléfono, correo, fecha de nacimiento ni contenido del archivo.
export function toRequestStatusResponse(row: RequestStatusRow) {
  return {
    requestCode: row.requestCode,
    status: row.status.title,
    ...(row.status.title === ACCESS_REQUEST_STATUS.REJECTED
      ? { fullName: `${row.firstName.trim()} ${row.lastName.trim()}`.trim() }
      : {}),
    submittedAt: row.submittedAt?.toISOString() ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    rejectionReason: row.rejectionReason,
    document:
      row.documentType && row.documentFile
        ? { type: row.documentType.title, size: row.documentFile.size, mimeType: row.documentFile.mimeType }
        : null,
  };
}

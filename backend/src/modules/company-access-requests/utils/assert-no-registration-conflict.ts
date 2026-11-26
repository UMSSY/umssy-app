import { CompanyRegistrationConflictException } from '../exceptions/company-registration-conflict.exception.js';
import type { CompanyRegistrationDuplicates } from '../types/company-registration-duplicates.types.js';

export function assertNoRegistrationConflict(
  duplicates: CompanyRegistrationDuplicates,
  data: { companyName: string; email: string; username: string },
): void {
  const { existingCompany, existingUser, activeRequest, existingUsername } =
    duplicates;

  if (existingCompany) {
    throw new CompanyRegistrationConflictException(
      `La empresa "${data.companyName}" ya se encuentra registrada en la plataforma.`,
      'companyName',
    );
  }
  if (existingUser) {
    throw new CompanyRegistrationConflictException(
      `El correo electrónico "${data.email}" ya pertenece a una cuenta registrada en la plataforma.`,
      'email',
    );
  }
  if (activeRequest) {
    throw new CompanyRegistrationConflictException(
      `Ya existe una solicitud activa o en revisión para "${activeRequest.companyName}" con el correo "${activeRequest.email}".`,
      'activeRequest',
    );
  }
  if (existingUsername) {
    throw new CompanyRegistrationConflictException(
      `El nombre de usuario "${data.username}" no está disponible.`,
      'username',
    );
  }
}

import { DomainException } from '../../../common/exceptions/domain.exception.js';

export type CompanyConflictField =
  | 'email'
  | 'companyName'
  | 'activeRequest'
  | 'username';

export class CompanyRegistrationConflictException extends DomainException {
  constructor(
    message: string,
    readonly field?: CompanyConflictField,
  ) {
    super(
      message,
      409,
      'COMPANY_REGISTRATION_CONFLICT',
      field ? { field } : null,
    );
  }
}

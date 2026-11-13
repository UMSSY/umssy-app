import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class JobApplicationConsentRequiredException extends DomainException {
  constructor() {
    super(
      'Debes autorizar la revisión de tu CV actual, radar de afinidad e información de contacto para postular.',
      400,
      'JOB_APPLICATION_CONSENT_REQUIRED',
    );
  }
}

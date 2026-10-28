import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class MentorEligibilityException extends DomainException {
  constructor() {
    super(
      'Se requiere una cuenta de titulado aprobada y vinculada',
      403,
      'MENTOR_NOT_ELIGIBLE',
    );
  }
}

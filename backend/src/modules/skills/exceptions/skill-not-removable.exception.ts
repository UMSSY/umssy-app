import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class SkillNotRemovableException extends DomainException {
  constructor(
    message = 'The skill is backed by an experience or another profile source and cannot be removed manually',
  ) {
    super(message, 409, 'SKILL_NOT_REMOVABLE');
  }
}

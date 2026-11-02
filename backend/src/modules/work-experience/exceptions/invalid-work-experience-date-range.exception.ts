import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class InvalidWorkExperienceDateRangeException extends DomainException {
  constructor() {
    super('endDate cannot be earlier than startDate', 400, 'INVALID_WORK_EXPERIENCE_DATE_RANGE');
  }
}

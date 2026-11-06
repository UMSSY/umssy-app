import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ProposalKeyConflictException extends DomainException {
  constructor() {
    super('La clave de envío ya corresponde a otra propuesta.', 409, 'PROPOSAL_KEY_CONFLICT');
  }
}

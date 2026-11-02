import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ProposalExpiredException extends DomainException {
  constructor() {
    super('La propuesta ya venció', 409, 'PROPOSAL_EXPIRED');
  }
}
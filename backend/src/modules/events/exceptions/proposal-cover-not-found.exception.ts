import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ProposalCoverNotFoundException extends DomainException {
  constructor() {
    super('Portada no disponible.', 404, 'PROPOSAL_COVER_NOT_FOUND');
  }
}

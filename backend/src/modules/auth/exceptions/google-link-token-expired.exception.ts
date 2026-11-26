import { DomainException } from '../../../common/exceptions/domain.exception.js';
import { GOOGLE_LINK_RELOGIN_MESSAGE } from '../constants/google-link.constants.js';

export class GoogleLinkTokenExpiredException extends DomainException {
  constructor(message = GOOGLE_LINK_RELOGIN_MESSAGE) {
    super(message, 401, 'GOOGLE_LINK_TOKEN_EXPIRED');
  }
}

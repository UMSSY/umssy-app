import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class ReportAuthorNotFoundException extends DomainException {
  constructor() {
    super(
      'No se pudo identificar al administrador que genera el reporte.',
      404,
      'REPORT_AUTHOR_NOT_FOUND',
      { field: 'userId' },
    );
  }
}

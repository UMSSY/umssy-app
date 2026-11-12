import { BadRequestException } from '@nestjs/common';

export class JobApplicationConsentRequiredException extends BadRequestException {
  constructor() {
    super(
      'Debes autorizar la revisión de tu CV actual, radar de afinidad e información de contacto para postular.',
    );
  }
}

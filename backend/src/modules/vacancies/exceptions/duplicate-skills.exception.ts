import { BadRequestException } from '@nestjs/common';

export class DuplicateSkillsException extends BadRequestException {
  constructor() {
    super('No se permiten habilidades duplicadas.');
  }
}

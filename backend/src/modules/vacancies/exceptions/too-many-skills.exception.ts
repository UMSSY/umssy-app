import { BadRequestException } from '@nestjs/common';

export class TooManySkillsException extends BadRequestException {
  constructor() {
    super('No se pueden seleccionar más de 10 habilidades.');
  }
}

import { BadRequestException } from '@nestjs/common';

export class SkillNotFoundException extends BadRequestException {
  constructor() {
    super('Una o más habilidades no existen en el catálogo.');
  }
}

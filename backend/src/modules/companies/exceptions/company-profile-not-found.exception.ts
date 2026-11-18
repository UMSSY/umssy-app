import { NotFoundException } from '@nestjs/common';

export class CompanyProfileNotFoundException extends NotFoundException {
  constructor(companyId: string) {
    super(`Company profile with id ${companyId} was not found`);
  }
}
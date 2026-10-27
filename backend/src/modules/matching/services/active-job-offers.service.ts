import { Injectable } from '@nestjs/common';
import { JobOffersService } from '../../job-offers/services/job-offers.service.js';

@Injectable()
export class ActiveJobOffersService {
  constructor(
    private readonly jobOffersService: JobOffersService,
  ) {}

  async findAll() {
    return this.jobOffersService.listPublished();
  }
}

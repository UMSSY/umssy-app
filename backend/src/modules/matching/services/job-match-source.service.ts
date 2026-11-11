import { Injectable } from '@nestjs/common';
import { JobOffersService } from '../../job-offers/services/job-offers.service.js';

@Injectable()
export class JobMatchSourceService {
  constructor(private readonly jobOffers: JobOffersService) {}
  findPublishedById(id: string, now: Date) {
    return this.jobOffers.findPublishedMatchById(id, now);
  }
  findPublished(now: Date) {
    return this.jobOffers.findPublishedMatches(now);
  }
}

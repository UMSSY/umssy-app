import { Injectable } from '@nestjs/common';
import { RadarPublicationRepository } from './repositories/radar-publication.repository.js';

@Injectable()
export class RadarPublicationService {
  constructor(private readonly repository: RadarPublicationRepository) {}

  publish(userId: string) {
    return this.repository.publish(userId, userId);
  }

  latest(userId: string) {
    return this.repository.latest(userId);
  }
}

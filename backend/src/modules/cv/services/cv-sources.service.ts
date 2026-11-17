import { Injectable } from '@nestjs/common';
import { CvFileRepository } from '../repositories/cv-file.repository.js';

@Injectable()
export class CvSourcesService {
  constructor(private readonly repository: CvFileRepository) {}

  hasByUserId(userId: string): Promise<boolean> {
    return this.repository.hasByUserId(userId);
  }

  currentCv(userId: string) {
    return this.repository.currentCv(userId);
  }

  cvById(cvId: string) {
    return this.repository.cvById(cvId);
  }
}

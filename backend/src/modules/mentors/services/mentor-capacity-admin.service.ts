import { Injectable } from '@nestjs/common';
import { MentorCapacityAdminRepository } from '../repositories/mentor-capacity-admin.repository.js';

@Injectable()
export class MentorCapacityAdminService {
  constructor(private readonly repository: MentorCapacityAdminRepository) {}

  getOverview() {
    return this.repository.getOverview();
  }

  updatePercentage(percentage: number) {
    return this.repository.updatePercentage(percentage);
  }

  listWaitingRequests(page: number, limit: number) {
    return this.repository.listWaitingRequests(page, limit);
  }

  listOfferHistory(page: number, limit: number) {
    return this.repository.listOfferHistory(page, limit);
  }
}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MentorsModule } from '../mentors/mentors.module.js';
import { AvailabilityController } from './controllers/availability.controller.js';
import { BlockedDatesController } from './controllers/blocked-dates.controller.js';
import { MentorAvailabilityController } from './controllers/mentor-availability.controller.js';
import { AvailabilityService } from './services/availability.service.js';
import { AvailabilityRepository } from './repositories/availability.repository.js';
import { AvailabilityMapper } from './mappers/availability.mapper.js';
import { BlockedDateMapper } from './mappers/blocked-date.mapper.js';
import { BlockedDatesRepository } from './repositories/blocked-dates.repository.js';
import { BlockedDatesService } from './services/blocked-dates.service.js';

@Module({
  imports: [AuthModule, MentorsModule],
  controllers: [AvailabilityController, MentorAvailabilityController, BlockedDatesController],
  providers: [
    AvailabilityService,
    AvailabilityRepository,
    AvailabilityMapper,
    BlockedDatesService,
    BlockedDatesRepository,
    BlockedDateMapper,
  ],
  exports: [AvailabilityService, AvailabilityRepository, BlockedDatesService],
})
export class AvailabilityModule {}

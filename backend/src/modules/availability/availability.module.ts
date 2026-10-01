import { Module } from '@nestjs/common';
import { AvailabilityController } from './controllers/availability.controller.js';
import { AvailabilityService } from './services/availability.service.js';
import { AvailabilityRepository } from './repositories/availability.repository.js';
import { AvailabilityMapper } from './mappers/availability.mapper.js';

@Module({
  controllers: [AvailabilityController],
  providers: [AvailabilityService, AvailabilityRepository, AvailabilityMapper],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}

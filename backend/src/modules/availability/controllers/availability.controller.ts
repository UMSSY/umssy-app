import { Controller } from '@nestjs/common';
import { AvailabilityService } from '../services/availability.service.js';

@Controller('availability-blocks')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}
}

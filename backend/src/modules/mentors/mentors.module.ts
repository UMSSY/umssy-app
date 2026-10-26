import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module.js';
import { MentorPhotoController } from './controllers/mentor-photo.controller.js';
import { MentorPhotoService } from './services/mentor-photo.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { MentorsController } from './controllers/mentors.controller.js';
import { MentorsService } from './services/mentors.service.js';
import { MentorsRepository } from './repositories/mentors.repository.js';
import { MentorMapper } from './mappers/mentor.mapper.js';
import { MentorAffinityService } from './services/mentor-affinity.service.js';
import { MentorOffersController } from './controllers/mentor-offers.controller.js';
import { MentorOffersRepository } from './repositories/mentor-offers.repository.js';
import { MentorOffersService } from './services/mentor-offers.service.js';
import { MentorOffersWorker } from './services/mentor-offers-worker.service.js';

@Module({
  imports: [AuthModule, ProfileModule],
  controllers: [MentorsController, MentorPhotoController, MentorOffersController],
  providers: [
    MentorsService,
    MentorsRepository,
    MentorMapper,
    MentorPhotoService,
    MentorAffinityService,
    MentorOffersRepository,
    MentorOffersService,
    MentorOffersWorker,
  ],
  exports: [MentorsService],
})
export class MentorsModule {}

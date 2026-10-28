
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
import { MentorExitController } from './controllers/mentor-exit.controller.js';
import { MentorExitRepository } from './repositories/mentor-exit.repository.js';
import { MentorExitService } from './services/mentor-exit.service.js';
import { MentorParticipationController } from './controllers/mentor-participation.controller.js';
import { MentorParticipationService } from './services/mentor-participation.service.js';
import { MentorParticipationRepository } from './repositories/mentor-participation.repository.js';

@Module({
  imports: [AuthModule, ProfileModule],
  controllers: [
    MentorsController,
    MentorPhotoController,
    MentorOffersController,
    MentorExitController,
    MentorParticipationController,
  ],
  providers: [
    MentorsService,
    MentorsRepository,
    MentorMapper,
    MentorPhotoService,
    MentorAffinityService,
    MentorOffersRepository,
    MentorOffersService,
    MentorOffersWorker,
    MentorExitRepository,
    MentorExitService,
    MentorParticipationService,
    MentorParticipationRepository,
  ],
  exports: [MentorsService],
})
export class MentorsModule {}

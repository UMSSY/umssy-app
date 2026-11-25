import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module.js';
import { SkillsModule } from '../skills/skills.module.js';
import { MentorPhotoController } from './controllers/mentor-photo.controller.js';
import { MentorPhotoService } from './services/mentor-photo.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { MentorsController } from './controllers/mentors.controller.js';
import { MentorsService } from './services/mentors.service.js';
import { MentorProfileSuggestionsService } from './services/mentor-profile-suggestions.service.js';
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
import { MentorCapacityAdminController } from './controllers/mentor-capacity-admin.controller.js';
import { MentorCapacityAdminRepository } from './repositories/mentor-capacity-admin.repository.js';
import { MentorCapacityAdminService } from './services/mentor-capacity-admin.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { MentorOfferNotificationsService } from './services/mentor-offer-notifications.service.js';
import { WorkExperienceSourcesModule } from '../work-experience/work-experience-sources.module.js';
import { MentorDirectorySearchService } from './services/mentor-directory-search.service.js';

@Module({
  imports: [
    AuthModule,
    ProfileModule,
    SkillsModule,
    NotificationsModule,
    WorkExperienceSourcesModule,
  ],
  controllers: [
    MentorsController,
    MentorPhotoController,
    MentorOffersController,
    MentorExitController,
    MentorParticipationController,
    MentorCapacityAdminController,
  ],
  providers: [
    MentorsService,
    MentorProfileSuggestionsService,
    MentorsRepository,
    MentorDirectorySearchService,
    MentorMapper,
    MentorPhotoService,
    MentorAffinityService,
    MentorOffersRepository,
    MentorOffersService,
    MentorOffersWorker,
    MentorOfferNotificationsService,
    MentorExitRepository,
    MentorExitService,
    MentorParticipationService,
    MentorParticipationRepository,
    MentorCapacityAdminRepository,
    MentorCapacityAdminService,
  ],
  exports: [MentorsService, MentorProfileSuggestionsService],
})
export class MentorsModule {}

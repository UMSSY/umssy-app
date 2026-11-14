import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { describe, expect, it } from 'vitest';
import { MentorsModule } from '../mentors.module.js';
import { MentorsService } from '../services/mentors.service.js';
import { MentorProfileSuggestionsService } from '../services/mentor-profile-suggestions.service.js';
import { MentorsRepository } from '../repositories/mentors.repository.js';
import { AuthModule } from '../../auth/auth.module.js';
import { ProfileModule } from '../../profile/profile.module.js';
import { SkillsModule } from '../../skills/skills.module.js';
import { MentorsController } from '../controllers/mentors.controller.js';
import { MentorPhotoController } from '../controllers/mentor-photo.controller.js';
import { MentorOffersController } from '../controllers/mentor-offers.controller.js';
import { MentorExitController } from '../controllers/mentor-exit.controller.js';
import { MentorParticipationController } from '../controllers/mentor-participation.controller.js';

describe('MentorsModule profile suggestions configuration', () => {
  it('registers the suggestions service once alongside its existing repository', () => {
    const providers: unknown[] = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      MentorsModule,
    );
    expect(
      providers.filter(
        (provider) => provider === MentorProfileSuggestionsService,
      ),
    ).toHaveLength(1);
    expect(providers).toContain(MentorsRepository);
    expect(providers).toContain(MentorsService);
  });

  it('exports the suggestions service for a subsequent consumer', () => {
    expect(Reflect.getMetadata(MODULE_METADATA.EXPORTS, MentorsModule)).toEqual(
      [MentorsService, MentorProfileSuggestionsService],
    );
  });

  it('preserves the existing module imports without adding dependencies', () => {
    expect(Reflect.getMetadata(MODULE_METADATA.IMPORTS, MentorsModule)).toEqual(
      [AuthModule, ProfileModule, SkillsModule],
    );
  });

  it('preserves the existing controller registrations', () => {
    expect(
      Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, MentorsModule),
    ).toEqual([
      MentorsController,
      MentorPhotoController,
      MentorOffersController,
      MentorExitController,
      MentorParticipationController,
    ]);
  });
});

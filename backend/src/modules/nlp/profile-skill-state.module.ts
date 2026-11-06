import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { ProfileSkillResultsRepository } from './repositories/profile-skill-results.repository.js';
import { ProfileSkillInvalidationService } from './services/profile-skill-invalidation.service.js';

@Module({
  imports: [PrismaModule],
  providers: [ProfileSkillResultsRepository, ProfileSkillInvalidationService],
  exports: [ProfileSkillResultsRepository, ProfileSkillInvalidationService],
})
export class ProfileSkillStateModule {}

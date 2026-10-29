import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { ProfileSkillsEventsModule } from '../../common/profile-skills/profile-skills-events.module.js';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { NlpModule } from '../nlp/nlp.module.js';
import { RadarIntegrationController } from './radar-integration.controller.js';
import { RadarIntegrationService } from './radar-integration.service.js';

@Module({
  imports: [PrismaModule, JwtAuthModule, NlpModule, ProfileSkillsEventsModule],
  controllers: [RadarIntegrationController],
  providers: [RadarIntegrationService],
  exports: [RadarIntegrationService],
})
export class RadarIntegrationModule {}

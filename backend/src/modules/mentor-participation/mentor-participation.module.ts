import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MailModule } from '../mail/mail.module.js';
import { MentorParticipationController } from './controllers/mentor-participation.controller.js';
import { MentorMailService } from './services/mentor-mail.service.js';
import { MentorParticipationService } from './services/mentor-participation.service.js';
import { MentorParticipationWorker } from './services/mentor-participation-worker.service.js';

@Module({
  imports: [AuthModule, MailModule],
  controllers: [MentorParticipationController],
  providers: [MentorParticipationService, MentorMailService, MentorParticipationWorker],
  exports: [MentorParticipationService],
})
export class MentorParticipationModule {}

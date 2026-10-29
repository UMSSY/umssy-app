import { Module } from '@nestjs/common';
import { ProfileSkillsEvents } from './profile-skills-events.service.js';

@Module({ providers: [ProfileSkillsEvents], exports: [ProfileSkillsEvents] })
export class ProfileSkillsEventsModule {}

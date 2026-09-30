import { Module } from '@nestjs/common';
import { PrismaService } from './database/prisma.service.js';
import { ProfileController } from './profile.controller.js';
import { ProfileService } from './profile.service.js';

@Module({
  controllers: [ProfileController],
  providers: [PrismaService, ProfileService],
})
export class ProfileModule {}

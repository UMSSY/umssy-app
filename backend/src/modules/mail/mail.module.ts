import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './services/mail.service.js';
import { MailTemplateService } from './services/mail-template.service.js';

@Module({
  imports: [ConfigModule],
  providers: [MailTemplateService, MailService],
  exports: [MailService],
})
export class MailModule {}

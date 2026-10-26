import { Module } from '@nestjs/common';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { FilesModule } from '../files/files.module.js';
import { AuditEventsController } from './controllers/audit-events.controller.js';
import { AuditEventsRepository } from './repositories/audit-events.repository.js';
import { AuditEventRecorderService } from './services/audit-event-recorder.service.js';
import { AuditEventsExportService } from './services/audit-events-export.service.js';
import { AuditEventsService } from './services/audit-events.service.js';

@Module({
  imports: [JwtAuthModule, FilesModule],
  controllers: [AuditEventsController],
  providers: [AuditEventsService, AuditEventsRepository, AuditEventRecorderService, AuditEventsExportService],
  exports: [AuditEventRecorderService],
})
export class AuditEventsModule {}

import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { describe, expect, it } from 'vitest';
import { documentCommonResponses } from '../../../common/utils/document-common-responses.js';
import { AttendanceCheckInController } from '../controllers/attendance-check-in.controller.js';
import { EventRegistrationsController } from '../controllers/event-registrations.controller.js';
import { AttendanceCheckInService } from '../services/attendance-check-in.service.js';
import { EventRegistrationsService } from '../services/event-registrations.service.js';
import { ManagedWorkshopsController } from '../../events/controllers/managed-workshops.controller.js';
import { EventsService } from '../../events/services/events.service.js';
import { EventsCatalogService } from '../../events/services/events-catalog.service.js';
import { EventProposalsService } from '../../events/services/event-proposals.service.js';
import { EventsController } from '../../events/controllers/events.controller.js';
import { EventProposalsController } from '../../events/controllers/event-proposals.controller.js';
import { SessionService } from '../../../common/services/session.service.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';

const API_ERROR = '#/components/schemas/ApiErrorResponse';

describe('events OpenAPI contracts', () => {
  it('documents both attendance results, reference formats, cache headers and common errors', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        AttendanceCheckInController,
        ManagedWorkshopsController,
        EventRegistrationsController,
        EventsController,
        EventProposalsController,
      ],
      providers: [
        { provide: AttendanceCheckInService, useValue: {} },
        { provide: EventsService, useValue: {} },
        { provide: EventsCatalogService, useValue: {} },
        { provide: EventProposalsService, useValue: {} },
        { provide: EventRegistrationsService, useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: SessionService, useValue: {} },
        JwtAuthGuard,
      ],
    }).compile();
    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    try {
      const document = documentCommonResponses(
        SwaggerModule.createDocument(
          app,
          new DocumentBuilder().addBearerAuth().build(),
        ),
      );
      const checkIn =
        document.paths['/api/events/{eventId}/attendances/check-ins']?.post;
      const managed = document.paths['/api/events/managed']?.get;
      const mine = document.paths['/api/event-registrations/me']?.get;
      const catalog = document.paths['/api/events']?.get;
      const proposal = document.paths['/api/event-proposals']?.post;
      expect(checkIn?.operationId).toBe('checkInWorkshopAttendance');
      const reference =
        checkIn?.requestBody && 'content' in checkIn.requestBody
          ? checkIn.requestBody.content?.['application/json']?.schema
          : undefined;
      expect(JSON.stringify(reference)).toContain('oneOf');
      expect(JSON.stringify(reference)).toContain('[Vv]1:');
      expect(JSON.stringify(reference)).toContain('[A-Fa-f0-9]{64}');
      expect(JSON.stringify(reference)).toContain('^\\\\s*');
      expect(JSON.stringify(reference)).not.toContain('maxLength');
      for (const status of ['200', '201']) {
        expect(checkIn?.responses[status]).toHaveProperty(
          'headers.Cache-Control',
        );
        const response = checkIn?.responses[status];
        expect(JSON.stringify(response)).toContain(
          '"required":["result","checkedInAt","sessionId"]',
        );
      }
      expect(catalog?.operationId).toBe('listEvents');
      expect(catalog?.security).toEqual([{}, { bearer: [] }]);
      expect(JSON.stringify(catalog?.responses['200'])).toContain(
        'recommendation',
      );
      expect(JSON.stringify(catalog?.responses['200'])).toContain(
        'isProfileComplete',
      );
      expect(JSON.stringify(catalog?.responses['200'])).toContain('sessions');
      expect(proposal?.operationId).toBe('createEventProposal');
      expect(JSON.stringify(proposal?.parameters)).toContain('Idempotency-Key');
      expect(JSON.stringify(proposal?.requestBody)).toContain(
        'additionalSessions',
      );
      expect(JSON.stringify(proposal?.responses['201'])).toContain(
        'supportThreshold',
      );
      for (const status of ['400', '401', '403', '409', '413', '415', '500']) {
        expect(JSON.stringify(proposal?.responses[status])).toContain(
          API_ERROR,
        );
      }
      for (const status of ['400', '401', '403', '409', '422', '500']) {
        expect(JSON.stringify(checkIn?.responses[status])).toContain(API_ERROR);
      }
      const errorContent = (status: string) => {
        const response = checkIn?.responses[status];
        return response && 'content' in response
          ? response.content?.['application/json']
          : undefined;
      };
      const exampleCodes = (status: string) =>
        Object.values(errorContent(status)?.examples ?? {}).map((example) =>
          'value' in example
            ? (example.value as { code: string }).code
            : undefined,
        );
      expect(exampleCodes('403')).toEqual([
        'FORBIDDEN_ROLE',
        'ATTENDANCE_ACCESS_DENIED',
      ]);
      expect(exampleCodes('422')).toEqual([
        'ATTENDANCE_PASS_INVALID',
        'ATTENDANCE_PASS_CANCELLED',
        'ATTENDANCE_SESSION_INVALID',
      ]);
      expect(JSON.stringify(errorContent('403')?.schema)).toContain(
        '"enum":["FORBIDDEN_ROLE","ATTENDANCE_ACCESS_DENIED"]',
      );
      expect(JSON.stringify(errorContent('422')?.schema)).toContain(
        '"enum":["ATTENDANCE_PASS_INVALID","ATTENDANCE_PASS_CANCELLED","ATTENDANCE_SESSION_INVALID"]',
      );
      expect(managed?.operationId).toBe('getManagedWorkshops');
      expect(managed?.responses['200']).toHaveProperty('headers.Cache-Control');
      expect(JSON.stringify(managed?.responses['401'])).toContain(API_ERROR);
      expect(mine?.operationId).toBe('getMyEventRegistrations');
      expect(JSON.stringify(mine?.responses['200'])).toContain('totalPages');
      expect(JSON.stringify(mine?.responses['200'])).toContain('examples');
      expect(JSON.stringify(mine?.responses['400'])).toContain(API_ERROR);
    } finally {
      await app.close();
    }
  });
});

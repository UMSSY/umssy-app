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
import { SessionService } from '../../../common/services/session.service.js';

const API_ERROR = '#/components/schemas/ApiErrorResponse';

describe('events OpenAPI contracts', () => {
  it('documents both attendance results, reference formats, cache headers and common errors', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AttendanceCheckInController, ManagedWorkshopsController, EventRegistrationsController],
      providers: [
        { provide: AttendanceCheckInService, useValue: {} },
        { provide: EventsService, useValue: {} },
        { provide: EventRegistrationsService, useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: SessionService, useValue: {} },
      ],
    }).compile();
    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    try {
      const document = documentCommonResponses(SwaggerModule.createDocument(app, new DocumentBuilder().addBearerAuth().build()));
      const checkIn = document.paths['/api/events/{eventId}/attendances/check-ins']?.post;
      const managed = document.paths['/api/events/managed']?.get;
      const mine = document.paths['/api/event-registrations/me']?.get;
      expect(checkIn?.operationId).toBe('checkInWorkshopAttendance');
      const reference = checkIn?.requestBody && 'content' in checkIn.requestBody
        ? checkIn.requestBody.content?.['application/json']?.schema
        : undefined;
      expect(JSON.stringify(reference)).toContain('oneOf');
      expect(JSON.stringify(reference)).toContain('[Vv]1:');
      expect(JSON.stringify(reference)).toContain('[A-Fa-f0-9]{64}');
      expect(JSON.stringify(reference)).toContain('^\\\\s*');
      expect(JSON.stringify(reference)).not.toContain('maxLength');
      for (const status of ['200', '201']) {
        expect(checkIn?.responses[status]).toHaveProperty('headers.Cache-Control');
      }
      for (const status of ['400', '401', '403', '409', '422', '500']) {
        expect(JSON.stringify(checkIn?.responses[status])).toContain(API_ERROR);
      }
      const errorContent = (status: string) => {
        const response = checkIn?.responses[status];
        return response && 'content' in response ? response.content?.['application/json'] : undefined;
      };
      const exampleCodes = (status: string) =>
        Object.values(errorContent(status)?.examples ?? {}).map(
          (example) => ('value' in example ? (example.value as { code: string }).code : undefined),
        );
      expect(exampleCodes('403')).toEqual(['FORBIDDEN_ROLE', 'ATTENDANCE_ACCESS_DENIED']);
      expect(exampleCodes('422')).toEqual(['ATTENDANCE_PASS_INVALID', 'ATTENDANCE_PASS_CANCELLED']);
      expect(JSON.stringify(errorContent('403')?.schema)).toContain('"enum":["FORBIDDEN_ROLE","ATTENDANCE_ACCESS_DENIED"]');
      expect(JSON.stringify(errorContent('422')?.schema)).toContain('"enum":["ATTENDANCE_PASS_INVALID","ATTENDANCE_PASS_CANCELLED"]');
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

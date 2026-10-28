import { Injectable } from '@nestjs/common';
import { MODULE_METADATA } from '@nestjs/common/constants.js';
import { Test, type TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../../app.module.js';
import { PrismaModule } from '../../../common/prisma/prisma.module.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { AvailabilityModule } from '../../availability/availability.module.js';
import { AvailabilityService } from '../../availability/services/availability.service.js';
import { MentorsModule } from '../../mentors/mentors.module.js';
import { MentorsService } from '../../mentors/services/mentors.service.js';
import { AppointmentsModule } from '../appointments.module.js';
import { AppointmentsController } from '../controllers/appointments.controller.js';
import { AppointmentMapper } from '../mappers/appointment.mapper.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import { AppointmentsService } from '../services/appointments.service.js';

@Injectable()
class AppointmentsConsumer {
  constructor(readonly appointmentsService: AppointmentsService) {}
}

describe('AppointmentsModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule, AppointmentsModule],
      providers: [AppointmentsConsumer],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
    await moduleRef.init();
  });

  afterEach(async () => {
    await moduleRef?.close();
  });

  it.each([
    AppointmentsController,
    AppointmentsService,
    AppointmentsRepository,
    AppointmentMapper,
  ])('resuelve %o al inicializar el módulo', (provider) => {
    expect(moduleRef.get(provider)).toBeInstanceOf(provider);
  });

  it('reutiliza las instancias de los servicios de availability y mentors', () => {
    const appointmentsContext = moduleRef.select(AppointmentsModule);

    for (const [dependencyModule, service] of [
      [AvailabilityModule, AvailabilityService],
      [MentorsModule, MentorsService],
    ] as const) {
      expect(appointmentsContext.get(service)).toBe(
        moduleRef.select(dependencyModule).get(service, { strict: true }),
      );
      expect(() => appointmentsContext.get(service, { strict: true })).toThrow();
    }
  });

  it('exporta el servicio para su inyección desde un módulo consumidor', () => {
    expect(moduleRef.get(AppointmentsConsumer).appointmentsService).toBe(
      moduleRef.select(AppointmentsModule).get(AppointmentsService, { strict: true }),
    );
  });

  it('está registrado en el módulo raíz de la aplicación', () => {
    const imports: unknown[] = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule);

    expect(imports).toContain(AppointmentsModule);
  });

  it('inicializa la aplicación con appointments y la conexión de datos sustituida', async () => {
    const rootModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
    const app = rootModule.createNestApplication();

    try {
      await app.init();

      expect(app.get(AppointmentsService)).toBeInstanceOf(AppointmentsService);
    } finally {
      await app.close();
    }
  });
});

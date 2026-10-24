import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { EventRegistrationsRepository } from '../repositories/event-registrations.repository.js';
import { EventRegistrationsMapper } from '../mappers/event-registrations.mapper.js';
import type {
  CreateEventRegistrationPayload,
  MyRegistrationResponse,
} from '../types/event-registrations.types.js';
import {
  PassAccessDeniedException,
  PassNotFoundException,
} from '../exceptions/pass-access-denied.exception.js';

@Injectable()
export class EventRegistrationsService {
  constructor(
    private readonly registrationsRepository: EventRegistrationsRepository,
  ) {}

  async createWithQrToken(payload: CreateEventRegistrationPayload) {
    // TODO: HU-05 debe usarlo al crear la preinscripción y conservar el token al confirmarla; HU-06, al crear la inscripción directa.
    // Ambos flujos deben validar estado, cupo, usuario e idempotencia, e integrar o adaptar este método a su transacción.
    // Este método solo genera y persiste el token; no reemplaza esas reglas del flujo de inscripción.
    const qrToken = randomBytes(32).toString('hex');
    return this.registrationsRepository.create({ ...payload, qrToken });
  }

  async findMine(userId: string): Promise<MyRegistrationResponse[]> {
    const registrations =
      await this.registrationsRepository.findByUserId(userId);
    return EventRegistrationsMapper.toMyRegistrationList(registrations);
  }

  async getPassById(passId: string, userId: string) {
    const pass = await this.registrationsRepository.findPassByIdAndUserId(
      passId,
      userId,
    );

    if (!pass) {
      throw new PassNotFoundException();
    }

    return pass;
  }
}

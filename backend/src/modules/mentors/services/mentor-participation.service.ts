import { Injectable } from '@nestjs/common';
import { MentorParticipationRepository } from '../repositories/mentor-participation.repository.js';
import { MentorParticipationException } from '../exceptions/mentor-participation.exception.js';
import type { CreateMentorParticipationDto } from '../requests/create-mentor-participation.schema.js';

@Injectable()
export class MentorParticipationService {
  constructor(private readonly repository: MentorParticipationRepository) {}

  async create(userId: string, data: CreateMentorParticipationDto) {
    const result = await this.repository.createRequest(
      userId,
      data.technicalAreaIds,
      data.orientationTypeIds,
    );

    switch (result.result) {
      case 'CREATED':
        return result.request;
      case 'ALREADY_EXISTS':
      case 'OFFER_EXISTS':
        throw new MentorParticipationException(
          'Ya tienes una solicitud pendiente o una oferta vigente', 409,
          { code: 'REQUEST_ALREADY_EXISTS' },
        );
      case 'SANCTIONED':
        throw new MentorParticipationException(
          `Has superado el limite de 4 intentos en 24 horas. Podras realizar otra solicitud a partir del ${result.blockedUntil.toISOString()}`, 429,
        );

      case 'NOT_ELIGIBLE':
        throw new MentorParticipationException(
          'No cumples los requisitos para solicitar un cupo',
          403,
        );

      case 'INVALID_PREFERENCES':
        throw new MentorParticipationException(
          'Las preferencias seleccionadas no son válidas',
          400,
        );

      case 'CAPACITY_AVAILABLE':
        throw new MentorParticipationException(
          'Hay cupos disponibles para activación directa',
          409,
          { code: 'CAPACITY_AVAILABLE' },
        );

    }
  }

  findMyRequest(userId: string) {
    return this.repository.findMyRequest(userId);
  }

  findMyHistory(userId: string) {
    return this.repository.findMyHistory(userId);
  }

  async updatePreferences(userId: string, data: CreateMentorParticipationDto) {
    const result = await this.repository.updatePreferences(
      userId,
      data.technicalAreaIds,
      data.orientationTypeIds,
    );

    if (result.result === 'NOT_FOUND') {
      throw new MentorParticipationException(
        'No tienes una solicitud pendiente para modificar',
        404,
      );
    }

    if (result.result === 'INVALID_PREFERENCES') {
      throw new MentorParticipationException(
        'Las preferencias seleccionadas no son válidas',
        400,
      );
    }

    return result.request;
  }

  async cancel(userId: string) {
    const result = await this.repository.cancelRequest(userId);

    if (result.result === 'NOT_FOUND') {
      throw new MentorParticipationException(
        'No tienes una solicitud pendiente para cancelar',
        404,
      );
    }

    return result.request;
  }
}

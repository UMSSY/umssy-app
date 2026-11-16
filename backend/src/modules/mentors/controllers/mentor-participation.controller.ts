
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { ResponseInterceptor } from '../../../common/interceptors/index.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import {
  createMentorParticipationSchema,
  type CreateMentorParticipationDto,
} from '../requests/create-mentor-participation.schema.js';
import { MentorParticipationService } from '../services/mentor-participation.service.js';
import { requireMentorIdempotencyKey } from '../requests/mentor-idempotency-key.schema.js';

const parsePositiveInteger = (
  value: string | undefined,
  defaultValue: number,
  field: string,
  maximum: number,
): number => {
  if (value === undefined) {
    return defaultValue;
  }

  if (!/^[1-9]\d*$/.test(value)) {
    throw new BadRequestException(
      `El parámetro ${field} debe ser un número entero positivo`,
    );
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    throw new BadRequestException(
      `El parámetro ${field} debe estar entre 1 y ${maximum}`,
    );
  }

  return parsed;
};

@Controller('mentor-participation/requests')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
export class MentorParticipationController {
  constructor(private readonly service: MentorParticipationService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createMentorParticipationSchema))
    body: CreateMentorParticipationDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.service.create(user.id, body, requireMentorIdempotencyKey(key));
  }

  @Get('me')
  findMyRequest(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findMyRequest(user.id);
  }

  @Get('me/history')
  findMyHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (page === undefined && limit === undefined) {
      return this.service.findMyHistory(user.id);
    }

    const requestedPage = parsePositiveInteger(page, 1, 'page', 1000000);
    const requestedLimit = parsePositiveInteger(limit, 10, 'limit', 100);

    return this.service.findMyHistoryPaginated(
      user.id,
      requestedPage,
      requestedLimit,
    );
  }

  @Patch('me')
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createMentorParticipationSchema))
    body: CreateMentorParticipationDto,
  ) {
    return this.service.updatePreferences(user.id, body);
  }

  @Delete('me')
  cancel(@CurrentUser() user: AuthenticatedUser) {
    return this.service.cancel(user.id);
  }
}

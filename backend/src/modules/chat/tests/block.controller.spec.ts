import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { HttpStatus } from '@nestjs/common';
import { BlockController } from '../controllers/block.controller.js';
import { BlockService } from '../services/block.service.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ROLES_KEY } from '../../../common/constants/roles.constants.js';
import {
    BlockNotFoundException,
    CannotBlockSelfException,
    InvalidBlockTargetException,
    UserAlreadyBlockedException,
    UserNotFoundException,
}   from '../exceptions/index.js';
import { blockUserSchema } from '../requests/block-user.schema.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';

const HTTP_CODE_METADATA = '__httpCode__';
const httpCodeOf = (method: 'block' | 'unblock'): unknown =>
  Reflect.getMetadata(
    HTTP_CODE_METADATA,
    Object.getOwnPropertyDescriptor(BlockController.prototype, method)?.value as object,
  );

const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const user = { id: ME } as AuthenticatedUser;

describe('BlockController', () => {
    let controller: BlockController;
    const mockService = { block: vi.fn(), unblock: vi.fn() };

    beforeEach(async () => {
        vi.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
        controllers: [BlockController],
        providers: [{ provide: BlockService, useValue: mockService }],
    })
        .overrideGuard(JwtAuthGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(RolesGuard)
        .useValue({ canActivate: () => true })
        .compile();

    controller = module.get(BlockController);
  });

  it('usa los mismos roles que el resto del chat', () => {
        const roles = new Reflector().get<string[]>(ROLES_KEY, BlockController);
        expect(roles).toEqual(['titulado', 'estudiante', 'mentor', 'empresa']);
  });

  it('POST responde 201 y { blockedUserId, createdAt }', async () => {
        const response = { blockedUserId: OTHER, createdAt: '2026-10-28T12:00:00.000Z' };
        mockService.block.mockResolvedValue(response);

        await expect(controller.block({ userId: OTHER }, user)).resolves.toEqual(response);
        expect(mockService.block).toHaveBeenCalledWith(ME, OTHER);
        expect(Reflect.getMetadata(HTTP_CODE_METADATA, BlockController.prototype.block)).toBe(
        HttpStatus.CREATED,
        );
        expect(httpCodeOf('block')).toBe(HttpStatus.CREATED);
  });

  it('DELETE responde 204', async () => {
    mockService.unblock.mockResolvedValue(undefined);

    await expect(controller.unblock(OTHER, user)).resolves.toBeUndefined();
    expect(mockService.unblock).toHaveBeenCalledWith(ME, OTHER);
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, BlockController.prototype.unblock)).toBe(
      HttpStatus.NO_CONTENT,
    );
    expect(httpCodeOf('unblock')).toBe(HttpStatus.NO_CONTENT);
  });

  it.each([
    [new CannotBlockSelfException(), 400],
    [new InvalidBlockTargetException(), 400],
    [new UserNotFoundException(), 404],
    [new UserAlreadyBlockedException(), 409],
  ])('POST propaga %s con código %i', async (error, status) => {
    mockService.block.mockRejectedValue(error);
    await expect(controller.block({ userId: OTHER }, user)).rejects.toBe(error);
    expect(error.statusCode).toBe(status);
  });

  it('DELETE sin bloqueo → 404', async () => {
    const error = new BlockNotFoundException();
    mockService.unblock.mockRejectedValue(error);
    await expect(controller.unblock(OTHER, user)).rejects.toBe(error);
    expect(error.statusCode).toBe(404);
  });

  it('el esquema del body exige un UUID válido y no acepta campos extra', () => {
    expect(blockUserSchema.safeParse({ userId: OTHER }).success).toBe(true);
    expect(blockUserSchema.safeParse({ userId: 'abc' }).success).toBe(false);
    expect(blockUserSchema.safeParse({}).success).toBe(false);
    expect(blockUserSchema.safeParse({ userId: OTHER, extra: 1 }).success).toBe(false);
  });
});
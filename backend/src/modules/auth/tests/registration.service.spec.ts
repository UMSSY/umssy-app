import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegistrationService } from '../services/registration.service.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';

describe('RegistrationService', () => {
  const tx = { user: { findFirst: vi.fn(), create: vi.fn() }, role: { upsert: vi.fn() } };
  const prisma = { $transaction: vi.fn(async (callback) => callback(tx)) };
  const service = new RegistrationService(prisma as unknown as PrismaService);
  const dto = { firstName: 'Ana', lastName: 'Perez', email: 'ANA@example.com', password: 'Prueba123', roleTag: 'estudiante' as const };

  beforeEach(() => {
    vi.clearAllMocks();
    tx.user.findFirst.mockResolvedValue(null);
    tx.role.upsert.mockResolvedValue({ id: 'role-1' });
    tx.user.create.mockResolvedValue({ id: 'user-1', email: 'ana@example.com' });
  });

  it('guarda una contraseña cifrada y asigna el rol sin exponer la contraseña', async () => {
    const result = await service.register(dto);
    const { data } = tx.user.create.mock.calls[0][0];
    expect(await bcrypt.compare(dto.password, data.password)).toBe(true);
    expect(data.email).toBe('ana@example.com');
    expect(data.roles.create.roleId).toBe('role-1');
    expect(result).toEqual({ id: 'user-1', email: 'ana@example.com', roleTag: 'estudiante' });
  });

  it('rechaza un correo existente sin crear otro usuario', async () => {
    tx.user.findFirst.mockResolvedValue({ id: 'existing' });
    await expect(service.register(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(tx.user.create).not.toHaveBeenCalled();
  });

  it('maneja registros concurrentes del mismo correo', async () => {
    tx.user.create.mockRejectedValueOnce({ code: 'P2002' });
    await expect(service.register(dto)).rejects.toBeInstanceOf(ConflictException);
  });
});

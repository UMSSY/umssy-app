import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import type { Prisma } from '../../../prisma/client.js';
import type { ProductionSeedResponse } from '../../../common/types/production-seed-response.types.js';

export async function seedProductionAdmin(
  tx: Prisma.TransactionClient,
  email: string,
): Promise<ProductionSeedResponse> {
  const existing = await tx.user.findUnique({
    where: { email },
    select: { id: true, isActive: true },
  });
  if (existing) {
    if (!existing.isActive)
      throw new Error(
        'La cuenta administrativa está desactivada; no se modificó su estado',
      );
    const assignment = await tx.userRole.findFirst({
      where: {
        userId: existing.id,
        deletedAt: null,
        startAt: { lte: new Date() },
        role: { name: 'administrativo' },
      },
    });
    if (!assignment)
      throw new Error(
        'El correo ya pertenece a un usuario sin rol administrativo; no se modificó su cuenta',
      );
    return { email, password: null, isCreated: false };
  }
  const otherAdmin = await tx.userRole.findFirst({
    where: { deletedAt: null, role: { name: 'administrativo' } },
  });
  if (otherAdmin)
    throw new Error(
      'Ya existe un administrador; utilice su correo para repetir la inicialización',
    );
  const password = randomBytes(24).toString('base64url');
  const role = await tx.role.findUniqueOrThrow({
    where: { name: 'administrativo' },
    select: { id: true },
  });
  const user = await tx.user.create({
    data: {
      email,
      firstName: 'Administrador',
      lastName: 'UMSSY',
      password: await bcrypt.hash(password, 12),
      isActive: true,
    },
    select: { id: true },
  });
  await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
  return { email, password, isCreated: true };
}

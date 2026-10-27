import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';
import type { AccessRequestModel } from '../../../prisma/models.js';

@Injectable()
export class ApprovedAccountActivationRepository {
  constructor(private readonly prisma: PrismaService) {}

  withIdentityLock<T>(action: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL TIME ZONE 'UTC'`;
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(1436)::text`;
      return action(tx);
    });
  }

  async findApprovedOtp(tx: Prisma.TransactionClient, requestId: string) {
    const [otp] = await tx.$queryRaw<
      { id: string; codeHash: string; attempts: number; valid: boolean }[]
    >`
      SELECT o.id, o.code_hash AS "codeHash", o.attempts, (o.used_at IS NULL AND o.expires_at > clock_timestamp()) AS valid
      FROM activation_otps o JOIN access_requests ar ON ar.id = o.access_request_id
      JOIN access_request_statuses s ON s.id = ar.status_id
      WHERE ar.id = ${requestId}::uuid AND s.title = 'approved'
      ORDER BY o.created_at DESC, o.id DESC LIMIT 1 FOR UPDATE OF o, ar`;
    return otp;
  }

  findRequest(tx: Prisma.TransactionClient, id: string) {
    return tx.accessRequest.findUniqueOrThrow({ where: { id } });
  }
  recordFailedAttempt(tx: Prisma.TransactionClient, id: string) {
    return tx.activationOtp.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }
  findUser(tx: Prisma.TransactionClient, email: string) {
    return tx.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
  }
  findOtherApproval(
    tx: Prisma.TransactionClient,
    userId: string,
    requestId: string,
  ) {
    return tx.accessRequest.findFirst({
      where: { approvedUserId: userId, NOT: { id: requestId } },
    });
  }
  createUser(
    tx: Prisma.TransactionClient,
    request: AccessRequestModel,
    password: string,
  ) {
    return tx.user.create({
      data: {
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email.toLowerCase(),
        password,
      },
    });
  }
  setPassword(tx: Prisma.TransactionClient, id: string, password: string) {
    return tx.user.update({ where: { id }, data: { password } });
  }

  async completeActivation(
    tx: Prisma.TransactionClient,
    requestId: string,
    otpId: string,
    userId: string,
  ) {
    const role = await tx.role.upsert({
      where: { name: 'titulado' },
      create: { name: 'titulado' },
      update: {},
    });
    await tx.$executeRaw`INSERT INTO user_roles(id, user_id, role_id, start_at, created_at, updated_at)
      SELECT gen_random_uuid(), ${userId}::uuid, ${role.id}::uuid, clock_timestamp(), clock_timestamp(), clock_timestamp()
      WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = ${userId}::uuid AND role_id = ${role.id}::uuid
        AND deleted_at IS NULL AND start_at <= clock_timestamp())`;
    await tx.accessRequest.update({
      where: { id: requestId },
      data: { approvedUserId: userId },
    });
    await tx.activationOtp.update({
      where: { id: otpId },
      data: { usedAt: new Date() },
    });
  }
}

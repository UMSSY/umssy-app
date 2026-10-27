import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { ApprovedAccountActivationException } from '../exceptions/approved-account-activation.exception.js';
import type { ActivateApprovedAccountDto } from '../requests/activate-approved-account.schema.js';

@Injectable()
export class ApprovedAccountActivationService {
  constructor(private readonly prisma: PrismaService) {}

  async activate(requestId: string, input: ActivateApprovedAccountDto) {
    const password = await bcrypt.hash(input.password, 10);
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL TIME ZONE 'UTC'`;
      // Serialize identity linking with HU7 eligibility/capacity calculations.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(1436)::text`;
      const [otp] = await tx.$queryRaw<
        { id: string; codeHash: string; attempts: number; valid: boolean }[]
      >`
        SELECT o.id, o.code_hash AS "codeHash", o.attempts,
          (o.used_at IS NULL AND o.expires_at > clock_timestamp()) AS valid
        FROM activation_otps o JOIN access_requests ar ON ar.id = o.access_request_id
        JOIN access_request_statuses s ON s.id = ar.status_id
        WHERE ar.id = ${requestId}::uuid AND s.title = 'approved'
        ORDER BY o.created_at DESC, o.id DESC LIMIT 1 FOR UPDATE OF o, ar`;
      if (!otp || !otp.valid || otp.attempts >= 5) return false;
      const request = await tx.accessRequest.findUniqueOrThrow({
        where: { id: requestId },
      });
      const matching = await bcrypt.compare(input.code, otp.codeHash);
      if (!matching) {
        await tx.activationOtp.update({
          where: { id: otp.id },
          data: { attempts: { increment: 1 } },
        });
        return false;
      }
      const existing = await tx.user.findFirst({
        where: { email: { equals: request.email, mode: 'insensitive' } },
      });
      if (request.approvedUserId && request.approvedUserId !== existing?.id)
        return false;
      // A code sent to an email address must not overwrite an existing account's
      // credentials. Linking also requires that account's current password.
      if (
        existing &&
        (!existing.isActive ||
          (existing.password &&
            !(await bcrypt.compare(input.password, existing.password))))
      ) {
        await tx.activationOtp.update({
          where: { id: otp.id },
          data: { attempts: { increment: 1 } },
        });
        return false;
      }
      if (
        existing &&
        (await tx.accessRequest.findFirst({
          where: { approvedUserId: existing.id, NOT: { id: requestId } },
        }))
      )
        return false;
      const user =
        existing ??
        (await tx.user.create({
          data: {
            firstName: request.firstName,
            lastName: request.lastName,
            email: request.email.toLowerCase(),
            password,
          },
        }));
      if (existing && !existing.password)
        await tx.user.update({ where: { id: user.id }, data: { password } });
      const role = await tx.role.upsert({
        where: { name: 'titulado' },
        create: { name: 'titulado' },
        update: {},
      });
      if (
        !(await tx.userRole.findFirst({
          where: {
            userId: user.id,
            roleId: role.id,
            deletedAt: null,
            startAt: { lte: new Date() },
          },
        }))
      ) {
        await tx.userRole.create({
          data: { userId: user.id, roleId: role.id },
        });
      }
      await tx.accessRequest.update({
        where: { id: requestId },
        data: { approvedUserId: user.id },
      });
      await tx.activationOtp.update({
        where: { id: otp.id },
        data: { usedAt: new Date() },
      });
      return true;
    });
    if (!result) throw new ApprovedAccountActivationException();
    return { activated: true };
  }
}

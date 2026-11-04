import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

const STUDENT_ROLES = new Set(['estudiante', 'titulado']);

@Injectable()
export class ChatRolePolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanCommunicate(
    userId: string,
    contactId: string,
  ): Promise<'application' | void> {
    const ids = [
      userId.trim().toLowerCase(),
      contactId.trim().toLowerCase(),
    ];

    if (ids[0] === ids[1]) {
      return this.deny();
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: ids },
      },
      select: {
        id: true,
        isActive: true,
        companyId: true,
        roles: {
          where: { deletedAt: null },
          select: {
            role: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (
      users.length !== 2 ||
      users.some((user) => !user.isActive)
    ) {
      return this.deny();
    }

    const roles = users.map((user) =>
      user.roles.map(({ role }) =>
        role.name.trim().toLowerCase(),
      ),
    );

    const students = roles.map(
      (names) =>
        names.length > 0 &&
        names.every((name) => STUDENT_ROLES.has(name)),
    );

    const companies = roles.map(
      (names) =>
        names.length > 0 &&
        names.every((name) => name === 'empresa'),
    );

    // Entre estudiantes y titulados se conserva el flujo existente.
    if (students[0] && students[1]) {
      return;
    }

    // Identificar al postulante y al reclutador en ambos sentidos.
    const studentIndex =
      students[0] && companies[1]
        ? 0
        : students[1] && companies[0]
          ? 1
          : -1;

    if (studentIndex < 0) {
      return this.deny();
    }

    const student = users[studentIndex];
    const recruiter = users[1 - studentIndex];

    if (!recruiter.companyId) {
      return this.deny();
    }

    // La postulación debe corresponder a la empresa del reclutador.
    const application = await this.prisma.jobApplication.findFirst({
      where: {
        userId: student.id,
        jobOffer: {
          companyId: recruiter.companyId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!application) {
      return this.deny();
    }

    return 'application';
  }

  private deny(): never {
    throw new ForbiddenException(
      'El chat requiere roles permitidos o una postulación previa a una vacante de la empresa del reclutador.',
    );
  }
}
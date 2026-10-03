import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthenticatedUser } from '../decorators/roles.decorator.js';
import { UnauthorizedSessionException } from '../exceptions/unauthorized-session.exception.js';

// PROVISIONAL (B-07): reemplazar cuando Epic 1 entregue su guard.

interface LoginJwtPayload {
  sub: string;
  roleTag: string;
}

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class ProvisionalSessionGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = request.headers['authorization'];

    if (typeof header !== 'string' || !header.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedSessionException(
        'Falta el header Authorization: Bearer <token>',
      );
    }

    const token = header.slice(BEARER_PREFIX.length);
    let payload: LoginJwtPayload;
    try {
      payload = this.jwtService.verify<LoginJwtPayload>(token);
    } catch {
      throw new UnauthorizedSessionException('Token inválido o expirado');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, isActive: true },
      select: {
        id: true,
        email: true,
        roles: {
          // Solo roles vigentes: sin borrado lógico y ya iniciados
          where: { deletedAt: null, startAt: { lte: new Date() } },
          select: { role: { select: { name: true } } },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedSessionException('Usuario no encontrado o inactivo');
    }

    const authenticated: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      roles: user.roles.map((userRole) => userRole.role.name),
    };
    request.user = authenticated;

    return true;
  }
}

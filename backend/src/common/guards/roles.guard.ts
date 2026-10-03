import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser, ROLES_KEY } from '../decorators/roles.decorator.js';
import { UnauthorizedSessionException } from '../exceptions/unauthorized-session.exception.js';
import { ForbiddenRoleException } from '../exceptions/forbidden-role.exception.js';

/**
 * Permanente: no depende de cómo se autentique el usuario, solo de que
 * `request.user` tenga la forma AuthenticatedUser.
 * Debe ejecutarse DESPUÉS del guard de sesión:
 * @UseGuards(ProvisionalSessionGuard, RolesGuard)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // El rol del método tiene prioridad sobre el del controlador
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Sin @Roles: basta con estar autenticado
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user: AuthenticatedUser | undefined = context
      .switchToHttp()
      .getRequest().user;

    // Si llega sin usuario, el guard de sesión no corrió antes
    if (!user) {
      throw new UnauthorizedSessionException('Sesión requerida');
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      throw new ForbiddenRoleException();
    }

    return true;
  }
}

import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiExtension } from '@nestjs/swagger';
import { ROLES_KEY } from '../constants/roles.constants.js';
import { RoleName } from '../enums/roles.enum.js';

export const Roles = (...roles: RoleName[]) =>
  applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    ApiExtension('x-required-roles', roles),
  );

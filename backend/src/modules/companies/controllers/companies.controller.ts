import {
  applyDecorators,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  INTERNAL_ERROR_RESPONSE,
  UNAUTHENTICATED_RESPONSE,
} from '../../../common/constants/api-error-swagger.constants.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { RequestValidationException } from '../../../common/exceptions/request-validation.exception.js';
import { CompanyOwnershipGuard } from '../../../common/guards/company-ownership.guard.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { COMPANY_VALIDATION_MESSAGES } from '../constants/company-profile.constants.js';
import {
  GET_COMPANY_PROFILE_ERROR_RESPONSES,
  GET_COMPANY_PROFILE_OK_RESPONSE,
} from '../constants/company-swagger.constants.js';
import type { CompanyProfileResponse } from '../responses/company-profile.response.js';
import { CompaniesService } from '../services/companies.service.js';

const companyIdPipe = new ParseUUIDPipe({
  exceptionFactory: () =>
    new RequestValidationException([
      {
        field: 'companyId',
        message: COMPANY_VALIDATION_MESSAGES.INVALID_COMPANY_ID,
      },
    ]),
});

@ApiTags('companies')
@Controller()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('companies/:companyId/profile')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyOwnershipGuard)
  @ApiBearerAuth()
  @Roles('empresa')
  @ApiOperation({
    operationId: 'getCompanyProfile',
    summary: 'Obtiene el perfil institucional de la empresa de la sesión',
    description:
      'Devuelve nombre, descripción, sector, ciudad, contacto, sitio web y la ruta del logo. Solo lectura.',
  })
  @ApiParam({
    name: 'companyId',
    format: 'uuid',
    description: 'UUID de la empresa de la sesión',
    example: '5f0c8a52-3d4b-4c1e-9a7f-2b6d8e1c4a90',
  })
  @ApiResponse(GET_COMPANY_PROFILE_OK_RESPONSE)
  @ApiResponse(UNAUTHENTICATED_RESPONSE)
  @ApiResponse(INTERNAL_ERROR_RESPONSE)
  @applyDecorators(
    ...GET_COMPANY_PROFILE_ERROR_RESPONSES.map((options) =>
      ApiResponse(options),
    ),
  )
  getProfile(
    @Param('companyId', companyIdPipe) companyId: string,
  ): Promise<CompanyProfileResponse> {
    return this.companiesService.getProfile(companyId);
  }
}

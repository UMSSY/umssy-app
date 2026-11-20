import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { UploadedDocumentFile } from '../../access-requests/types/uploaded-file.types.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import { BACKOFFICE_ROLE } from '../../access-requests/constants/backoffice.constants.js';
import { DocumentUploadInterceptor } from '../../access-requests/interceptors/document-upload.interceptor.js';
import {
  activateCompanyAccountSchema,
  createCompanyAccessRequestSchema,
  listCompanyAccessRequestsQuerySchema,
  rejectCompanyAccessRequestSchema,
  reportInconsistencySchema,
  requestCorrectionSchema,
  updateCompanyAccessRequestSchema,
  type ActivateCompanyAccountDto,
  type CreateCompanyAccessRequestDto,
  type ListCompanyAccessRequestsQuery,
  type RejectCompanyAccessRequestDto,
  type ReportInconsistencyDto,
  type RequestCorrectionDto,
  type UpdateCompanyAccessRequestDto,
} from '../requests/create-company-access-request.schema.js';
import { CompanyAccessRequestsService } from '../services/company-access-requests.service.js';

interface BinaryResponse {
  set: (headers: Record<string, string>) => unknown;
  end: (body: Buffer) => unknown;
}

@Controller()
export class CompanyAccessRequestsController {
  constructor(
    private readonly companyRequestsService: CompanyAccessRequestsService,
  ) {}

  @Get('cities')
  listCities() {
    return this.companyRequestsService.listCities();
  }

  @Post('company-access-requests')
  create(
    @Body(new ZodValidationPipe(createCompanyAccessRequestSchema))
    body: CreateCompanyAccessRequestDto,
  ) {
    return this.companyRequestsService.create(body);
  }

  @Post('company-access-requests/:id/logo')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }),
  )
  attachLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadedDocumentFile | undefined,
  ) {
    return this.companyRequestsService.attachLogo(id, file);
  }

  @Post('company-access-requests/:id/document')
  @UseInterceptors(
    DocumentUploadInterceptor,
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  attachDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadedDocumentFile | undefined,
  ) {
    return this.companyRequestsService.attachDocument(id, file);
  }

  @Post('company-access-requests/:id/submit')
  submit(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyRequestsService.submit(id);
  }

  @Get('company-access-requests/status/:code')
  getStatus(@Param('code') code: string, @Query('email') email: string) {
    return this.companyRequestsService.getStatus(code, email ?? '');
  }

  @Get('company-access-requests/activation-status')
  getActivationStatus(
    @Query('email') email?: string,
    @Query('code') code?: string,
    @Query('otp') otp?: string,
  ) {
    return this.companyRequestsService.getActivationStatus(
      email ?? '',
      code,
      otp,
    );
  }

  @Post('company-access-requests/report-inconsistency')
  reportInconsistency(
    @Body(new ZodValidationPipe(reportInconsistencySchema))
    body: ReportInconsistencyDto,
  ) {
    return this.companyRequestsService.reportInconsistency(body);
  }

  @Post('company-access-requests/activate')
  activate(
    @Body(new ZodValidationPipe(activateCompanyAccountSchema))
    body: ActivateCompanyAccountDto,
  ) {
    return this.companyRequestsService.activate(body);
  }

  @Get('companies/:companyId/logo')
  async getPublicLogo(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Res() res: BinaryResponse,
  ) {
    const file =
      await this.companyRequestsService.getPublicCompanyLogo(companyId);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': String(file.content.length),
      'Cache-Control': 'public, max-age=3600',
    });
    res.end(file.content);
  }

  @Get('company-access-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BACKOFFICE_ROLE)
  list(
    @Query(new ZodValidationPipe(listCompanyAccessRequestsQuerySchema))
    query: ListCompanyAccessRequestsQuery,
  ) {
    return this.companyRequestsService.list(query);
  }

  @Get('company-access-requests/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BACKOFFICE_ROLE)
  getSummary() {
    return this.companyRequestsService.getSummary();
  }

  @Get('company-access-requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BACKOFFICE_ROLE)
  getDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyRequestsService.getDetail(id, user.id);
  }

  @Get('company-access-requests/:id/document')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BACKOFFICE_ROLE)
  async getDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: BinaryResponse,
  ) {
    const file = await this.companyRequestsService.getDocument(id);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': String(file.content.length),
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    });
    res.end(file.content);
  }

  @Get('company-access-requests/:id/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BACKOFFICE_ROLE)
  async getRequestLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: BinaryResponse,
  ) {
    const file = await this.companyRequestsService.getLogo(id);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': String(file.content.length),
    });
    res.end(file.content);
  }

  @Patch('company-access-requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BACKOFFICE_ROLE)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateCompanyAccessRequestSchema))
    body: UpdateCompanyAccessRequestDto,
  ) {
    return this.companyRequestsService.update(id, body);
  }

  @Post('company-access-requests/:id/re-evaluate-ocr')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BACKOFFICE_ROLE)
  reEvaluateOcr(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyRequestsService.reEvaluateOcr(id);
  }

  @Post('company-access-requests/:id/request-correction')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BACKOFFICE_ROLE)
  requestCorrection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(requestCorrectionSchema))
    body: RequestCorrectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyRequestsService.requestCorrection(id, user.id, body);
  }

  @Patch('company-access-requests/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BACKOFFICE_ROLE)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyRequestsService.approve(id, user.id);
  }

  @Patch('company-access-requests/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(BACKOFFICE_ROLE)
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(rejectCompanyAccessRequestSchema))
    body: RejectCompanyAccessRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyRequestsService.reject(id, user.id, body);
  }
}

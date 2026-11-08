import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { RadarIntegrationService } from '../services/radar-integration.service.js';
import { RequestValidationPipe } from '../../../common/pipes/request-validation.pipe.js';
import { toApiBody } from '../../../common/utils/to-api-body.js';
import { reviewKindSchema, reviewDecisionSchema, type ReviewDecisionRequest, type ReviewKind } from '../requests/radar-review.request.js';

@ApiTags('radar-integration')
@ApiBearerAuth()
@Controller('radar-integration')
@UseGuards(JwtAuthGuard)
export class RadarIntegrationController {
  constructor(private readonly svc:RadarIntegrationService){}
  @Get('me') me(@CurrentUserId() user:string){return this.svc.myRadar(user);}
  @Post('me/cv-rescan') rescan(@CurrentUserId() user:string){return this.svc.rescanCurrentCv(user);}
  @Post('me/recalculate') recalculate(@CurrentUserId() user:string){return this.svc.retry(user);}
  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @Get('admin/queue') queue(@CurrentUserId() admin:string){return this.svc.queue(admin);}
  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @ApiBody(toApiBody(reviewDecisionSchema))
  @Patch('admin/reviews/:kind/:id')
  decision(
    @CurrentUserId() admin: string,
    @Param('kind', new RequestValidationPipe(reviewKindSchema)) kind: ReviewKind,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new RequestValidationPipe(reviewDecisionSchema)) body: ReviewDecisionRequest,
  ) {
    return this.svc.decision(admin, kind, id, body.decision);
  }
  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @Post('admin/cv/:id/reprocess') reprocessCv(@CurrentUserId() admin:string,@Param('id',new ParseUUIDPipe()) id:string){
    return this.svc.reprocessCv(admin,id);
  }
  @UseGuards(RolesGuard)
  @Roles('administrativo')
  @Get('admin/cv/:id/file') async download(@CurrentUserId() admin:string,@Param('id',new ParseUUIDPipe()) id:string){
    const f=await this.svc.downloadForAdmin(admin,id);
    return new StreamableFile(f.buffer,{type:'application/pdf',disposition:'inline; filename="documento.pdf"'});
  }
}

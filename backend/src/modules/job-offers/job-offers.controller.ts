import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { JobOffersService } from './job-offers.service.js'

@Controller('api/v1/empresas/:empresaId/ofertas')
export class JobOffersController {
  constructor(private readonly jobOffersService: JobOffersService) {}

  @Post()
  @HttpCode(201)
  async create(
    @Param('empresaId') empresaId: string,
    @Body() payload: any
  ) {
    const result = await this.jobOffersService.create(empresaId, payload);
    return {
      statusCode: 201,
      data: result,
      detail: 'Operacion exitosa',
      ok: true,
    };
  }
}
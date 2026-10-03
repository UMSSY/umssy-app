import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe.js';
import {
  extractSkillsSchema,
  profileRequirementsSchema,
  vacanciesQuerySchema,
} from '../requests/job-connect.schema.js';
import { SkillDictionaryService } from '../services/skill-dictionary.service.js';
import { VacanciesService } from '../services/vacancies.service.js';

@Controller('job-connect')
export class JobConnectController {
  constructor(
    private readonly vacancies: VacanciesService,
    private readonly dictionary: SkillDictionaryService,
  ) {}

  @Get('vacancies')
  findActive(
    @Query(new ZodValidationPipe(vacanciesQuerySchema))
    query: ReturnType<typeof vacanciesQuerySchema.parse>,
  ) {
    return this.vacancies.findActive(query.page, query.limit);
  }

  @Post('skills/extract')
  @HttpCode(200)
  extract(
    @Body(new ZodValidationPipe(extractSkillsSchema))
    body: ReturnType<typeof extractSkillsSchema.parse>,
  ) {
    return this.dictionary.extract(body.text);
  }

  @Post('vacancies/:id/gap-analysis')
  @HttpCode(200)
  analyzeGap(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(profileRequirementsSchema))
    body: ReturnType<typeof profileRequirementsSchema.parse>,
  ) {
    return this.vacancies.analyzeGap(id, body);
  }
}

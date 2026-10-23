import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import {
  SURVEY_CREATED_SELECT,
  SURVEY_SUMMARY_SELECT,
} from '../constants/survey.constants.js';
import type { CreateSurveyData } from '../types/create-survey-data.type.js';
import type {
  SurveyCreatedRecord,
  SurveySummaryRecord,
  SurveyTitleScope,
} from '../types/survey-record.type.js';

@Injectable()
export class SurveysRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existsWithTitle({
    title,
    careerId,
    academicPeriod,
  }: SurveyTitleScope): Promise<boolean> {
    const survey = await this.prisma.survey.findFirst({
      where: {
        title: { equals: title, mode: 'insensitive' },
        careerId,
        academicPeriod,
      },
      select: { id: true },
    });
    return survey !== null;
  }

  create(data: CreateSurveyData): Promise<SurveyCreatedRecord> {
    const { questions, ...survey } = data;
    const questionRows = questions.map((question, index) => ({
      id: randomUUID(),
      position: index + 1,
      statement: question.statement,
      type: question.type,
      isRequired: question.isRequired,
    }));
    const optionRows = questions.flatMap((question, questionIndex) =>
      question.options.map((option, optionIndex) => ({
        questionId: questionRows[questionIndex].id,
        position: optionIndex + 1,
        label: option.label,
      })),
    );

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.survey.create({
        data: survey,
        select: SURVEY_CREATED_SELECT,
      });

      if (questionRows.length > 0) {
        await tx.surveyQuestion.createMany({
          data: questionRows.map((row) => ({ ...row, surveyId: created.id })),
        });
      }

      if (optionRows.length > 0) {
        await tx.surveyQuestionOption.createMany({ data: optionRows });
      }

      return created;
    });
  }

  findAll(): Promise<SurveySummaryRecord[]> {
    return this.prisma.survey.findMany({
      select: SURVEY_SUMMARY_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }
}

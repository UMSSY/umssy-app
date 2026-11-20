import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';
import {
  FORMAL_GRADUATE_ANSWERED_SURVEY_INDEXES,
  FORMAL_GRADUATES,
  FORMAL_SECONDARY_ADMIN_EMAIL,
  FORMAL_SEED_PASSWORD_HASH,
  FORMAL_SURVEY_DEFINITIONS,
  FORMAL_SURVEY_OWNERS,
} from '../constants/formal-survey-fixtures.constants.js';
import type { FormalSurveyDefinition } from '../types/formal-survey-definition.type.js';
import {
  SurveyQuestionType,
  SurveyStatus,
  SurveyTargetAudience,
} from '../types/survey.enum.js';

const HOUR_MS = 60 * 60 * 1000;
const formalId = (context: FixtureContext, key: string) =>
  context.getId(`formal-${key}`);

export async function seedFormalSurveysAndStudents(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const anchor = context.anchor;
  const publishedStatus = await tx.surveyStatus.findUniqueOrThrow({
    where: { title: SurveyStatus.PUBLISHED },
  });
  const audience = await tx.surveyTargetAudience.findUniqueOrThrow({
    where: { title: SurveyTargetAudience.GRADUATES },
  });
  const singleChoiceType = await tx.surveyQuestionType.findUniqueOrThrow({
    where: { title: SurveyQuestionType.SINGLE_CHOICE },
  });
  const multipleChoiceType = await tx.surveyQuestionType.findUniqueOrThrow({
    where: { title: SurveyQuestionType.MULTIPLE_CHOICE },
  });
  const graduateRole = await tx.role.findUniqueOrThrow({
    where: { name: 'titulado' },
  });
  const defaultCity = await tx.city.findFirstOrThrow();
  const approvedStatus = await tx.accessRequestStatus.findFirstOrThrow({
    where: { title: { equals: 'approved', mode: 'insensitive' } },
  });
  const secondaryAdmin = await tx.user.findUniqueOrThrow({
    where: { email: FORMAL_SECONDARY_ADMIN_EMAIL },
    select: { id: true },
  });
  const ownerIds: Record<(typeof FORMAL_SURVEY_OWNERS)[number], string> = {
    admin1: context.adminId,
    admin2: secondaryAdmin.id,
  };

  const graduateIds = FORMAL_GRADUATES.map((graduate) =>
    formalId(context, graduate.key),
  );
  for (const [index, graduate] of FORMAL_GRADUATES.entries()) {
    const graduateId = graduateIds[index]!;
    const career = await tx.career.findFirstOrThrow({
      where: { title: graduate.career },
    });

    await tx.user.upsert({
      where: { email: graduate.email },
      create: {
        id: graduateId,
        email: graduate.email,
        firstName: graduate.firstName,
        lastName: graduate.lastName,
        password: FORMAL_SEED_PASSWORD_HASH,
        isActive: true,
        cityId: defaultCity.id,
        headline: `Titulado de ${graduate.degree}`,
        aboutMe: `Perfil profesional de ${graduate.firstName} ${graduate.lastName}, titulado de ${graduate.career} en la Facultad de Ciencias y Tecnología (UMSS).`,
        createdAt: anchor,
        updatedAt: anchor,
      },
      update: {},
    });
    await tx.userRole.createMany({
      data: [
        {
          id: formalId(context, `role-graduate-${graduate.key}`),
          userId: graduateId,
          roleId: graduateRole.id,
        },
      ],
      skipDuplicates: true,
    });
    await tx.education.createMany({
      data: [
        {
          id: formalId(context, `edu-${graduate.key}`),
          userId: graduateId,
          institution: 'Universidad Mayor de San Simón (UMSS)',
          degree: graduate.degree,
          startDate: new Date('2020-02-01T00:00:00.000Z'),
          endDate: new Date('2025-11-30T00:00:00.000Z'),
          description: 'Graduado de la Facultad de Ciencias y Tecnología.',
          createdAt: anchor,
          updatedAt: anchor,
        },
      ],
      skipDuplicates: true,
    });
    await tx.accessRequest.createMany({
      data: [
        {
          id: formalId(context, `req-${graduate.key}`),
          requestCode: `FORMAL-TIT-2026-${String(index + 1).padStart(4, '0')}`,
          email: graduate.email,
          firstName: graduate.firstName,
          lastName: graduate.lastName,
          idCardNumber: `910000${index + 1}`,
          idCardIssuedIn: 'CB',
          sisCode: `20200000${index + 1}`,
          birthDate: new Date('2000-05-15T00:00:00.000Z'),
          careerId: career.id,
          statusId: approvedStatus.id,
          approvedUserId: graduateId,
          graduationYear: 2025,
          submittedAt: anchor,
          reviewedAt: anchor,
        },
      ],
      skipDuplicates: true,
    });
  }

  const questionTypeId = (type: SurveyQuestionType) =>
    type === SurveyQuestionType.MULTIPLE_CHOICE
      ? multipleChoiceType.id
      : singleChoiceType.id;

  for (const owner of FORMAL_SURVEY_OWNERS) {
    const surveyKey = (definition: FormalSurveyDefinition) =>
      `${owner}-${definition.keySuffix}`;

    for (const definition of FORMAL_SURVEY_DEFINITIONS) {
      const key = surveyKey(definition);
      const surveyId = formalId(context, key);
      const schedule = definition.computeSchedule(anchor);

      await tx.survey.createMany({
        data: [
          {
            id: surveyId,
            title: definition.title,
            description: definition.description,
            careerId: null,
            targetsAllCareers: true,
            academicPeriod: 'Todas',
            targetAudienceId: audience.id,
            statusId: publishedStatus.id,
            createdById: ownerIds[owner],
            opensAt: schedule.opensAt,
            closesAt: schedule.closesAt,
            closingSoonNotifiedAt: schedule.closingSoonNotifiedAt,
            closedNotifiedAt: schedule.closedNotifiedAt,
            createdAt: schedule.opensAt,
            updatedAt: anchor,
          },
        ],
        skipDuplicates: true,
      });
      await tx.surveyAlertConfig.createMany({
        data: [
          {
            id: formalId(context, `alert-${key}`),
            surveyId,
            isEnabled: true,
            threshold: 10,
          },
        ],
        skipDuplicates: true,
      });
      await tx.surveyQuestion.createMany({
        data: definition.questions.map((question, questionIndex) => ({
          id: formalId(context, `${key}-q${questionIndex}`),
          surveyId,
          position: questionIndex + 1,
          statement: question.statement,
          typeId: questionTypeId(question.type),
          isRequired: true,
        })),
        skipDuplicates: true,
      });
      await tx.surveyQuestionOption.createMany({
        data: definition.questions.flatMap((question, questionIndex) =>
          question.options.map((label, optionIndex) => ({
            id: formalId(context, `${key}-q${questionIndex}-opt${optionIndex}`),
            questionId: formalId(context, `${key}-q${questionIndex}`),
            position: optionIndex + 1,
            label,
          })),
        ),
        skipDuplicates: true,
      });
    }

    for (const [graduateIndex, graduateId] of graduateIds.entries()) {
      for (const surveyIndex of FORMAL_GRADUATE_ANSWERED_SURVEY_INDEXES[graduateIndex]!) {
        const definition = FORMAL_SURVEY_DEFINITIONS[surveyIndex]!;
        const key = surveyKey(definition);
        const responseId = formalId(context, `resp-${key}-${graduateIndex}`);
        const schedule = definition.computeSchedule(anchor);
        const submittedAt =
          surveyIndex === 0
            ? new Date(schedule.closesAt.getTime() - 2 * HOUR_MS)
            : new Date(anchor.getTime() - ((graduateIndex + 1) * HOUR_MS) / 2);

        await tx.surveyResponse.createMany({
          data: [
            {
              id: responseId,
              surveyId: formalId(context, key),
              respondentId: graduateId,
              submittedAt,
              createdAt: submittedAt,
              updatedAt: submittedAt,
            },
          ],
          skipDuplicates: true,
        });
        await tx.surveyAnswer.createMany({
          data: definition.questions.flatMap((question, questionIndex) => {
            const firstOption = (graduateIndex + questionIndex) % question.options.length;
            const selected =
              question.type === SurveyQuestionType.MULTIPLE_CHOICE
                ? [firstOption, (firstOption + 1) % question.options.length]
                : [firstOption];
            return selected.map((optionIndex) => ({
              id: formalId(context, `ans-${key}-${graduateIndex}-q${questionIndex}-opt${optionIndex}`),
              responseId,
              questionId: formalId(context, `${key}-q${questionIndex}`),
              optionId: formalId(context, `${key}-q${questionIndex}-opt${optionIndex}`),
              createdAt: submittedAt,
              updatedAt: submittedAt,
            }));
          }),
          skipDuplicates: true,
        });
      }
    }
  }

  return FORMAL_SURVEY_OWNERS.length * FORMAL_SURVEY_DEFINITIONS.length;
}

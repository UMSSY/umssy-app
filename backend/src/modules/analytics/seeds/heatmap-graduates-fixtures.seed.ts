import type { FixtureContext } from '../../../common/database/fixture-context.js';
import type { Prisma } from '../../../prisma/client.js';
import { ACCESS_REQUEST_STATUS } from '../../access-requests/types/access-request.enum.js';
import { SurveyQuestionType, SurveyStatus, SurveyTargetAudience } from '../../surveys/types/survey.enum.js';
import {
  EMPLOYMENT_STATUS_QUESTION,
  MONTHLY_SALARY_QUESTION,
} from '../constants/heatmap.constants.js';
import {
  HEATMAP_SEED_PASSWORD_HASH,
  HEATMAP_SEED_SURVEY,
  HEATMAP_SEED_SURVEY_OPENS_AT,
} from '../constants/heatmap-seed.constants.js';
import type { HeatmapSeedGraduate } from '../types/heatmap-seed.types.js';
import { buildHeatmapSeedPlan } from '../utils/heatmap-seed-plan.util.js';

const SURVEY_QUESTIONS = [
  { statement: EMPLOYMENT_STATUS_QUESTION, isRequired: true, options: HEATMAP_SEED_SURVEY.employmentOptions },
  { statement: MONTHLY_SALARY_QUESTION, isRequired: false, options: HEATMAP_SEED_SURVEY.salaryOptions },
] as const;

const pad = (value: number, size: number) => String(value).padStart(size, '0');
const graduateKey = (graduate: HeatmapSeedGraduate) => `heatmap-graduate-${pad(graduate.number, 3)}`;
const surveyKey = `survey-${HEATMAP_SEED_SURVEY.key}`;
const questionKey = (questionIndex: number) => `${surveyKey}-question-${questionIndex}`;
const optionKey = (questionIndex: number, optionIndex: number) => `${questionKey(questionIndex)}-option-${optionIndex}`;

async function seedGraduates(tx: Prisma.TransactionClient, context: FixtureContext, plan: HeatmapSeedGraduate[]) {
  const reviewedAt = context.getDate('anchor', -20160, false);
  await tx.user.createMany({
    data: plan.map((graduate) => ({
      id: context.getId(graduateKey(graduate)),
      firstName: graduate.firstName,
      lastName: graduate.lastName,
      email: `seed.heatmap${pad(graduate.number, 3)}@umssy.test`,
      password: HEATMAP_SEED_PASSWORD_HASH,
      isActive: true,
      headline: 'Perfil ficticio: titulado',
      aboutMe: `[UMSSY SEED V1] Titulado ficticio ${pad(graduate.number, 3)} para los mapas de calor. No representa a una persona real.`,
      createdAt: context.anchor,
      updatedAt: context.anchor,
    })),
    skipDuplicates: true,
  });
  await tx.userRole.createMany({
    data: plan.map((graduate) => ({
      id: context.getId(`${graduateKey(graduate)}-role`),
      userId: context.getId(graduateKey(graduate)),
      roleId: context.getReference('roles', 'titulado'),
      startAt: reviewedAt,
    })),
    skipDuplicates: true,
  });
  await tx.accessRequest.createMany({
    data: plan.map((graduate) => ({
      id: context.getId(`${graduateKey(graduate)}-access-request`),
      requestCode: `SEED-HM-${pad(graduate.number, 4)}`,
      firstName: graduate.firstName,
      lastName: graduate.lastName,
      idCardNumber: `0007${pad(graduate.number, 6)}`,
      idCardIssuedIn: 'CB',
      sisCode: `0006${pad(graduate.number, 6)}`,
      email: `seed.heatmap${pad(graduate.number, 3)}@umssy.test`,
      phone: `0002${pad(graduate.number, 4)}`,
      birthDate: new Date(`${graduate.graduationYear - 24}-05-10T00:00:00.000Z`),
      graduationYear: graduate.graduationYear,
      careerId: context.getReference('careers', graduate.career),
      statusId: context.getReference('access_request_statuses', ACCESS_REQUEST_STATUS.APPROVED),
      submittedAt: context.getDate('anchor', -30240, false),
      openedById: context.adminId,
      openedAt: context.getDate('anchor', -25920, false),
      reviewedById: context.adminId,
      reviewedAt,
      approvedUserId: context.getId(graduateKey(graduate)),
    })),
    skipDuplicates: true,
  });
}

async function seedProfiles(tx: Prisma.TransactionClient, context: FixtureContext, plan: HeatmapSeedGraduate[]) {
  await tx.userSkill.createMany({
    data: plan.flatMap((graduate) =>
      graduate.skills.map((skill) => ({
        id: context.getId(`${graduateKey(graduate)}-skill-${skill.name}`),
        userId: context.getId(graduateKey(graduate)),
        skillId: context.getReference('skills', skill.name),
        source: skill.source,
      })),
    ),
    skipDuplicates: true,
  });
  await tx.workExperience.createMany({
    data: plan.flatMap((graduate) =>
      graduate.workExperiences.map((experience, index) => ({
        id: context.getId(`${graduateKey(graduate)}-work-${index}`),
        userId: context.getId(graduateKey(graduate)),
        companyId: context.getReference('companies', experience.company),
        position: experience.position,
        startDate: experience.startDate,
        endDate: experience.endDate,
        isCurrent: experience.endDate === null,
      })),
    ),
    skipDuplicates: true,
  });
}

async function seedSurvey(tx: Prisma.TransactionClient, context: FixtureContext, plan: HeatmapSeedGraduate[]) {
  await tx.survey.createMany({
    data: [
      {
        id: context.getId(surveyKey),
        title: HEATMAP_SEED_SURVEY.title,
        description: HEATMAP_SEED_SURVEY.description,
        targetsAllCareers: true,
        opensAt: new Date(HEATMAP_SEED_SURVEY_OPENS_AT),
        closesAt: context.getDate('anchor', 365 * 1440, false),
        statusId: context.getReference('survey_statuses', SurveyStatus.PUBLISHED),
        targetAudienceId: context.getReference('survey_target_audiences', SurveyTargetAudience.GRADUATES),
        createdById: context.adminId,
        createdAt: new Date(HEATMAP_SEED_SURVEY_OPENS_AT),
      },
    ],
    skipDuplicates: true,
  });
  await tx.surveyQuestion.createMany({
    data: SURVEY_QUESTIONS.map((question, questionIndex) => ({
      id: context.getId(questionKey(questionIndex)),
      surveyId: context.getId(surveyKey),
      position: questionIndex + 1,
      statement: question.statement,
      typeId: context.getReference('survey_question_types', SurveyQuestionType.SINGLE_CHOICE),
      isRequired: question.isRequired,
    })),
    skipDuplicates: true,
  });
  await tx.surveyQuestionOption.createMany({
    data: SURVEY_QUESTIONS.flatMap((question, questionIndex) =>
      question.options.map((label, optionIndex) => ({
        id: context.getId(optionKey(questionIndex, optionIndex)),
        questionId: context.getId(questionKey(questionIndex)),
        position: optionIndex + 1,
        label,
      })),
    ),
    skipDuplicates: true,
  });

  const respondents = plan.filter((graduate) => graduate.response !== null);
  await tx.surveyResponse.createMany({
    data: respondents.map((graduate) => ({
      id: context.getId(`${surveyKey}-response-${graduateKey(graduate)}`),
      surveyId: context.getId(surveyKey),
      respondentId: context.getId(graduateKey(graduate)),
      submittedAt: graduate.response!.submittedAt,
    })),
    skipDuplicates: true,
  });
  const answers = respondents.flatMap((graduate) => {
    const { employmentOptionIndex, salaryOptionIndex } = graduate.response!;
    const selected: [number, number][] = [[0, employmentOptionIndex]];
    if (salaryOptionIndex !== null) selected.push([1, salaryOptionIndex]);
    return selected.map(([questionIndex, optionIndex]) => ({
      id: context.getId(`${surveyKey}-response-${graduateKey(graduate)}-question-${questionIndex}`),
      responseId: context.getId(`${surveyKey}-response-${graduateKey(graduate)}`),
      questionId: context.getId(questionKey(questionIndex)),
      optionId: context.getId(optionKey(questionIndex, optionIndex)),
    }));
  });
  await tx.surveyAnswer.createMany({ data: answers, skipDuplicates: true });
  return respondents.length;
}

export async function seedHeatmapGraduatesFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const plan = buildHeatmapSeedPlan(context.anchor);
  await seedGraduates(tx, context, plan);
  await seedProfiles(tx, context, plan);
  await seedSurvey(tx, context, plan);
  return plan.length;
}

import type { Career } from "@/modules/access-request";
import type { AcademicPeriod } from "@/modules/reports";
import type { SurveyQuestionType, SurveyStatus, SurveyTargetCareer } from "./survey.types";

// Filas del almacén de ejemplo. Replican las tablas que tendrá la base de datos,
// relacionadas por id, para que la migración al backend sea directa.
// TODO: eliminar junto con el almacén de ejemplo cuando existan las tablas en Prisma.

export interface SurveyRecord {
  id: string;
  title: string;
  description: string;
  status: SurveyStatus;
  period: AcademicPeriod | null;
  targetCareer: SurveyTargetCareer;
  opensAt: string;
  closesAt: string;
  createdById: string;
  createdAt: string;
}

export interface SurveyQuestionRecord {
  id: string;
  surveyId: string;
  text: string;
  type: SurveyQuestionType;
  isRequired: boolean;
  order: number;
}

export interface SurveyOptionRecord {
  id: string;
  questionId: string;
  text: string;
  order: number;
}

export interface SurveyResponseRecord {
  id: string;
  surveyId: string;
  userId: string;
  startedAt: string;
  completedAt: string | null;
}

export interface SurveyAnswerRecord {
  id: string;
  responseId: string;
  questionId: string;
  optionId: string;
}

// Tablas que ya existen en el sistema (usuarios); aquí solo se simulan los campos que usan las encuestas.
export interface AdminRecord {
  id: string;
  fullName: string;
  email: string;
}

export interface GraduateRecord {
  id: string;
  career: Career;
  graduationPeriod: AcademicPeriod;
}

export interface SurveyTables {
  admins: AdminRecord[];
  graduates: GraduateRecord[];
  surveys: SurveyRecord[];
  surveyQuestions: SurveyQuestionRecord[];
  surveyOptions: SurveyOptionRecord[];
  surveyResponses: SurveyResponseRecord[];
  surveyAnswers: SurveyAnswerRecord[];
}

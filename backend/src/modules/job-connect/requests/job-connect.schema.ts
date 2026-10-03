import { z } from 'zod';

const requirementList = z.array(z.string().trim().min(1).max(200)).max(200);

export const extractSkillsSchema = z.object({ text: z.string().max(20000) });
export const profileRequirementsSchema = z.object({
  skills: requirementList,
  academicQualifications: requirementList.default([]),
  submittedRequirements: requirementList.default([]),
});
export const vacanciesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

import { z } from "zod";

export const generateCvSectionsSchema = z.object({
  includeContactInfo: z.boolean().optional(),
  includeSummary: z.boolean().optional(),
  includeWorkExperience: z.boolean().optional(),
  includeEducation: z.boolean().optional(),
  includeSkills: z.boolean().optional(),
  includeCertifications: z.boolean().optional(),
  includeProjects: z.boolean().optional(),
});

export const generateCvSchema = z.object({
  sections: generateCvSectionsSchema.optional(),
  customTitle: z.string().max(100).optional(),
});

export type GenerateCvRequest = z.infer<typeof generateCvSchema>;
export type GenerateCvSectionsRequest = z.infer<typeof generateCvSectionsSchema>;

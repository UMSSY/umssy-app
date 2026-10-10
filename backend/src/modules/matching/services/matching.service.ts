import { Injectable } from '@nestjs/common';
import type {
  AnalyzeExperienceInput,
  AnalyzeExperienceResponse,
  DetectedSkillResponse,
  MatchingInput,
  MatchingResult,
} from '../types/matching.types.js';

@Injectable()
export class MatchingService {
  // Punto de entrada del analisis de habilidades de una experiencia laboral (HU-01)
  analyzeExperience(input: AnalyzeExperienceInput): AnalyzeExperienceResponse {
    const startedAt = performance.now();

    // input.text puede ser vacio o nulo (AC-01.9): en ese caso no hay nada que detectar.
    // Pipeline NLP, cada paso lo implementa su responsable:
    //   T1.2 normalizacion -> T1.3/T1.4 tokenizacion -> T1.5 n-gramas -> T1.6 clasificacion
    // Por ahora el texto aun no se procesa, asi que no se detecta ninguna habilidad.
    const skills: DetectedSkillResponse[] = [];

    return {
      experienceId: input.experienceId,
      skills,
      processingTimeMs: Math.round(performance.now() - startedAt),
    };
  }

  intersectRequirements(input: MatchingInput): MatchingResult {
    const careerMatch =
      !input.requiredCareer ||
      input.userCareer.toLowerCase() === input.requiredCareer.toLowerCase();

    const experienceMatch =
      input.userExperienceYears >= input.minimumExperienceYears;

    const userSkills = new Set(
      input.userSkills.map((skill) => skill.toLowerCase()),
    );

    const matchedSkills = input.requiredSkills.filter((skill) =>
      userSkills.has(skill.toLowerCase()),
    );

    const allRequiredSkillsMatch =
      matchedSkills.length === input.requiredSkills.length;

    return {
      careerMatch,
      experienceMatch,
      matchedSkills,
      allRequiredSkillsMatch,
    };
  }
}

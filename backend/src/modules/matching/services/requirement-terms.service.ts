import { Injectable } from '@nestjs/common';
import { NlpService } from './nlp.service.js';
import { SkillsClassifierService } from './skills-classifier.service.js';
import { SkillCatalogService } from '../../skills/services/skill-catalog.service.js';
import type { DetectedSkillResponse } from '../types/matching.types.js';

@Injectable()
export class RequirementTermsService {
  constructor(
    private readonly nlpService: NlpService,
    private readonly skillsClassifier: SkillsClassifierService,
    private readonly skillCatalogService: SkillCatalogService,
  ) {}

  /**
   * Procesa el texto de los requerimientos de una vacante y devuelve
   * los términos que coinciden con el catálogo de habilidades.
   *
   * AC-07.1: Divide el texto en tokens/palabras clave con el mismo pipeline de HU-01.
   * AC-07.2: Compara con el catálogo sin distinguir mayúsculas/minúsculas ni tildes.
   * AC-07.3: Si no hay requerimientos reconocibles, devuelve [] sin error.
   * AC-07.4: Debe tardar menos de 2 segundos.
   *
   * @param requirementsText Texto de los requerimientos de la vacante
   * @returns Array de habilidades reconocidas (id + name)
   */
  async extractAndMatchRequirements(
    requirementsText: string,
  ): Promise<DetectedSkillResponse[]> {
    // AC-07.3: Texto vacío o sin contenido → devolver array vacío sin error
    if (!requirementsText || requirementsText.trim() === '') {
      return [];
    }

    // 1. Tokenizar y extraer n-gramas usando NlpService (AC-07.1)
    const terms = this.nlpService.extractRequirementTerms(requirementsText);

    if (terms.length === 0) {
      return [];
    }

    // 2. Obtener el catálogo de habilidades desde la BD
    // listCatalog({}) trae todo el catálogo (search es opcional)
    const catalogResponse = await this.skillCatalogService.listCatalog({});

    // 3. Adaptar SkillResponse[] → DetectedSkillResponse[] (solo id y name)
    const catalog: DetectedSkillResponse[] = catalogResponse.map((skill) => ({
      id: skill.id,
      name: skill.name,
    }));

    // 4. Comparar tokens con el catálogo (AC-07.2)
    // El clasificador ya normaliza mayúsculas, tildes y espacios (buildSkillKey)
    const matchedSkills = this.skillsClassifier.classify(terms, catalog);

    // 5. Devolver las habilidades reconocidas (sin duplicados, ya lo hace classify)
    return matchedSkills;
  }
}
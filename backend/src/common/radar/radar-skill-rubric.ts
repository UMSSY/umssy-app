export const radarSkillPoints = (isHighRelevance: boolean): number =>
  1 + (isHighRelevance ? 0.5 : 0);

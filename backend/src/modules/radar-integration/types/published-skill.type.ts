export type PublishedSkill = {
  id: string;
  name: string;
  areaId: string | null;
  isHighRelevance: boolean;
  evidenceRefs: { type: string; id: string }[];
};

export interface Epic2Skill {
  id: string;
  text: string;
  name: string;
  source: "manual" | "nlp";
  areaId: string | null;
  verificationStatus: string;
  isHighRelevance: boolean;
  evidenceRefs: Array<{ type: string; id: string }>;
}

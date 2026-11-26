import { CvReviewItem } from "./cv-review-item";
import type { CvSkillsReviewProps } from "../types/cv-skills-review-props.types";

export function CvSkillsReview({ skills = [], selected = [], onToggle }: CvSkillsReviewProps) {
  return (
    <ul aria-label="Habilidades técnicas" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {(skills ?? []).map((skill, index) => (
        <CvReviewItem
          key={skill.skillId}
          title={skill.name}
          isChecked={selected.includes(index)}
          onToggle={() => onToggle(index)}
        />
      ))}
    </ul>
  );
}

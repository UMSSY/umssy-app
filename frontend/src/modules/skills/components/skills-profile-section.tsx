"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackMessage, SectionCard } from "@/modules/profile";
import { useSkills } from "../hooks/use-skills";
import { PENDING_SKILL_ID_PREFIX } from "../constants/skills.constants";
import type { SkillItem } from "../types/skill-item.types";
import { SkillBadge } from "./skill-badge";
import { SkillPickerDialog } from "./skill-picker-dialog";

export function SkillsProfileSection() {
  const skills = useSkills();
  const [isAdding, setIsAdding] = useState(false);
  async function addSkill(skill: SkillItem) {
    const isSaved = await skills.saveSkills([...skills.selectedSkills, skill]);
    if (isSaved) setIsAdding(false);
    return isSaved;
  }
  return <section id="skills" aria-label="Habilidades" className="scroll-mt-24">
    <SectionCard title="Habilidades" action={<Button variant="outline" size="sm" disabled={skills.isLoading || skills.hasLoadError || skills.isSaving} onClick={() => setIsAdding(true)}><Plus aria-hidden="true" />Añadir habilidad</Button>}>
      {skills.isLoading ? <p role="status" className="text-sm text-text-secondary">Cargando habilidades…</p> : skills.hasLoadError ? <Button variant="outline" onClick={() => void skills.reload()}>Volver a intentar</Button> : skills.selectedSkills.length ? <ul className="flex flex-wrap gap-2">{skills.selectedSkills.map((skill) => <li key={skill.id}><SkillBadge skill={skill} disabled={skills.isSaving} onRemove={(id) => void skills.saveSkills(skills.selectedSkills.filter((item) => item.id !== id))} /></li>)}</ul> : <p className="text-sm text-text-secondary">Añade las habilidades que mejor representan tu experiencia.</p>}
      {!isAdding ? <FeedbackMessage feedback={skills.feedback} /> : null}
    </SectionCard>
    {isAdding ? <SkillPickerDialog catalogSkills={skills.catalogSkills} selectedSkills={skills.selectedSkills} isSaving={skills.isSaving} feedback={skills.feedback} onClose={() => setIsAdding(false)} onAdd={addSkill} onCreate={(name) => addSkill({ id: `${PENDING_SKILL_ID_PREFIX}${name.toLowerCase()}`, name })} /> : null}
  </section>;
}

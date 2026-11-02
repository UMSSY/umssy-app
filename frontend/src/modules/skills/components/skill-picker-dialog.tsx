"use client";

import { useRef, useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FeedbackMessage } from "@/modules/profile";
import { SKILL_NAME_MAX_LENGTH } from "../constants/skills.constants";
import { formatSkillName } from "../utils/format-skill-name";
import { validateCustomSkill } from "../utils/validate-custom-skill";
import type { SkillPickerDialogProps } from "../types/skill-picker-dialog-props.types";

export function SkillPickerDialog({ catalogSkills, selectedSkills, isSaving, feedback, onClose, onAdd, onCreate }: SkillPickerDialogProps) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const normalized = query.trim().toLowerCase();
  const selectedNames = new Set(selectedSkills.map((skill) => skill.name.toLowerCase()));
  const suggestions = catalogSkills.filter((skill) => !selectedNames.has(skill.name.toLowerCase()) && skill.name.toLowerCase().includes(normalized)).slice(0, 6);
  const matchingSkill = catalogSkills.find((skill) => skill.name.toLowerCase() === normalized);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    const name = formatSkillName(query);
    const validation = validateCustomSkill(name, matchingSkill ? selectedSkills : [...catalogSkills, ...selectedSkills]);
    if (validation) { setError(validation); return; }
    if (matchingSkill) await onAdd(matchingSkill);
    else await onCreate(name);
  }

  return <Dialog open onOpenChange={(isOpen) => { if (!isOpen && !isSaving) onClose(); }}>
    <DialogContent initialFocus={inputRef} showCloseButton={false} aria-busy={isSaving} className="max-h-editor-dialog overflow-y-auto p-6 sm:max-w-md">
      <DialogClose render={<Button variant="ghost" size="icon-sm" className="absolute top-3 right-3" disabled={isSaving} aria-label="Cerrar habilidades" />}><X aria-hidden="true" /></DialogClose>
      <DialogHeader className="pr-8"><DialogTitle>Añadir habilidad</DialogTitle><DialogDescription>Elige una habilidad para añadirla directamente a tu perfil.</DialogDescription></DialogHeader>
      <form noValidate onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="skill-picker-query">Habilidad</Label><Input ref={inputRef} id="skill-picker-query" value={query} maxLength={SKILL_NAME_MAX_LENGTH} placeholder="Buscar o escribir una habilidad" disabled={isSaving} aria-invalid={Boolean(error)} aria-describedby={error ? "skill-picker-error" : undefined} onChange={(event) => { setQuery(event.target.value); setError(null); }} />{error ? <p id="skill-picker-error" role="alert" className="text-sm text-danger">{error}</p> : null}</div>
        <ul aria-label="Habilidades disponibles" className="max-h-56 divide-y divide-border overflow-y-auto">
          {suggestions.map((skill) => <li key={skill.id} className="flex items-center justify-between gap-3 py-2"><span className="min-w-0 text-sm font-medium wrap-anywhere text-ink">{skill.name}</span><Button type="button" variant="ghost" size="sm" aria-label={`Añadir ${skill.name}`} disabled={isSaving} onClick={() => void onAdd(skill)}><Plus aria-hidden="true" />Añadir</Button></li>)}
        </ul>
        {normalized && !matchingSkill ? <Button type="submit" disabled={isSaving} className="w-full"><Plus aria-hidden="true" />{isSaving ? "Añadiendo…" : "Crear y añadir habilidad"}</Button> : suggestions.length === 0 ? <p className="text-sm text-text-secondary">No hay coincidencias disponibles. Puedes escribir otra habilidad.</p> : null}
        <FeedbackMessage feedback={feedback?.type === "error" ? feedback : null} />
      </form>
    </DialogContent>
  </Dialog>;
}

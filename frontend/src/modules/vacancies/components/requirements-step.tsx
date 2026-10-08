"use client";

import { useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { UpdateVacancyField, VacancyConditions } from "../hooks/use-job-offer-form";

interface RequirementsStepProps {
  conditions: VacancyConditions;
  updateField: UpdateVacancyField;
  onPrevious: () => void;
  onContinue: () => void;
}

const AVAILABLE_SKILLS = [
  "Python", "Java", "Docker", "Git", "Rust", "Assembly", "JavaScript", 
  "TypeScript", "React", "Node.js", "SQL", "PostgreSQL", "Kubernetes", 
  "Linux", "Django", "FastAPI", "Vue.js", "Angular", "MongoDB", "Redis"
];

const MAX_CHARS = 3000;
const MAX_SKILLS = 10;

export function RequirementsStep({
  conditions,
  updateField,
  onPrevious,
  onContinue,
}: RequirementsStepProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasUnsavedChanges = conditions.description !== "" || conditions.skills.length > 0;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ""; 
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= MAX_CHARS) {
       updateField("description", text);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [conditions.description]);

  const toggleSkill = (skill: string) => {
    if (conditions.skills.includes(skill)) {
      updateField("skills", conditions.skills.filter(s => s !== skill));
    } else if (conditions.skills.length < MAX_SKILLS) {
      updateField("skills", [...conditions.skills, skill]);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-6 py-4 flex items-center gap-3">
         <h2 className="text-[16px] font-bold text-ink">Requisitos técnicos</h2>
         <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            Chips Seleccionables
         </span>
      </div>

      <div className="px-6 py-6">
        <div className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <Label htmlFor="description" className="text-[12.5px] font-semibold text-ink">
              Descripcion del puesto <span className="text-danger">*</span>
            </Label>
          </div>
          
          <div className="relative border border-border rounded-lg focus-within:border-ink focus-within:ring-1 focus-within:ring-ink bg-white overflow-hidden">
             <textarea
                id="description"
                ref={textareaRef}
                value={conditions.description}
                onChange={handleDescriptionChange}
                placeholder="Buscamos un desarrollador backend..."
                className="w-full min-h-[120px] p-4 text-[14px] text-ink outline-none resize-none whitespace-pre-wrap bg-transparent"
             />
             <div className="flex justify-end p-2 bg-white">
                <span className={`text-[11px] font-medium ${conditions.description.length >= MAX_CHARS ? 'text-danger' : 'text-slate-400'}`}>
                  {conditions.description.length}/{MAX_CHARS}
                </span>
             </div>
          </div>
        </div>

        <div>
           <div className="flex items-center gap-2 mb-4">
              <div className="w-4 h-4 rounded-full border border-amber-500 flex items-center justify-center text-amber-500 text-[10px] font-bold">i</div>
              <p className="text-[13px] text-text-secondary">Selecciona las habilidades requeridas para facilitar el procesamiento de la oferta.</p>
           </div>

           <div className="flex flex-wrap gap-2.5">
              {AVAILABLE_SKILLS.map((skill) => {
                 const isSelected = conditions.skills.includes(skill);
                 return (
                    <button
                       key={skill}
                       type="button"
                       onClick={() => toggleSkill(skill)}
                       className={`
                          px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border
                          ${isSelected 
                             ? 'bg-ink text-white border-ink' 
                             : 'bg-white text-text-secondary border-border hover:border-slate-300'}
                       `}
                    >
                       {skill}
                    </button>
                 );
              })}
              
              <button 
                 type="button"
                 disabled={conditions.skills.length >= MAX_SKILLS}
                 className="px-4 py-1.5 rounded-full text-[13px] font-medium border border-dashed border-amber-400 bg-amber-50 text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-amber-50"
              >
                 + Añadir habilidad
              </button>
           </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-6 py-4">
        <button
          type="button"
          onClick={onPrevious}
          className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="rounded-lg bg-[#E50000] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
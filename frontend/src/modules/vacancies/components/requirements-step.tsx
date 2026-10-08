"use client";

import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { UpdateVacancyField, VacancyConditions } from "../hooks/use-job-offer-form";

interface RequirementsStepProps {
  conditions: VacancyConditions;
  updateField: UpdateVacancyField;
  onPrevious: () => void;
  onContinue: () => void;
}

const INITIAL_SKILLS = [
  "Python", "Java", "Docker", "Git", "Rust", "Assembly", "JavaScript", 
  "TypeScript", "React", "Node.js", "SQL", "PostgreSQL", "Kubernetes", 
  "Linux", "Django", "FastAPI", "Vue.js", "Angular", "MongoDB", "Redis"
];

const MAX_CHARS = 3000;

export function RequirementsStep({
  conditions,
  updateField,
  onPrevious,
  onContinue,
}: RequirementsStepProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Lista de habilidades dinámica (para permitir agregar nuevas)
  const [availableSkills, setAvailableSkills] = useState<string[]>(INITIAL_SKILLS);

  // Estados para el Modal de Agregar Habilidad
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

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
    } else {
      updateField("skills", [...conditions.skills, skill]);
    }
  };

  // Filtrado de habilidades para la búsqueda dentro del modal
  const filteredSkills = availableSkills.filter(skill =>
    skill.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  // Agregar habilidad desde el modal
  const handleAddSkillFromModal = (skillToAdd?: string) => {
    const targetSkill = (skillToAdd || searchTerm).trim();
    if (!targetSkill) return;

    // Si no está en la lista de disponibles, la agregamos
    if (!availableSkills.some(s => s.toLowerCase() === targetSkill.toLowerCase())) {
      setAvailableSkills(prev => [...prev, targetSkill]);
    }

    // Aseguramos que esté seleccionada
    const existingSkillName = availableSkills.find(s => s.toLowerCase() === targetSkill.toLowerCase()) || targetSkill;
    if (!conditions.skills.includes(existingSkillName)) {
      updateField("skills", [...conditions.skills, existingSkillName]);
    }

    // Reseteamos y cerramos modal
    setSearchTerm("");
    setIsDropdownOpen(false);
    setIsModalOpen(false);
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
              Descripción del puesto <span className="text-danger">*</span>
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
              {availableSkills.map((skill) => {
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
                 onClick={() => setIsModalOpen(true)}
                 className="px-4 py-1.5 rounded-full text-[13px] font-medium border border-dashed border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
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

      {/* Modal: Buscar Habilidad */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-150">
            {/* Header del Modal */}
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-lg font-bold text-gray-900">Buscar habilidad</h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSearchTerm("");
                  setIsDropdownOpen(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1 leading-none"
              >
                X
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-5">
              Busca una tecnología y selecciónala de los resultados.
            </p>

            {/* Input con desplegable de sugerencias */}
            <div className="mb-6 relative">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Buscar tecnología <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Escribe para buscar, ej. React"
                className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
              />

              {/* Popup de autocompletar */}
              {isDropdownOpen && searchTerm.trim().length > 0 && filteredSkills.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg z-10">
                  {filteredSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleAddSkillFromModal(skill)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Acciones del Modal */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSearchTerm("");
                  setIsDropdownOpen(false);
                }}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleAddSkillFromModal()}
                disabled={!searchTerm.trim()}
                className="rounded-lg bg-[#E50000] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Añadir habilidad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import { SkillsSelectorProps } from "../types/skills-selector-props.types";
import { SkillBadge } from "./skill-badge";

export function SkillsSelector({
  catalogSkills,
  selectedSkills,
  onAddSkill,
  onRemoveSkill,
  onCreateCustomSkill,
}: SkillsSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [customError, setCustomError] = useState("");

  const selectedIds = useMemo(
    () => new Set(selectedSkills.map((s) => s.id)),
    [selectedSkills]
  );

  const filteredCatalog = useMemo(() => {
    if (!searchTerm.trim()) return catalogSkills;
    return catalogSkills.filter((skill) =>
      skill.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [catalogSkills, searchTerm]);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (!trimmed) {
      setCustomError("El nombre no puede estar vacío");
      return;
    }

    const exists = selectedSkills.some(
      (s) => s.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setCustomError("Esta habilidad ya está agregada");
      return;
    }

    if (onCreateCustomSkill) {
      onCreateCustomSkill(trimmed);
      setCustomSkillInput("");
      setCustomError("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Mis habilidades</h3>
        {selectedSkills.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tienes habilidades seleccionadas aún.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((skill) => (
              <SkillBadge
                key={skill.id}
                skill={skill}
                onRemove={onRemoveSkill}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <label htmlFor="search-catalog" className="text-sm font-medium">
          Buscar en el catálogo
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            id="search-catalog"
            type="text"
            placeholder="Buscar en el catálogo"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
          {filteredCatalog.length === 0 ? (
            <p className="text-xs text-muted-foreground p-2">
              No se encontraron coincidencias en el catálogo.
            </p>
          ) : (
            filteredCatalog.map((skill) => {
              const isSelected = selectedIds.has(skill.id);
              return (
                <div
                  key={skill.id}
                  className="flex items-center justify-between p-1.5 hover:bg-accent rounded text-sm"
                >
                  <span>{skill.name}</span>
                  <button
                    type="button"
                    disabled={isSelected}
                    onClick={() => onAddSkill(skill)}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3" />
                    {isSelected ? "Agregada" : "Añadir"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {onCreateCustomSkill && (
        <form onSubmit={handleAddCustom} className="space-y-2">
          <label htmlFor="custom-skill" className="text-sm font-medium">
            Agregar habilidad propia
          </label>
          <div className="flex gap-2">
            <input
              id="custom-skill"
              type="text"
              placeholder="Ej. Docker"
              value={customSkillInput}
              onChange={(e) => {
                setCustomSkillInput(e.target.value);
                setCustomError("");
              }}
              className="flex-1 px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-md hover:bg-secondary/80"
            >
              Agregar
            </button>
          </div>
          {customError && (
            <p className="text-xs text-destructive">{customError}</p>
          )}
        </form>
      )}
    </div>
  );
}
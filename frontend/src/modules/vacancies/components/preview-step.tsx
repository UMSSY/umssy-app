"use client";

import type { VacancyConditions } from "../hooks/use-job-offer-form";
import { useState } from "react";

interface PreviewStepProps {
  conditions: VacancyConditions;
  onPrevious: () => void;
}

export function PreviewStep({ conditions, onPrevious }: PreviewStepProps) {
  // Mocks basados en el diseño
  const FIXED_COMPANY = "TechBolivia S.R.L.";
  const MOCK_SKILLS = ["Python", "Docker", "Git"];
  const MOCK_DESCRIPTION = "Buscamos un desarrollador backend con experiencia en Python y arquitecturas de microservicios. Será responsable del diseño e implementación de APIs RESTful, integración con bases de datos, revisión de código y colaboración con equipos multidisciplinarios.";
  const DESCRIPTION_LIMIT = 125;
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const description = conditions.description || MOCK_DESCRIPTION;
  const isDescriptionTruncated = description.length > DESCRIPTION_LIMIT;
  const displayedDescription = isDescriptionTruncated && !isDescriptionExpanded
    ? `${description.slice(0, DESCRIPTION_LIMIT).trimEnd()}…`
    : description;
  const mapsLink = conditions.mapsLink.trim();
  const isSafeMapsLink = (() => {
    try {
      const protocol = new URL(mapsLink).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  })();

  return (
    <div className="w-full mt-8">
      {/* Etiqueta superior */}
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
        VISTA PREVIA DE LA PUBLICACIÓN
      </h3>

      {/* Tarjeta Principal */}
      <div className="bg-white rounded-lg shadow-[0_2px_10px_rgb(0,0,0,0.06)] border border-gray-100 border-t-[4px] border-t-[#E50000] p-8">
        
        {/* Cabecera: Logo y Empresa */}
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-[#0f172a] text-white w-[50px] h-[50px] flex items-center justify-center rounded-lg font-bold text-lg tracking-wider">
            TB
          </div>
          <div>
            <h4 className="font-extrabold text-gray-900 text-[15px] leading-tight">{FIXED_COMPANY}</h4>
            <p className="text-[13px] text-gray-500">Empresa verificada</p>
          </div>
        </div>

        {/* Título de la Vacante y Categoría */}
        <div className="mb-6">
          <h2 className="text-[22px] font-extrabold text-gray-900">
            {conditions.title || "Desarrollador Backend"}
          </h2>
          <p className="text-amber-500 font-bold text-[13px] mt-1">
            {conditions.category || "Tecnología"}
          </p>
        </div>

        {/* Grid de Condiciones (4 bloques) */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-50 text-gray-700 px-4 py-2.5 rounded-md text-[13px] font-medium">
            {conditions.modality || "Híbrido"}
          </div>
          <div className="bg-gray-50 text-gray-700 px-4 py-2.5 rounded-md text-[13px] font-medium">
            {conditions.contractType || "Tiempo completo"}
          </div>
          <div className="bg-gray-50 text-gray-700 px-4 py-2.5 rounded-md text-[13px] font-medium">
            {conditions.vacancyCount ? `${conditions.vacancyCount} vacantes` : "2 vacantes"}
          </div>
          <div className="bg-gray-50 text-gray-700 px-4 py-2.5 rounded-md text-[13px] font-medium">
            {conditions.salary || "Bs 6.500 - 8.000"}
          </div>
        </div>

        {/* Descripción */}
        <p
          data-testid="vacancy-description"
          className="text-[14px] text-gray-600 leading-relaxed mb-6"
        >
          {displayedDescription}
          {isDescriptionTruncated && (
            <>
              {" "}
              <button
                type="button"
                className="text-[#E50000] font-semibold"
                aria-expanded={isDescriptionExpanded}
                onClick={() => setIsDescriptionExpanded((expanded) => !expanded)}
              >
                {isDescriptionExpanded ? "Ver menos" : "Ver más"}
              </button>
            </>
          )}
        </p>

        <hr className="border-gray-100 mb-5" />

        {/* Idiomas */}
        <div className="mb-5">
          <h4 className="text-[14px] font-semibold text-gray-900 mb-1">Idiomas</h4>
          <p className="text-[14px] text-gray-600">
            {conditions.languages || "Español, Inglés intermedio"}
          </p>
        </div>

        <hr className="border-gray-100 mb-5" />

        {/* Ubicación */}
        <div className="mb-6">
          <h4 className="text-[14px] font-semibold text-gray-900 mb-1">Ubicación</h4>
          {isSafeMapsLink ? (
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] text-[#E50000] hover:underline underline-offset-2"
            >
              {mapsLink}
            </a>
          ) : (
            <p className="text-[14px] text-gray-600">
              {mapsLink || "Ubicación no especificada"}
            </p>
          )}
        </div>

        {/* Chips de Skills */}
        <div className="flex flex-wrap gap-2">
          {MOCK_SKILLS.map((skill, index) => (
            <span 
              key={index} 
              className="px-4 py-1.5 bg-gray-100 text-gray-700 text-[13px] font-semibold rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Botones de Acción Finales */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevious}
          className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          Anterior
        </button>
        
        <button 
          className="px-6 py-2.5 bg-[#E50000] hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          Confirmar publicación
        </button>
      </div>
    </div>
  );
}
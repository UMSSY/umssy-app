"use client";

import { useState, useEffect } from "react";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";

export function CreateVacancyView() {
  const [currentStep, setCurrentStep] = useState(1);
  
  const [jobTitle, setJobTitle] = useState("");
  const [modality, setModality] = useState("Híbrido");
  const [googleMapsLink, setGoogleMapsLink] = useState("");
  const [vacancyCount, setVacancyCount] = useState("1");
  const [salary, setSalary] = useState("");
  const [languages, setLanguages] = useState("");

  // Variable que determina si el usuario ya escribió algo importante
  const hasUnsavedChanges = jobTitle !== "" || salary !== "" || googleMapsLink !== "" || languages !== "" || vacancyCount !== "1";

  // Interceptar F5 o cierre de pestaña
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ""; // Esto dispara la alerta nativa del navegador
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Manejador del botón Cancelar
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const isConfirmed = window.confirm("¿Estás seguro de que deseas cancelar? Se perderán todos los datos ingresados.");
      if (!isConfirmed) return; // Si el usuario dice que no, cancelamos la acción
    }
    
    // Si dice que sí (o no había cambios), limpiamos el formulario o redirigimos
    console.log("Redirigiendo al inicio o limpiando formulario...");
    // Aquí a futuro irá la lógica de tu router (ej: router.push('/vacancies'))
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
    if (allowedKeys.includes(e.key)) return;

    const isAlphanumericOrSpace = /^[a-zA-Z0-9\sñÑáéíóúÁÉÍÓÚ]+$/.test(e.key);
    if (!isAlphanumericOrSpace || jobTitle.length >= 60) {
      e.preventDefault();
    }
  };

  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
    if (allowedKeys.includes(e.key)) return;

    const isNumber = /^[0-9]+$/.test(e.key);
    if (!isNumber) {
      e.preventDefault();
    }
  };

  const handleVacancyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value === "") {
      setVacancyCount("");
      return;
    }
    const num = parseInt(value, 10);
    if (num <= 500) {
      setVacancyCount(num.toString());
    }
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/[^\d-]/g, "");
    if (!rawValue) {
      setSalary("");
      return;
    }
    const parts = rawValue.split("-");
    const formatMiles = (numStr: string) => {
      if (!numStr) return "";
      const numero = parseInt(numStr, 10);
      if (isNaN(numero)) return "";
      return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };
    let formatted = "Bs " + formatMiles(parts[0]);
    if (parts.length > 1) {
      formatted += " - " + formatMiles(parts[1]);
    }
    setSalary(formatted);
  };

  const handleSalaryBlur = () => {
    const rawValue = salary.replace(/[^\d-]/g, "");
    const parts = rawValue.split("-");
    if (parts.length === 2 && parts[0] !== "" && parts[1] !== "") {
      const min = parseInt(parts[0], 10);
      const max = parseInt(parts[1], 10);
      if (min > max) {
        const formatMiles = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        setSalary(`Bs ${formatMiles(max)} - ${formatMiles(min)}`);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2 text-slate-900">Registrar nueva vacante</h1>
      <p className="text-slate-500 mb-8">Completa la información de la oferta para publicarla en la plataforma.</p>

      <div className="bg-white border rounded-lg p-6 shadow-sm">
        {currentStep === 1 && (
          <div className="flex flex-col gap-6">
            <h2 className="text-lg font-semibold border-b pb-4">Información y condiciones de la oferta</h2>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Título del puesto <span className="text-red-500">*</span></label>
              <Input placeholder="Ej. Desarrollador Backend" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} onKeyDown={handleTitleKeyDown} />
              <span className="text-xs text-slate-400 text-right">{jobTitle.length}/60</span>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Modalidad <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <Button type="button" variant={modality === "Presencial" ? "default" : "outline"} className={`flex-1 ${modality === "Presencial" ? "bg-slate-900 text-white" : ""}`} onClick={() => setModality("Presencial")}>Presencial</Button>
                  <Button type="button" variant={modality === "Remoto" ? "default" : "outline"} className={`flex-1 ${modality === "Remoto" ? "bg-slate-900 text-white" : ""}`} onClick={() => setModality("Remoto")}>Remoto</Button>
                  <Button type="button" variant={modality === "Híbrido" ? "default" : "outline"} className={`flex-1 ${modality === "Híbrido" ? "bg-slate-900 text-white" : ""}`} onClick={() => setModality("Híbrido")}>Híbrido</Button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Enlace de Google Maps <span className="text-red-500">*</span></label>
                <Input placeholder="https://maps.google.com/..." value={googleMapsLink} onChange={(e) => setGoogleMapsLink(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Número de vacantes <span className="text-red-500">*</span></label>
                <Input type="text" value={vacancyCount} onChange={handleVacancyChange} onKeyDown={handleNumberKeyDown} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Salario <span className="text-red-500">*</span></label>
                <Input placeholder="Bs 6.500 - 8.000" value={salary} onChange={handleSalaryChange} onBlur={handleSalaryBlur} />
              </div>
            </div>

            <div className="flex flex-col gap-2 w-1/2 pr-3">
              <label className="text-sm font-medium text-slate-700">Idiomas <span className="text-red-500">*</span></label>
              <Input placeholder="Español, inglés intermedio" value={languages} onChange={(e) => setLanguages(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setCurrentStep(2)}>Continuar</Button>
      </div>
    </div>
  );
}
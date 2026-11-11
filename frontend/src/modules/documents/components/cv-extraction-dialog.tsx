"use client";

import { LoaderCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CV_CONTACT_FIELD_LABELS,
  CV_CONTACT_FIELDS,
  CV_EXTRACTION_TABS,
} from "../constants/cv-extraction.constants";
import type { CvExtractionDialogProps } from "../types/cv-extraction-dialog-props.types";
import { formatCvPeriod } from "../utils/format-cv-period";
import { hasCvText } from "../utils/has-cv-text";
import { isCvEducationIncomplete } from "../utils/is-cv-education-incomplete";
import { isCvWorkExperienceIncomplete } from "../utils/is-cv-work-experience-incomplete";
import { CvExtractionOption } from "./cv-extraction-option";

export function CvExtractionDialog({
  isOpen,
  isExtracting,
  extraction,
  selection,
  errorMessage = null,
  onToggleContactField,
  onToggleEducation,
  onToggleWorkExperience,
  onApply,
  onClose,
}: CvExtractionDialogProps) {
  const contactFields = CV_CONTACT_FIELDS.filter((field) => hasCvText(extraction?.contact?.[field]));
  const educations = extraction?.educations ?? [];
  const workExperiences = extraction?.workExperiences ?? [];
  const selectedCount =
    selection.contactFields.length + selection.educations.length + selection.workExperiences.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open || isExtracting ? undefined : onClose())}>
      <DialogContent className="max-w-2xl gap-0 rounded-lg border border-border bg-surface p-0 text-ink ring-0 sm:max-w-2xl">
        <DialogHeader className="gap-1.5 border-b border-border px-6 py-5 pr-14">
          <DialogTitle className="font-tight text-xl font-bold text-ink">Datos encontrados en tu CV</DialogTitle>
          <DialogDescription className="text-sm text-text-secondary">
            Elige qué datos quieres usar. Se cargarán como borrador en tu perfil y podrás revisarlos antes de guardar.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {isExtracting ? (
            <div aria-busy="true" className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-sm text-text-secondary">
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                Leyendo los datos de tu CV...
              </p>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : null}
          {!isExtracting && errorMessage ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}
          {!isExtracting && !errorMessage && extraction ? (
            <Tabs defaultValue={CV_EXTRACTION_TABS.contact}>
              <TabsList aria-label="Secciones del CV">
                <TabsTrigger value={CV_EXTRACTION_TABS.contact}>{`Contacto (${contactFields.length})`}</TabsTrigger>
                <TabsTrigger value={CV_EXTRACTION_TABS.education}>{`Educación (${educations.length})`}</TabsTrigger>
                <TabsTrigger value={CV_EXTRACTION_TABS.experience}>
                  {`Experiencia (${workExperiences.length})`}
                </TabsTrigger>
              </TabsList>
              <TabsContent value={CV_EXTRACTION_TABS.contact} className="pt-4">
                {contactFields.length === 0 ? (
                  <p className="py-6 text-center text-sm text-text-secondary">No encontramos datos de contacto en tu CV.</p>
                ) : (
                  <ul aria-label="Datos de contacto" className="flex flex-col gap-2">
                    {contactFields.map((field) => (
                      <CvExtractionOption
                        key={field}
                        title={CV_CONTACT_FIELD_LABELS[field]}
                        details={[(extraction.contact[field] ?? "").trim()]}
                        isChecked={selection.contactFields.includes(field)}
                        onToggle={() => onToggleContactField(field)}
                      />
                    ))}
                  </ul>
                )}
              </TabsContent>
              <TabsContent value={CV_EXTRACTION_TABS.education} className="pt-4">
                {educations.length === 0 ? (
                  <p className="py-6 text-center text-sm text-text-secondary">No encontramos estudios en tu CV.</p>
                ) : (
                  <ul aria-label="Educación" className="flex flex-col gap-2">
                    {educations.map((education, index) => (
                      <CvExtractionOption
                        key={`${education.institution ?? ""}-${education.degree ?? ""}-${index}`}
                        title={(education.degree ?? "").trim() || "Título sin detectar"}
                        details={[
                          (education.institution ?? "").trim() || "Institución sin detectar",
                          formatCvPeriod(education.startDate, education.endDate),
                        ]}
                        isChecked={selection.educations.includes(index)}
                        isIncomplete={isCvEducationIncomplete(education)}
                        onToggle={() => onToggleEducation(index)}
                      />
                    ))}
                  </ul>
                )}
              </TabsContent>
              <TabsContent value={CV_EXTRACTION_TABS.experience} className="pt-4">
                {workExperiences.length === 0 ? (
                  <p className="py-6 text-center text-sm text-text-secondary">No encontramos experiencia laboral en tu CV.</p>
                ) : (
                  <ul aria-label="Experiencia laboral" className="flex flex-col gap-2">
                    {workExperiences.map((experience, index) => (
                      <CvExtractionOption
                        key={`${experience.companyName ?? ""}-${experience.position ?? ""}-${index}`}
                        title={(experience.position ?? "").trim() || "Cargo sin detectar"}
                        details={[
                          (experience.companyName ?? "").trim() || "Empresa sin detectar",
                          formatCvPeriod(experience.startDate, experience.endDate, experience.isCurrent),
                        ]}
                        isChecked={selection.workExperiences.includes(index)}
                        isIncomplete={isCvWorkExperienceIncomplete(experience)}
                        onToggle={() => onToggleWorkExperience(index)}
                      />
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          ) : null}
        </div>
        <DialogFooter className="mx-0 mb-0 flex-row justify-end gap-3 border-t border-border bg-transparent px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="h-10 border-border-strong px-4 text-sm text-ink hover:bg-surface-soft"
            disabled={isExtracting}
            onClick={onClose}
          >
            Ahora no
          </Button>
          <Button
            type="button"
            className="h-10 bg-primary px-4 text-sm text-primary-foreground hover:bg-brand-hover"
            disabled={isExtracting || !extraction || selectedCount === 0}
            onClick={onApply}
          >
            Usar datos seleccionados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

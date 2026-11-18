"use client";

import { useState } from "react";
import { Building2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AccessRequestProvider,
  useAccessRequestForm,
} from "../contexts/access-request-context";
import { CompanyAccessRequestFlow } from "../components/company/company-access-request-flow";
import { DocumentStep } from "../components/document/document-step";
import { PersonalDataForm } from "../components/personal-data/personal-data-form";
import { PublicHeader } from "../components/request-steps/public-header";
import { RequestAccessShell } from "../components/request-steps/request-access-shell";
import { ReviewStep } from "../components/request-steps/review-step";

function RequestAccessLayout({
  onSwitchToCompany,
}: {
  onSwitchToCompany: () => void;
}) {
  const { currentStep } = useAccessRequestForm();

  return (
    <RequestAccessShell currentStep={currentStep} header={<PublicHeader />}>
      <div className="flex w-full flex-col">
        <div className="mb-5 flex items-center justify-start">
          <div
            role="tablist"
            aria-label="Tipo de solicitante"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-soft p-1.5 shadow-2xs"
          >
            <Button
              type="button"
              size="sm"
              className="gap-2 rounded-lg px-4 font-semibold"
            >
              <GraduationCap className="size-4" />
              Soy Titulado
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 rounded-lg px-4 font-medium text-text-secondary hover:text-ink"
              onClick={onSwitchToCompany}
            >
              <Building2 className="size-4" />
              Soy Empresa
            </Button>
          </div>
        </div>

        {currentStep === 1 ? (
          <PersonalDataForm />
        ) : currentStep === 2 ? (
          <DocumentStep />
        ) : (
          <ReviewStep />
        )}
      </div>
    </RequestAccessShell>
  );
}

export function RequestAccessView() {
  const [accountType, setAccountType] = useState<"graduate" | "company">(
    "graduate",
  );

  return (
    <AccessRequestProvider>
      <main data-app-shell="true" className="min-h-screen bg-background">
        {accountType === "company" ? (
          <CompanyAccessRequestFlow
            onSwitchToGraduate={() => setAccountType("graduate")}
          />
        ) : (
          <RequestAccessLayout
            onSwitchToCompany={() => setAccountType("company")}
          />
        )}
      </main>
    </AccessRequestProvider>
  );
}

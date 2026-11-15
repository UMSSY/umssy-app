"use client";

import { useState } from "react";
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
      <div className="mb-4 flex justify-end">
        <div className="inline-flex gap-1 rounded-lg border border-border bg-surface-soft p-1">
          <Button type="button" size="sm">
            Soy Titulado
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSwitchToCompany}
          >
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
    </RequestAccessShell>
  );
}

export function RequestAccessView() {
  const [accountType, setAccountType] = useState<"graduate" | "company">(
    "graduate",
  );

  return (
    <main data-app-shell="true" className="min-h-screen bg-background">
      {accountType === "company" ? (
        <CompanyAccessRequestFlow
          onSwitchToGraduate={() => setAccountType("graduate")}
        />
      ) : (
        <AccessRequestProvider>
          <RequestAccessLayout
            onSwitchToCompany={() => setAccountType("company")}
          />
        </AccessRequestProvider>
      )}
    </main>
  );
}
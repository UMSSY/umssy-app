"use client";

import {
  AccessRequestProvider,
  useAccessRequestForm,
} from "../contexts/access-request-context";
import { DocumentStep } from "../components/document/document-step";
import { PersonalDataForm } from "../components/personal-data/personal-data-form";
import { PublicHeader } from "../components/request-steps/public-header";
import { RequestAccessShell } from "../components/request-steps/request-access-shell";
import { ReviewStep } from "../components/request-steps/review-step";

// Vive dentro del Provider y conserva el paso actual del formulario.
function RequestAccessLayout() {
  const { currentStep } = useAccessRequestForm();

  return (
    <RequestAccessShell
      currentStep={currentStep}
      header={<PublicHeader />}
    >
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
  return (
    <main data-app-shell="true" className="min-h-screen bg-background">
      <AccessRequestProvider>
        <RequestAccessLayout />
      </AccessRequestProvider>
    </main>
  );
}

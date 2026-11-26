'use client';

import { Building2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeading } from '@/shared/components/layout/page-heading';
import { PublicHeader } from '../request-steps/public-header';
import { useCompanyAccessRequestFlow } from '../../hooks/use-company-access-request-flow';
import type { CompanyAccessRequestFlowProps } from '../../types/company-access-request-flow-props.types';
import { CompanyFlowErrorDialog } from './company-flow-error-dialog';
import { CompanyFlowSidebar } from './company-flow-sidebar';
import { CompanyLogoPreviewDialog } from './company-logo-preview-dialog';
import { CompanyStepOneForm } from './company-step-one-form';
import { CompanyStepThreeSuccess } from './company-step-three-success';
import { CompanyStepTwoForm } from './company-step-two-form';

export function CompanyAccessRequestFlow({
  onSwitchToGraduate,
}: CompanyAccessRequestFlowProps) {
  const flow = useCompanyAccessRequestFlow();

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />

      <div className="flex flex-1 flex-col lg:flex-row">
        <CompanyFlowSidebar step={flow.step} />

        <section className="flex min-w-0 flex-1 flex-col px-4 py-6 md:p-8">
          <div className="mx-auto flex w-full max-w-5xl justify-center">
            <div className="flex w-full flex-col gap-5">
              <div className="flex items-center justify-start">
                <div
                  role="tablist"
                  aria-label="Tipo de solicitante"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface-soft p-1.5 shadow-2xs"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2 rounded-lg px-4 font-medium text-text-secondary hover:text-ink"
                    onClick={onSwitchToGraduate}
                  >
                    <GraduationCap className="size-4" />
                    Soy Titulado
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="gap-2 rounded-lg px-4 font-semibold"
                  >
                    <Building2 className="size-4" />
                    Soy Empresa
                  </Button>
                </div>
              </div>

              {flow.step === 1 ? (
                <PageHeading
                  title="Registra tu empresa en la comunidad"
                  description="Conecta con titulados verificados de Ingeniería de Sistemas e Informática de la UMSS."
                />
              ) : null}
              {flow.step === 2 ? (
                <PageHeading
                  title="Carta de solicitud en hoja membretada"
                  description={`Adjunta la carta oficial firmada y sellada dirigida a la Carrera de Ingeniería de Sistemas e Informática (UMSS) para validar a ${flow.form.companyName.trim() || 'tu empresa'}.`}
                />
              ) : null}

              {flow.step !== 3 ? (
                <p className="text-xs text-text-secondary">
                  <span aria-hidden="true" className="font-semibold text-danger">
                    *
                  </span>{' '}
                  Campo obligatorio
                </p>
              ) : null}

              {flow.error ? (
                <div
                  role="alert"
                  className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
                >
                  {flow.error}
                </div>
              ) : null}

              {flow.step === 1 ? (
                <CompanyStepOneForm
                  form={flow.form}
                  cities={flow.cities}
                  submitting={flow.submitting}
                  logoInputRef={flow.logoInputRef}
                  logoFile={flow.logoFile}
                  logoPreview={flow.logoPreview}
                  logoDimensions={flow.logoDimensions}
                  isLogoDragging={flow.isLogoDragging}
                  onFormChange={flow.setForm}
                  onLogoChange={flow.handleLogoChange}
                  onLogoDrop={flow.handleLogoDrop}
                  onSetLogoDragging={flow.setIsLogoDragging}
                  onOpenLogoModal={() => flow.setIsLogoModalOpen(true)}
                  onRemoveLogo={flow.handleRemoveLogo}
                  onSubmit={flow.handleStep1Submit}
                />
              ) : null}

              {flow.step === 2 ? (
                <CompanyStepTwoForm
                  documentFile={flow.documentFile}
                  documentPreviewUrl={flow.documentPreviewUrl}
                  documentError={flow.documentError}
                  submitting={flow.submitting}
                  onFileSelected={flow.handleDocumentSelected}
                  onRemoveDocument={flow.handleRemoveDocument}
                  onBack={() => flow.setStep(1)}
                  onSubmit={flow.handleStep2Submit}
                />
              ) : null}

              {flow.step === 3 && flow.submitted ? (
                <CompanyStepThreeSuccess
                  companyName={flow.form.companyName}
                  requestCode={flow.submitted.requestCode}
                  copiedCode={flow.copiedCode}
                  onCopyCode={(code) => void flow.handleCopyCode(code)}
                />
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <CompanyLogoPreviewDialog
        open={flow.isLogoModalOpen}
        logoFile={flow.logoFile}
        logoPreview={flow.logoPreview}
        logoDimensions={flow.logoDimensions}
        previewBg={flow.previewBg}
        logoInputRef={flow.logoInputRef}
        onChangeBg={flow.setPreviewBg}
        onClose={() => flow.setIsLogoModalOpen(false)}
        onRemoveLogo={flow.handleRemoveLogo}
      />

      <CompanyFlowErrorDialog
        errorModal={flow.errorModal}
        onOpenChange={(open) =>
          flow.setErrorModal((prev) => ({ ...prev, open }))
        }
      />
    </div>
  );
}

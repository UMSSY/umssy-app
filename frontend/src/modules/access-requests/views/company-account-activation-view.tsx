'use client';

import Link from 'next/link';
import { LoaderCircle } from 'lucide-react';
import { CompanyActivationDialogs } from '../components/company/company-activation-dialogs';
import { CompanyActivationReadyPanel } from '../components/company/company-activation-ready-panel';
import { CompanyActivationStatusCards } from '../components/company/company-activation-status-cards';
import { useCompanyAccountActivation } from '../hooks/use-company-account-activation';

export function CompanyAccountActivationView() {
  const vm = useCompanyAccountActivation();

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="font-tight text-xl font-black tracking-tight text-primary">
              UMSSY
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              | Plataforma Institucional
            </span>
          </div>
          <Link
            href="/login"
            className="text-xs font-semibold text-muted-foreground transition-colors hover:text-ink"
          >
            Iniciar Sesión
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
        {vm.loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <LoaderCircle className="size-8 animate-spin text-primary" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Verificando enlace institucional...
            </p>
          </div>
        ) : vm.state === 'READY' && vm.officialData ? (
          <CompanyActivationReadyPanel
            officialData={vm.officialData}
            password={vm.password}
            confirmPassword={vm.confirmPassword}
            showPassword={vm.showPassword}
            showConfirmPassword={vm.showConfirmPassword}
            hasMinLength={vm.hasMinLength}
            hasUppercase={vm.hasUppercase}
            hasNumber={vm.hasNumber}
            passwordsMatch={vm.passwordsMatch}
            canFinalize={vm.canFinalize}
            activationError={vm.activationError}
            onPasswordChange={vm.setPassword}
            onConfirmPasswordChange={vm.setConfirmPassword}
            onToggleShowPassword={() => vm.setShowPassword((prev) => !prev)}
            onToggleShowConfirmPassword={() =>
              vm.setShowConfirmPassword((prev) => !prev)
            }
            onOpenReport={() => vm.setIsReportOpen(true)}
            onOpenConfirm={() => vm.setIsConfirmModalOpen(true)}
          />
        ) : (
          <CompanyActivationStatusCards
            state={vm.state}
            serverMessage={vm.serverMessage}
            officialData={vm.officialData}
            trackingCode={vm.trackingCode}
            codeError={vm.codeError}
            isVerifyingCode={vm.isVerifyingCode}
            onTrackingCodeChange={(code) => {
              vm.setTrackingCode(code);
              vm.setCodeError(null);
            }}
            onVerifyCode={vm.handleVerifyCode}
            onGoToLogin={vm.goToLogin}
          />
        )}
      </main>

      <CompanyActivationDialogs
        officialData={vm.officialData}
        isReportOpen={vm.isReportOpen}
        reportObservation={vm.reportObservation}
        reportStatus={vm.reportStatus}
        reportMessage={vm.reportMessage}
        isConfirmModalOpen={vm.isConfirmModalOpen}
        isActivating={vm.isActivating}
        onReportOpenChange={vm.setIsReportOpen}
        onReportObservationChange={vm.setReportObservation}
        onSendReport={() => void vm.handleSendReport()}
        onConfirmOpenChange={vm.setIsConfirmModalOpen}
        onConfirmActivation={() => void vm.handleConfirmActivation()}
      />
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolvePostLoginPath } from "@/modules/auth";
import { ActivationCodeStep } from "../components/activation/activation-code-step";
import { ActivationNotice } from "../components/activation/activation-notice";
import { ActivationPasswordStep } from "../components/activation/activation-password-step";
import { PublicHeader } from "../components/request-steps/public-header";
import { RequestStepsSidebar } from "../components/request-steps/request-steps-sidebar";
import { AccessRequestProvider } from "../contexts/access-request-context";
import { useAccountActivation } from "../hooks/use-account-activation";
import { useCountdown } from "../hooks/use-countdown";

function EmailGate({ onSubmit }: { onSubmit: (email: string) => void }) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (value.trim() !== "") onSubmit(value.trim().toLowerCase());
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full max-w-md">
      <h1 className="font-tight text-3xl font-extrabold text-ink">Activa tu cuenta</h1>
      <p className="mt-3 mb-6 text-base text-text-secondary">Ingresa el correo con el que solicitaste acceso.</p>
      <Label htmlFor="activation-email" className="mb-1.5 text-[12.5px] font-semibold text-ink">
        Correo electrónico
      </Label>
      <Input
        id="activation-email"
        type="email"
        autoComplete="email"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-13 rounded-lg border-border-strong bg-surface px-4 text-base text-ink md:text-base"
      />
      <Button type="submit" variant="institutional" disabled={value.trim() === ""} className="mt-6 h-12 w-full text-base font-extrabold">
        Continuar
      </Button>
    </form>
  );
}

function ActivationFlow({ email }: { email: string }) {
  const router = useRouter();
  const flow = useAccountActivation(email);
  const { status, offsetMs, step, busy, feedback } = flow;
  const expiresIn = useCountdown(status?.expiresAt ?? null, offsetMs);
  const resendIn = useCountdown(status?.resendAvailableAt ?? null, offsetMs);

  async function handleActivate(password: string) {
    const session = await flow.activate(password);
    if (session) router.push(resolvePostLoginPath(session.roles ?? session.roleTag, null));
  }

  if (flow.session) {
    return (
      <p role="status" className="flex items-center gap-2 text-base text-ink">
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        Cuenta activada. Entrando a la comunidad...
      </p>
    );
  }
  if (busy === "loading") {
    return (
      <p role="status" className="flex items-center gap-2 text-base text-text-secondary">
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        Cargando...
      </p>
    );
  }
  if (!status) {
    return (
      <ActivationNotice
        title="No pudimos cargar tu activación"
        message={feedback.general ?? "Inténtalo de nuevo."}
        actionLabel="Reintentar"
        onAction={() => void flow.refresh()}
      />
    );
  }
  if (status.state === "activated") {
    return <ActivationNotice title="Tu cuenta ya está activa" message="Inicia sesión con tu correo y la contraseña que creaste." />;
  }
  if (status.state === "locked") {
    return (
      <ActivationNotice
        title="Superaste los intentos permitidos"
        message={feedback.general ?? "Por seguridad bloqueamos este código. Pide uno nuevo para continuar."}
        actionLabel="Enviar un código nuevo"
        onAction={() => void flow.resend()}
        disabled={busy !== null || status.resendsRemaining === 0 || resendIn > 0}
      />
    );
  }
  if (status.state === "expired" || status.state === "no_code") {
    return (
      <ActivationNotice
        title={status.state === "expired" ? "Tu código venció" : "Aún no tienes un código"}
        message={feedback.general ?? "Solicita un código nuevo y llegará a tu correo en unos segundos."}
        actionLabel="Enviar un código nuevo"
        onAction={() => void flow.resend()}
        disabled={busy !== null || status.resendsRemaining === 0 || resendIn > 0}
      />
    );
  }
  if (step === "password") {
    return (
      <ActivationPasswordStep
        isActivating={busy === "activating"}
        serverError={feedback.password ?? feedback.general}
        onSubmit={(password) => void handleActivate(password)}
        onBack={flow.goBackToCode}
      />
    );
  }
  return (
    <ActivationCodeStep
      email={email}
      status={status}
      expiresIn={expiresIn}
      resendIn={resendIn}
      isBusy={busy !== null}
      isVerifying={busy === "verifying"}
      isResending={busy === "resending"}
      error={feedback.code ?? feedback.general}
      info={feedback.info}
      onVerify={(code) => void flow.verify(code)}
      onResend={() => void flow.resend()}
    />
  );
}

export function AccountActivationView({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail.trim().toLowerCase());

  return (
    <main data-app-shell="true" className="min-h-screen bg-background">
      <AccessRequestProvider>
        <div className="flex min-h-screen flex-col">
          <PublicHeader />
          <div className="flex flex-1">
            <div className="hidden lg:flex">
              <RequestStepsSidebar currentStep={4} />
            </div>
            <section className="flex min-w-0 flex-1 items-start justify-center p-6 sm:p-8 lg:items-center">
              {email === "" ? <EmailGate onSubmit={setEmail} /> : <ActivationFlow key={email} email={email} />}
            </section>
          </div>
        </div>
      </AccessRequestProvider>
    </main>
  );
}

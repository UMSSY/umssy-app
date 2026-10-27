"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/shared/components/layout/brand-logo";
import { apiClient, isApiError } from "@/shared/services/api-client";

export function ActivateApprovedAccountView({ requestId }: { requestId: string }) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [activated, setActivated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      await apiClient.post(`/access-requests/${encodeURIComponent(requestId)}/activate`, { code, password });
      setPassword(""); setCode(""); setActivated(true);
    } catch (failure) {
      setError(isApiError(failure) && typeof failure.response?.data?.detail === "string"
        ? failure.response.data.detail : "No se pudo activar tu cuenta. Comprueba los datos y vuelve a intentar.");
    } finally { inFlight.current = false; setPending(false); }
  }
  return <main className="flex min-h-dvh items-center justify-center bg-surface p-6">
    <section className="w-full max-w-lg space-y-6 rounded-lg border border-border p-6 sm:p-8">
      <Link href="/" aria-label="UMSSY, volver al inicio"><BrandLogo className="w-48" /></Link>
      <h1 className="text-2xl font-bold text-ink">Activa tu cuenta aprobada</h1>
      {activated ? <>
        <p role="status">Tu cuenta está activada y vinculada a tu solicitud aprobada. Ya puedes iniciar sesión y participar en UMSSY.</p>
        <Link href="/login" className="font-semibold text-accent underline">Iniciar sesión</Link>
      </> : !requestId ? <p role="alert">Abre el enlace de activación que recibiste en tu correo institucional.</p> : <form onSubmit={submit} className="space-y-5">
        <p className="text-sm text-text-secondary">Ingresa el código de tu correo institucional y elige una contraseña. Si ya tienes una cuenta, utiliza su contraseña actual para vincular la aprobación.</p>
        <div className="space-y-2"><Label htmlFor="activation-code">Código de activación</Label><Input id="activation-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} required disabled={pending} /></div>
        <div className="space-y-2"><Label htmlFor="activation-password">Contraseña</Label><Input id="activation-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} required disabled={pending} /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={pending}>{pending ? "Activando cuenta..." : "Activar cuenta"}</Button>
      </form>}
    </section>
  </main>;
}

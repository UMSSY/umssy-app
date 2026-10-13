"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import axios from "axios";
import { apiClient } from "@/shared/services/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterView() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    setError("");
    if (password !== form.get("confirmPassword")) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.post("/auth/register", {
        firstName: String(form.get("firstName") ?? "").trim(),
        lastName: String(form.get("lastName") ?? "").trim(),
        email: String(form.get("email") ?? "").trim().toLowerCase(),
        password,
        roleTag: form.get("roleTag"),
      });
      setIsCreated(true);
    } catch (cause) {
      if (axios.isAxiosError(cause) && cause.response?.status === 409) {
        setError("Ya existe una cuenta con este correo. Puedes iniciar sesión.");
      } else if (axios.isAxiosError(cause) && cause.response?.status === 400) {
        setError("Revisa los datos. La contraseña debe tener al menos 8 caracteres y no ser demasiado larga.");
      } else {
        setError("No se pudo crear la cuenta. Inténtalo de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-soft px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="font-tight text-3xl font-extrabold text-ink">UMSSY</span>
        <span className="h-6 w-px bg-gold" aria-hidden="true" />
        <span className="text-sm text-text-secondary">Universidad para el futuro</span>
      </div>
      <section className="w-full max-w-[420px] rounded-[10px] border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="font-tight text-[26px] font-extrabold text-ink">Crear cuenta</h1>
        {isCreated ? (
          <div className="mt-4">
            <p role="status" className="text-ink">Tu cuenta está creada. Ya puedes iniciar sesión con el correo, la contraseña y el rol que elegiste.</p>
            <Link href="/login" className="mt-6 block rounded-lg bg-ink px-4 py-3 text-center font-semibold text-surface">Iniciar sesión</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="register-role">Rol</Label>
              <select id="register-role" name="roleTag" defaultValue="estudiante" className="mt-1.5 h-[42px] w-full rounded-lg border border-border bg-surface px-3 text-ink">
                <option value="estudiante">Estudiante</option>
                <option value="titulado">Titulado</option>
              </select>
            </div>
            <div>
              <Label htmlFor="register-first-name">Nombres</Label>
              <Input id="register-first-name" name="firstName" autoComplete="given-name" required maxLength={100} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="register-last-name">Apellidos</Label>
              <Input id="register-last-name" name="lastName" autoComplete="family-name" required maxLength={100} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="register-email">Correo electrónico</Label>
              <Input id="register-email" name="email" type="email" autoComplete="email" required maxLength={150} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="register-password">Contraseña</Label>
              <Input id="register-password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} aria-describedby="password-hint" className="mt-1.5" />
              <p id="password-hint" className="mt-1 text-xs text-text-secondary">Usa al menos 8 caracteres.</p>
            </div>
            <div>
              <Label htmlFor="register-confirm-password">Confirmar contraseña</Label>
              <Input id="register-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={72} className="mt-1.5" />
            </div>
            {error ? <p role="alert" className="text-sm font-medium text-accent">{error}</p> : null}
            <Button type="submit" disabled={isLoading} className="h-[42px] w-full bg-ink text-surface hover:bg-ink/90">{isLoading ? "Creando cuenta..." : "Crear cuenta"}</Button>
            <p className="text-center text-sm text-text-secondary">¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-ink underline">Iniciar sesión</Link></p>
          </form>
        )}
      </section>
    </main>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveAccessToken } from "@/shared/services/storage/access-token-storage";
import { useLogin } from "../hooks/use-login";
import type { RoleTag } from "../types/auth-types";

const ROLE_OPTIONS: { value: RoleTag; label: string }[] = [
  { value: "titulado", label: "Titulado" },
  { value: "estudiante", label: "Estudiante" },
  { value: "mentor", label: "Mentor" },
  { value: "empresa", label: "Empresa" },
  { value: "administrativo", label: "Administrativo" },
];

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export function LoginView() {
  const router = useRouter();
  const { login, isLoading, error } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleTag, setRoleTag] = useState<RoleTag>("titulado");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = await login({ email, password, roleTag });
    if (result) {
      saveAccessToken(result.accessToken);
      router.push("/profile");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm"
      >
        <h1 className="mb-1 text-2xl font-bold text-foreground">Iniciar sesión</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Comunidad verificada de la UMSS
        </p>

        <label className="mb-1 block text-sm font-medium text-foreground">Rol</label>
        <select
          value={roleTag}
          onChange={(event) => setRoleTag(event.target.value as RoleTag)}
          className={`mb-4 ${selectClassName}`}
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="mb-1 block text-sm font-medium text-foreground">
          Correo electrónico
        </label>
        <Input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mb-4"
          placeholder="nombre@ejemplo.com"
        />

        <label className="mb-1 block text-sm font-medium text-foreground">Contraseña</label>
        <Input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mb-6"
          placeholder="********"
        />

        {error ? <p className="mb-4 text-sm font-medium text-destructive">{error}</p> : null}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Ingresando..." : "Iniciar sesión"}
        </Button>
      </form>
    </div>
  );
}

"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuditSearchInputProps } from "../../types/audit-log-extras-props.types";

export function AuditSearchInput({ id, value, onChange }: AuditSearchInputProps) {
  return (
    <div className="relative w-full min-w-0">
      <Label htmlFor={id} className="sr-only">
        Buscar por código SOL o nombre
      </Label>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-secondary" strokeWidth={1.75} aria-hidden="true" />
      <Input
        id={id}
        type="search"
        value={value}
        maxLength={100}
        autoComplete="off"
        placeholder="Buscar por código SOL o nombre"
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border-border bg-surface pr-3 pl-9 text-sm text-ink focus-visible:border-accent focus-visible:ring-interaction"
      />
    </div>
  );
}

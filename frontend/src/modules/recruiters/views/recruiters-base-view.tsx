'use client';

import { AppShell } from "@/shared/components/layout";
import { RECRUITERS_NAVIGATION } from "../constants/navigation";

export function RecruitersBaseView({ children }: { children?: React.ReactNode }) {
  return (
    <AppShell items={RECRUITERS_NAVIGATION}>
      <div className="w-full max-w-5xl mx-auto p-6">
        <h1 className="font-tight text-3xl font-extrabold text-ink mb-6">Publicar vacante</h1>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {children}
        </div>
      </div>
    </AppShell>
  );
}
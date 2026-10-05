"use client";

import { AreaDetailInteraction } from "@/modules/radar-chart/components/area-detail-interaction";

export default function AreaDetailInteractionPreviewPage() {
  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold">
          Prueba de interacción del detalle por área
        </h1>

        <AreaDetailInteraction initialArea="desarrollo" />
      </div>
    </main>
  );
}
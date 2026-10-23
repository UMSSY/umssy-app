import { AreaDetailInteraction } from "../components/area-detail-interaction";
import { PageHeading } from "@/shared/components/layout";

export function AreaDetailInteractionPreviewView() {
  return (
    <main className="bg-background">
      <div className="mx-auto max-w-7xl">
        <PageHeading className="mb-6" title="Detalle por área" description="Explora cada competencia y compara sus niveles. Vista de demostración." />

        <AreaDetailInteraction initialArea="desarrollo" />
      </div>
    </main>
  );
}

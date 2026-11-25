import { PageHeading } from "@/shared/components/layout/page-heading";

export function PersonalDataIntro() {
  return (
    <>
      <PageHeading
        title="Solicita tu acceso a la comunidad"
        description="La carrera verifica cada solicitud con tu documento académico. Así la comunidad reúne solo a titulados reales de Ingeniería de Sistemas e Informática."
      />

      <p className="text-xs text-text-secondary">
        <span aria-hidden="true" className="font-semibold text-red-600">
          *
        </span>{" "}
        Campo obligatorio
      </p>
    </>
  );
}

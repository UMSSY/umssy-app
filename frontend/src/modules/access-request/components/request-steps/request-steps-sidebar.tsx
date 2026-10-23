import { Check, ShieldCheck } from "lucide-react";
import type { RequestStepsSidebarProps } from "../../types/request-steps-sidebar-props.types";

const STEPS = [
  { number: 1, label: "Tus datos", description: "Quién eres y cómo contactarte" },
  {
    number: 2,
    label: "Documento de respaldo",
    description: "Diploma académico o título en provisión nacional",
  },
  { number: 3, label: "Revisión de la carrera", description: "Hasta 48 horas hábiles" },
  { number: 4, label: "Activación de cuenta", description: "Código enviado a tu correo" },
];

export function RequestStepsSidebar({ currentStep = 1 }: RequestStepsSidebarProps) {
  return (
    <aside className="flex w-72 shrink-0 flex-col justify-between gap-10 border-r border-sidebar-border bg-sidebar px-6 py-8 text-sidebar-foreground">
      <div>
        <h2 className="text-2xl font-bold">Solicitud de acceso</h2>
        <p className="mt-2 mb-[22px] max-w-75 text-sm text-text-secondary">
          Cuatro pasos para unirte a la comunidad verificada de la carrera.
        </p>

        <nav aria-label="Pasos de la solicitud">
          <ol>
            {STEPS.map((step, index) => {
              const isActive = step.number === currentStep;
              const isCompleted = step.number < currentStep;
              const isLast = index === STEPS.length - 1;

              return (
                <li key={step.number} aria-current={isActive ? "step" : undefined}>
                  <div className="flex items-center gap-3.5 py-3">
                    <span
                      className={`flex size-7.5 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                        isActive
                          ? "border-accent bg-interaction text-accent"
                          : isCompleted
                            ? "border-accent bg-accent text-surface"
                            : "border-border-strong text-text-secondary"
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <Check aria-hidden="true" className="size-4" />
                          <span className="sr-only">Paso completado</span>
                        </>
                      ) : (
                        step.number
                      )}
                    </span>
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          isActive ? "text-ink" : "text-ink-soft"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-sm text-text-secondary">{step.description}</p>
                    </div>
                  </div>
                  {isLast ? null : (
                    <span
                      aria-hidden="true"
                      className="ml-3.5 block h-[18px] w-[1.5px] bg-border"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="flex items-start gap-3 border-t border-sidebar-border pt-[18px]">
        <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-accent" />
        <p className="text-sm text-ink-soft">
          Tus documentos se guardan cifrados y solo los revisa el personal autorizado de la
          carrera.
        </p>
      </div>
    </aside>
  );
}

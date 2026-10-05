import { Check } from 'lucide-react';
import type { RequestStepsSidebarProps } from '../types/request-status.types';

const STEPS = [
  { id: 'personal-data', title: 'Tus datos', description: null },
  { id: 'support-document', title: 'Documento de respaldo', description: 'Diploma o título' },
  { id: 'career-review', title: 'Revisión de la carrera', description: null },
  { id: 'account-activation', title: 'Activación de cuenta', description: null },
] as const;

export function RequestStepsSidebar({ currentStep }: RequestStepsSidebarProps) {
  const currentTitle = STEPS[currentStep - 1]?.title ?? '';

  return (
    <>
      {/* Versión celular: indicador compacto arriba */}
      <div className="bg-[#0B1F2E] px-5 py-4 text-white md:hidden">
        <p className="text-[15px] font-bold">UMSSY</p>
        <p className="mt-1 text-[12.5px] text-white/70">
          Paso {currentStep} de {STEPS.length}: {currentTitle}
        </p>
      </div>

      {/* Versión escritorio: barra lateral */}
      <aside className="hidden w-72 shrink-0 flex-col bg-[#0B1F2E] px-6 py-8 text-white md:flex">
        <div className="mb-10">
          <p className="text-[22px] font-extrabold leading-none">UMSSY</p>
          <p className="mt-2 text-[12.5px] text-white/70">Comunidad de la UMSS</p>
        </div>

        <nav aria-label="Pasos de la solicitud">
          <ol className="space-y-2">
            {STEPS.map((step, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isActive = stepNumber === currentStep;

              return (
                <li
                  key={step.id}
                  aria-current={isActive ? 'step' : undefined}
                  className={`flex items-start gap-3 rounded-[6px] px-3 py-3 ${
                    isActive ? 'bg-[#E30613]/15' : ''
                  }`}
                >
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center">
                    {isCompleted && <Check className="h-4 w-4 text-white/70" aria-hidden="true" />}
                    {isActive && <span className="h-2.5 w-2.5 rounded-full bg-[#E30613]" />}
                    {!isCompleted && !isActive && (
                      <span className="h-2.5 w-2.5 rounded-full border border-white/40" />
                    )}
                  </span>
                  <span>
                    <span
                      className={`block text-[14px] ${
                        isActive ? 'font-bold text-white' : 'font-semibold text-white/60'
                      }`}
                    >
                      {step.title}
                    </span>
                    {step.description && (
                      <span className="mt-0.5 block text-[12px] text-white/50">
                        {step.description}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>
      </aside>
    </>
  );
}

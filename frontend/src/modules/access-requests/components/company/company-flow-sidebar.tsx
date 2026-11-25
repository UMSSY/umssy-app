'use client';

import { Check, ShieldCheck } from 'lucide-react';
import { cn } from 'cn';
import type { CompanyFlowSidebarProps } from '../../types/company-flow-sidebar-props.types';

const STEPS = [
  {
    number: 1,
    title: 'Datos de la empresa',
    description: 'Información institucional y logo corporativo',
  },
  {
    number: 2,
    title: 'Carta de solicitud',
    description: 'Documento formal en hoja membretada',
  },
  {
    number: 3,
    title: 'Revisión de la carrera',
    description: 'Hasta 48 horas hábiles',
  },
  {
    number: 4,
    title: 'Activación de cuenta',
    description: 'Código enviado a tu correo',
  },
] as const;

export function CompanyFlowSidebar({ step }: CompanyFlowSidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 border-b border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground sm:px-6 lg:sticky lg:top-app-header lg:h-app-sidebar lg:w-72 lg:justify-between lg:gap-10 lg:self-start lg:overflow-y-auto lg:border-r lg:border-b-0 lg:px-6 lg:py-8">
      <div>
        <h2 className="font-tight text-xl font-bold text-accent lg:text-2xl">
          Solicitud de empresa
        </h2>
        <p className="mt-2 hidden max-w-75 text-sm text-text-secondary lg:mb-[22px] lg:block">
          Cuatro pasos para registrar tu empresa y publicar ofertas laborales.
        </p>

        <nav aria-label="Pasos de la solicitud" className="mt-3 lg:mt-0">
          <ol className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4 lg:block">
            {STEPS.map((item, index) => {
              const isActive = step === item.number;
              const isCompleted = step > item.number;
              const isLast = index === STEPS.length - 1;

              return (
                <li
                  key={item.number}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <div className="flex items-center gap-2.5 lg:gap-3.5 lg:py-3">
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold lg:size-7.5',
                        isActive
                          ? 'border-accent bg-interaction text-accent'
                          : isCompleted
                            ? 'border-accent bg-accent text-surface'
                            : 'border-border-strong text-text-secondary',
                      )}
                    >
                      {isCompleted ? (
                        <>
                          <Check aria-hidden="true" className="size-4" />
                          <span className="sr-only">Paso completado</span>
                        </>
                      ) : (
                        item.number
                      )}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'text-sm leading-tight font-semibold',
                          isActive ? 'text-ink' : 'text-ink-soft',
                        )}
                      >
                        {item.title}
                      </p>
                      <p className="hidden text-sm text-text-secondary lg:block">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  {isLast ? null : (
                    <span
                      aria-hidden="true"
                      className="ml-3.5 hidden h-[18px] w-[1.5px] bg-border lg:block"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="flex items-start gap-3 border-t border-sidebar-border pt-3 lg:pt-[18px]">
        <ShieldCheck
          aria-hidden="true"
          className="size-5 shrink-0 text-accent"
        />
        <p className="text-sm text-ink-soft">
          Tu documentación empresarial es validada por la Dirección de Carrera de
          Ingeniería de Sistemas e Informática.
        </p>
      </div>
    </aside>
  );
}

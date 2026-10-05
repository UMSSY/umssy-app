'use client';

import { RequestStepsSidebar } from '../components/request-steps-sidebar';
import { RequestTimeline } from '../components/request-timeline';
import { useRequestStatus } from '../hooks/use-request-status';
import { STATUS_LABELS, useRequestTimeline } from '../hooks/use-request-timeline';
import type { RequestStatusViewProps } from '../types/request-status.types';

const REVIEW_STEP_NUMBER = 3;

export function RequestStatusView({ requestCode }: RequestStatusViewProps) {
  const { data, isLoading, isError } = useRequestStatus(requestCode);
  const stages = useRequestTimeline(data);

  const isUnderReview = data?.status === 'PENDING' || data?.status === 'IN_REVIEW';

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#0B1F2E] md:flex">
      <RequestStepsSidebar currentStep={REVIEW_STEP_NUMBER} />

      <main className="flex-1 px-5 py-8 md:px-12 md:py-12">
        <div className="mx-auto max-w-2xl">
          <span aria-hidden="true" className="mb-3 block h-[3px] w-[26px] bg-[#C9A227]" />
          <h1 className="text-[26px] font-extrabold leading-tight">
            Revisión de la carrera
          </h1>

          {isLoading && (
            <p className="mt-6 text-[14px] text-[#5B6470]">
              Cargando el estado de tu solicitud...
            </p>
          )}

          {!isLoading && (isError || !data) && (
            <p role="alert" className="mt-6 text-[14px] font-bold text-[#B4050F]">
              No encontramos una solicitud con ese código.
            </p>
          )}

          {data && (
            <div className="mt-6 space-y-6">
              <section className="rounded-[10px] border border-[#E3E7EC] bg-white p-6 shadow-[0_1px_2px_rgba(11,31,46,0.04)]">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-[11.5px] font-semibold uppercase text-[#5B6470]">
                      Estado actual
                    </dt>
                    <dd
                      className={`mt-1 text-[15px] font-bold ${
                        data.status === 'REJECTED' ? 'text-[#B4050F]' : 'text-[#0B1F2E]'
                      }`}
                    >
                      {STATUS_LABELS[data.status]}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11.5px] font-semibold uppercase text-[#5B6470]">
                      Código de solicitud
                    </dt>
                    <dd className="mt-1 text-[15px] font-semibold text-[#33465A]">
                      {data.requestCode}
                    </dd>
                  </div>
                </dl>

                {isUnderReview && (
                  <p className="mt-5 text-[14px] leading-relaxed text-[#33465A]">
                    Estamos revisando tu solicitud. Este proceso puede tardar hasta 48
                    horas hábiles. Te avisaremos a{' '}
                    <strong className="font-bold text-[#0B1F2E]">{data.email}</strong>.
                  </p>
                )}
              </section>

              <section className="rounded-[10px] border border-[#E3E7EC] bg-white p-6 shadow-[0_1px_2px_rgba(11,31,46,0.04)]">
                <h2 className="mb-6 text-[17px] font-bold">Seguimiento de tu solicitud</h2>
                <RequestTimeline stages={stages} />
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

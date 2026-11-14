"use client";
import { PageHeading } from "@/shared/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { useCompanyApplicants } from "../hooks/use-company-applicants";
import dynamic from "next/dynamic";

const MatchingDemoView = dynamic(() =>
  import("./matching-demo-view").then((module) => module.MatchingDemoView),
);

function CompanyApplicantsView() {
  const { companyId, vacancies, applicants, offerId, selectOffer, isLoading } =
    useCompanyApplicants();
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeading
        title="Postulantes"
        description="Consulta las postulaciones recibidas en las vacantes de tu empresa."
      />
      {isLoading || vacancies.isLoading ? (
        <p role="status">Cargando vacantes…</p>
      ) : !companyId ? (
        <p>No tienes una empresa asignada para consultar postulaciones.</p>
      ) : vacancies.isError ? (
        <div role="alert">
          <p>No se pudieron cargar las vacantes.</p>
          <Button onClick={() => void vacancies.refetch()}>Reintentar</Button>
        </div>
      ) : !vacancies.data?.length ? (
        <p>Aún no tienes vacantes publicadas.</p>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="matching-vacancy">Vacante</Label>
            <NativeSelect
              id="matching-vacancy"
              value={offerId ?? ""}
              onChange={(event) => selectOffer(event.target.value)}
            >
              {vacancies.data.map((offer) => (
                <NativeSelectOption key={offer.id} value={offer.id}>
                  {offer.title}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          {applicants.isLoading ? (
            <p role="status">Cargando postulantes…</p>
          ) : applicants.isError ? (
            <div role="alert">
              <p>No se pudieron cargar las postulaciones.</p>
              <Button onClick={() => void applicants.refetch()}>
                Reintentar
              </Button>
            </div>
          ) : !applicants.data?.applicants.length ? (
            <p>Esta vacante aún no tiene postulaciones.</p>
          ) : (
            <ul className="space-y-3">
              {applicants.data.applicants.map((applicant) => (
                <li key={applicant.id}>
                  <Card>
                    <CardContent className="space-y-2 py-4">
                      <h2 className="font-semibold">{applicant.fullName}</h2>
                      <p>{applicant.headline}</p>
                      <p className="text-sm text-text-secondary">
                        {applicant.email}
                      </p>
                      <p className="text-sm">{applicant.status}</p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}

export function MatchingView() {
  if (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_ENABLE_MATCHING_DEMO === "true"
  )
    return <MatchingDemoView />;
  return <CompanyApplicantsView />;
}

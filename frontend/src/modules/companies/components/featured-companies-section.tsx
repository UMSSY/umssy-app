"use client";
import { Button } from "@/components/ui/button";
import { useFeaturedCompanies } from "../hooks/use-featured-companies";
import { FEATURED_COMPANIES_GRID_CLASS, FEATURED_COMPANIES_SKELETON_COUNT } from "../constants/companies.constants";
import { CompanyCard } from "./company-card";
import { CompanyCardSkeleton } from "./company-card-skeleton";

export function FeaturedCompaniesSection() {
  const query = useFeaturedCompanies();
  if (query.isPending) {
    return (
      <div role="status" aria-label="Cargando empresas" className={FEATURED_COMPANIES_GRID_CLASS}>
        {Array.from({ length: FEATURED_COMPANIES_SKELETON_COUNT }, (_, index) => <CompanyCardSkeleton key={index} />)}
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="rounded-lg border border-border p-6">
        <p className="mb-4 text-text-secondary">Las empresas destacadas no están disponibles por el momento.</p>
        <Button variant="outline" onClick={() => void query.refetch()}>Volver a intentar</Button>
      </div>
    );
  }
  if (!query.data.length) return <p className="py-8 text-text-secondary">Pronto publicaremos nuevas empresas destacadas.</p>;
  return <div className={FEATURED_COMPANIES_GRID_CLASS}>{query.data.map((company) => <CompanyCard key={company.id} company={company} />)}</div>;
}
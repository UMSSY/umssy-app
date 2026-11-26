"use client";

import { Button } from "@/components/ui/button";
import { FEATURED_COMPANIES_LABELS } from "../constants/featured-companies.labels";
import { useFeaturedCompanies } from "../hooks/use-featured-companies";
import { CompanyCard } from "./company-card";
import { CompanyCardSkeleton } from "./company-card-skeleton";

const GRID_CLASS = "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3";
const SKELETON_COUNT = 3;

export function FeaturedCompaniesSection() {
  const query = useFeaturedCompanies();

  if (query.isPending) {
    return (
      <div role="status" aria-label={FEATURED_COMPANIES_LABELS.loading} className={GRID_CLASS}>
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <CompanyCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="rounded-lg border border-border p-6">
        <p className="mb-4 text-text-secondary">{FEATURED_COMPANIES_LABELS.error}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          {FEATURED_COMPANIES_LABELS.retry}
        </Button>
      </div>
    );
  }

  if (!query.data.length) return <p className="py-8 text-text-secondary">{FEATURED_COMPANIES_LABELS.empty}</p>;

  return (
    <div className={GRID_CLASS}>
      {query.data.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  );
}

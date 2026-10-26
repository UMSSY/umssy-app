export const jobOffersQueryKeys = {
  all: ["job-offers"] as const,
  byCompany: (companyId: string) =>
    [...jobOffersQueryKeys.all, "by-company", companyId] as const,
  catalog: () => [...jobOffersQueryKeys.all, "skills-catalog"] as const,
};
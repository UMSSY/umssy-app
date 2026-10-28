export const JOB_OFFERS_QUERY_KEYS = {
  skillCatalog: ["job-offers", "skill-catalog"] as const,
  company: (companyId: string | null) => ["job-offers", "company", companyId] as const,
  companyOffers: (companyId: string | null, params?: object) =>
    ["job-offers", "company", companyId, params] as const,
  companyOfferDetails: (companyId: string | null, jobOfferId: string | null) =>
    ["job-offers", "company", companyId, "details", jobOfferId] as const,
};

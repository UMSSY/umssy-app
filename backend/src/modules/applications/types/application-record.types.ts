export type ApplicationRecord = {
  id: string;
  jobOfferId: string;
  appliedAt: Date | string;
  status: { title: string };
  jobOffer: {
    title: string;
    company: { title: string };
  };
};
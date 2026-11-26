export interface CompanyRegistrationDuplicates {
  existingCompany: { id: string } | null;
  existingUser: { id: string } | null;
  activeRequest: { companyName: string; email: string } | null;
  existingUsername: { source: string } | null;
}

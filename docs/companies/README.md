# Companies Module

## Overview

The **Companies Module** exposes company identity and asset resources used across onboarding, recruiter management, vacancy publishing, and local development fixtures. Company profiles (`CompanyProfile`), logos (`CompanyLogo`), and onboarding approvals are provisioned upon activation through the [Company Access Requests Module](../company-access-requests/README.md), while the company fixture seeder provides organization records for local development and seed scenarios.

## Related Flows

```mermaid
flowchart LR
  Request[Approved CompanyAccessRequest] --> Activation[OTP Activation]
  Activation --> Company[Company Record]
  Activation --> Profile[CompanyProfile]
  Activation --> Logo[CompanyLogo]
  Company --> Vacancies[Job Offers & Applications]
```

## Company profile endpoint

`GET /companies/:companyId/profile` returns the institutional profile of the company of the session: name, description, sector, city, phone, email, website and the logo path relative to the API (`/companies/:companyId/logo`, or `null` without a logo). It requires the `empresa` role and the company of the session (`CompanyOwnershipGuard`). Contact fields are `null` while the company has no `company_profiles` row, an empty website or description is returned as `null`, and a missing company answers `COMPANY_NOT_FOUND`. The [company profile](../company-profile/README.md) screen uses it.

## Featured companies endpoint

`GET /companies/featured` is public and feeds the **Empresas destacadas** section of the landing page. It returns up to three companies registered through the company onboarding (they have a `company_profiles` row) that have published job offers that have not expired, ordered by the number of those offers and then by name. Each item has the company name, sector from `company_profiles`, description (`null` when empty), logo path relative to the API (`null` without a logo) and `activeVacanciesCount`. The counts come from `JobOffersService.countActiveOffersByCompany`, so this module does not read the job offers tables directly.

The frontend `companies` module shows each company as a card with its sector, logo or initials, description, vacancy count and a link to the vacancies page, with loading, empty and retry states.

## Key Data Structures
- **`companies`**: Core organization identity record referenced by profiles, logos, experiences, and job offers.
- **`company_profiles`**: Verified corporate contact details (`sector`, `email`, `phone`, `website_url`, `city_id`).
- **`company_logos`**: Persisted binary logo metadata (`file_name`, `mime_type`, `size_bytes`, `data`) served via `/companies/:companyId/logo`.

## Sprint History

### Sprint 3
- Added `CompanyProfile` and `CompanyLogo` provisioning during company onboarding activation, authenticated company logo retrieval endpoints, and local development company fixture seeders.
- Added the read-only company profile endpoint (`GET /companies/:companyId/profile`) for the recruiter company profile screen.
- Added the public featured companies endpoint (`GET /companies/featured`) and the featured companies section of the landing page.

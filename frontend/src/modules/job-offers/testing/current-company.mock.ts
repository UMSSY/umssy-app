import { vi } from "vitest";
import { getSessionRoleTag } from "../utils/get-session-role-tag";
import { COMPANY_ID } from "./vacancy-fixtures";

vi.mock("@/modules/job-offers/hooks/use-current-company", () => ({
  useCurrentCompany: () =>
    getSessionRoleTag() === "empresa"
      ? { id: COMPANY_ID, name: "TechBolivia S.R.L.", initials: "TB" }
      : { id: null, name: "Empresa sin asignar", initials: "ES" },
}));

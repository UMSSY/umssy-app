import { vi } from "vitest";
import { DEGREE_CATALOG_FIXTURE } from "./degree-catalog.fixture";

vi.mock("@/modules/educations/hooks/use-education-degrees", () => ({
  useEducationDegrees: () => ({
    data: DEGREE_CATALOG_FIXTURE,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

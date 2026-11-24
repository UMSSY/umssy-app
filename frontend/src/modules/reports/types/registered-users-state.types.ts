import type { PaginatedData } from "@/shared/types/api-response.types";
import type { RegisteredUser } from "./registered-user.types";

export interface RegisteredUsersState {
  requestKey: string;
  result?: PaginatedData<RegisteredUser>;
  snapshotAt?: string;
  errorMessage?: string;
  hasConnectionError?: boolean;
}

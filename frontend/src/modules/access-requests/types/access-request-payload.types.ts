import type { Career } from "../constants/careers.constants";
import type { IdCardIssuedIn } from "../constants/id-card-issued-in.constants";

export interface AccessRequestPayload {
  firstName: string;
  lastName: string;
  idCardNumber: string;
  idCardIssuedIn: IdCardIssuedIn;
  sisCode: string;
  email: string;
  phone?: string | null;
  birthDate: string;
  graduationYear: number;
  career: Career;
}

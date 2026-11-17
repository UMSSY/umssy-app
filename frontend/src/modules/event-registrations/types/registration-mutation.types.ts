export interface RegistrationMutation {
  eventId: string;
  accessToken: string | null;
}

export interface CancelRegistrationMutation extends RegistrationMutation {
  registrationId: string;
}

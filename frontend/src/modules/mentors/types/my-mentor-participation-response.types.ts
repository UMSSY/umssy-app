export type MyMentorParticipationResponse = {
  status: "ACTIVE" | "DEACTIVATED" | "NEVER";
  areas: { id: string; name: string }[];
  orientations: { id: string; name: string }[];
};

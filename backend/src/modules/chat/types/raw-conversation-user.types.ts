export interface RawConversationUser {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: Uint8Array | null;
  email?: string | null;
  headline?: string | null;
  roles?: Array<{
    role: { name: string };
  }>;
  educations?: Array<{
    degree: string;
    institution: string;
  }>;
  userSkills?: Array<{
    skill: { name: string };
  }>;
}

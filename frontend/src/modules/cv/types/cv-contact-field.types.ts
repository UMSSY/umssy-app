import type { CvExtractedContact } from "./cv-extracted-contact.types";

export type CvContactField = Exclude<keyof CvExtractedContact, "location">;

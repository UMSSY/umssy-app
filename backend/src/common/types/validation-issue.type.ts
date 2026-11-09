export interface ValidationIssue {
  message: string;
  path?: readonly (PropertyKey | { key: PropertyKey })[];
}

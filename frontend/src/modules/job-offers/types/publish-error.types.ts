import type { PublishErrorKind } from "./publish-error-kind.types";

export interface PublishError {
  kind: PublishErrorKind;
  message: string;
  details: string[];
}

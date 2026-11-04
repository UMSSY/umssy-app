import { GOOGLE_MAPS_LINK_REGEX } from "../constants/job-offers.constants";

export function getSafeMapsUrl(value: string | null | undefined): string | null {
  const url = (value ?? "").trim();
  return GOOGLE_MAPS_LINK_REGEX.test(url) ? url : null;
}

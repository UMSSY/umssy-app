import type { NavigationItem } from "./navigation-item.types";

export interface NavigationSection {
  sectionLabel: string;
  items: NavigationItem[];
}

export function isNavigationSection(
  entry: NavigationItem | NavigationSection,
): entry is NavigationSection {
  return "sectionLabel" in entry;
}

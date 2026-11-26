import type { DirectoryPage } from "./mentor-directory.types";

export type MentorDirectoryViewProps = {
  directoryState?: Pick<DirectoryPage, "effectiveSort" | "affinityStatus"> &
    Partial<Pick<DirectoryPage, "totalPages">>;
};

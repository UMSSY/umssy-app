import type { MentorDirectoryParams } from "../types/mentor-directory-params.types";

import { apiClient } from "@/shared/services/api-client";
import type { ApiResponse } from "@/shared/types/api-response.types";
import type { DirectoryPage } from "../types/mentor-directory.types";
import { resolveMentorPhotoUrl } from "../utils/resolve-mentor-photo-url";

export async function getMentorDirectory(
  params: MentorDirectoryParams,
  signal?: AbortSignal,
): Promise<DirectoryPage> {
  const response = await apiClient.get<ApiResponse<DirectoryPage>>(
    "/mentors/directory",
    {
      params: {
        page: params.page,
        search: params.search || undefined,
        area: params.area || undefined,
        orientation: params.orientation || undefined,
        available: String(params.available),
        sort: params.sort,
      },
      signal,
    },
  );

  return {
    ...response.data.data,
    items: response.data.data.items.map((mentor) => ({
      ...mentor,
      photoUrl: resolveMentorPhotoUrl(mentor.photoUrl),
    })),
  };
}

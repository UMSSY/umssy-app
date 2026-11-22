import { queryOptions } from "@tanstack/react-query";
import { notificationPreferencesService } from "../services/notification-preferences.service";

export const notificationPreferencesQuery = queryOptions({
  queryKey: ["notifications", "preferences"] as const,
  queryFn: () => notificationPreferencesService.get(),
});

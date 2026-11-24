"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationPreferencesService } from "../services/notification-preferences.service";
import type { NotificationChannel } from "../types/notification-channel.types";
import { channelToPreferences } from "../utils/channel-to-preferences";
import { notificationPreferencesQuery } from "../utils/notification-preferences-query";
import { preferencesToChannel } from "../utils/preferences-to-channel";

export function useNotificationPreferences() {
  const queryClient = useQueryClient();

  const query = useQuery(notificationPreferencesQuery);

  const mutation = useMutation({
    mutationFn: (channel: NotificationChannel) =>
      notificationPreferencesService.update(channelToPreferences(channel)),
    onSuccess: (_data, channel) => {
      queryClient.setQueryData(notificationPreferencesQuery.queryKey, channelToPreferences(channel));
    },
  });

  return {
    savedChannel: query.data ? preferencesToChannel(query.data) : null,
    isLoading: query.isPending,
    loadError: query.isError,
    isSaving: mutation.isPending,
    saveChannel: (channel: NotificationChannel) => mutation.mutateAsync(channel),
  };
}
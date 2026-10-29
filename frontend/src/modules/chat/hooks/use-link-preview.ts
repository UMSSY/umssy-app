"use client";

import { useEffect, useState } from "react";
import type { LinkPreviewResponse } from "../types/link-preview.types";
import { getLinkPreview } from "../services/chat-api";

export function useLinkPreview(url: string | null | undefined): {
  preview: LinkPreviewResponse | null;
  isLoading: boolean;
} {
  const [previewState, setPreviewState] = useState<{
    url: string;
    data: LinkPreviewResponse | null;
  } | null>(null);

  const isValidUrl = Boolean(
    url && (url.startsWith("http://") || url.startsWith("https://"))
  );

  useEffect(() => {
    if (!isValidUrl || !url) {
      return;
    }

    let isMounted = true;

    getLinkPreview(url)
      .then((data) => {
        if (isMounted) {
          setPreviewState({ url, data });
        }
      })
      .catch(() => {
        if (isMounted) {
          setPreviewState({ url, data: null });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isValidUrl, url]);

  const preview =
    previewState && previewState.url === url ? previewState.data : null;
  const isLoading = isValidUrl && (!previewState || previewState.url !== url);

  return { preview, isLoading };
}

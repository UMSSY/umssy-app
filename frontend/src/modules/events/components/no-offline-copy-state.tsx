import { WifiOff } from "lucide-react";
import { OFFLINE_PASSES_TEXTS } from "../constants/offline-passes.constants";

export function NoOfflineCopyState() {
  return (
    <section
      role="status"
      aria-labelledby="no-offline-copy-title"
      className="mx-auto flex w-full max-w-2xl flex-col items-center rounded-lg border border-border bg-surface px-6 py-12 text-center sm:px-10 sm:py-16"
    >
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-surface-soft text-ink">
        <WifiOff className="size-9" aria-hidden="true" />
      </div>
      <h2 id="no-offline-copy-title" className="text-xl font-bold text-ink sm:text-2xl">
        {OFFLINE_PASSES_TEXTS.noCopyTitle}
      </h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-text-secondary">
        {OFFLINE_PASSES_TEXTS.noCopyDescription}
      </p>
    </section>
  );
}

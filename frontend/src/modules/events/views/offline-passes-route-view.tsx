"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { BrandLogo } from "@/shared/components/layout";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  MY_PASSES_ROUTE,
  OFFLINE_PASSES_ROUTE_TEXTS,
} from "../constants/offline-passes.constants";
import { useOnlineStatus } from "../hooks/use-online-status";
import { MyPassesView } from "./my-passes-view";

const subscribeToNothing = () => () => {};

export function OfflinePassesRouteView() {
  const isHydrated = useSyncExternalStore(subscribeToNothing, () => true, () => false);
  const isOnline = useOnlineStatus();

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <header className="mx-auto mb-6 flex w-full max-w-7xl items-center">
        <BrandLogo />
      </header>
      {!isHydrated ? null : isOnline ? (
        <section
          role="status"
          className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-lg border border-border bg-surface px-6 py-12 text-center"
        >
          <h1 className="text-xl font-bold text-ink">{OFFLINE_PASSES_ROUTE_TEXTS.onlineTitle}</h1>
          <p className="text-sm text-text-secondary">{OFFLINE_PASSES_ROUTE_TEXTS.onlineDescription}</p>
          <Link href={MY_PASSES_ROUTE} className={buttonVariants()}>
            {OFFLINE_PASSES_ROUTE_TEXTS.openMyPasses}
          </Link>
        </section>
      ) : (
        <MyPassesView />
      )}
    </div>
  );
}

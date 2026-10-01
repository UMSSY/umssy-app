"use client";

import React from "react";
import { Shell } from "@/shared/components/layout";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Shell>{children}</Shell>;
}

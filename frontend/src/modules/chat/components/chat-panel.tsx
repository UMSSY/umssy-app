"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Maximize2, MessageCircle, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/shared/contexts/auth-context";
import { getRouteRoles } from "@/shared/utils/get-route-roles";
import { useMessagingUi } from "../contexts/messaging-ui-context";
import type { ChatPanelProps } from "../types/chat-panel-props.types";

const TRIGGER_ID = "quick-messages-trigger";
const DOCK_ID = "quick-messages-dock";
const ChatWorkspace = dynamic(() => import("./chat-workspace").then((module) => module.ChatWorkspace), { loading: () => <p role="status" className="p-6 text-sm text-text-secondary">Cargando mensajes…</p> });

export function ChatPanel({ roles }: ChatPanelProps) {
  const ui = useMessagingUi();
  const pathname = usePathname();
  if (!ui || pathname === "/chat" || !roles.some((role) => getRouteRoles("/chat").includes(role))) return null;
  return <Button id={TRIGGER_ID} type="button" variant="ghost" size="icon" aria-label="Abrir mensajes rápidos" aria-expanded={ui.isPanelOpen} aria-controls={DOCK_ID} onClick={() => ui.setIsPanelOpen(!ui.isPanelOpen)} className="border-app-header-foreground/70 bg-transparent text-app-header-foreground hover:border-app-header-foreground hover:bg-transparent hover:text-app-header-foreground focus-visible:ring-app-header-foreground aria-expanded:border-app-header-foreground aria-expanded:bg-transparent aria-expanded:text-app-header-foreground"><MessageCircle aria-hidden="true" /></Button>;
}

export function ChatDock() {
  const ui = useMessagingUi();
  const { roles } = useAuth();
  const pathname = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const canChat = roles.some((role) => getRouteRoles("/chat").includes(role));
  const isOpen = Boolean(ui?.isPanelOpen && canChat && pathname !== "/chat");
  const setIsPanelOpen = ui?.setIsPanelOpen;
  useEffect(() => { if (pathname === "/chat" || !canChat) setIsPanelOpen?.(false); }, [pathname, canChat, setIsPanelOpen]);
  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
    else if (wasOpen.current) document.getElementById(TRIGGER_ID)?.focus();
    wasOpen.current = isOpen;
  }, [isOpen]);
  if (!ui || !canChat || pathname === "/chat") return null;
  return (
    <div className={cn("sticky top-app-header h-app-sidebar min-w-0 shrink-0 self-start overflow-hidden transition-[width] duration-300 ease-out", isOpen ? "w-chat-dock" : "w-0")}>
      <div className="min-w-0 overflow-hidden" inert={!isOpen} aria-hidden={!isOpen || undefined}>
        <aside id={DOCK_ID} aria-label="Mensajes rápidos" className="flex h-app-sidebar w-chat-dock flex-col border-l border-sidebar-border bg-surface" onKeyDown={(event) => { if (event.key === "Escape" && !event.defaultPrevented) { event.stopPropagation(); ui.setIsPanelOpen(false); } }}>
          <header className="flex items-center justify-between gap-3 border-b border-border bg-sidebar p-4">
            <h2 className="font-bold text-ink">Mensajes</h2>
            <div className="flex items-center gap-1">
              <Link href="/chat" onClick={() => ui.setIsPanelOpen(false)} aria-label="Abrir mensajes en pantalla completa" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}><Maximize2 aria-hidden="true" /></Link>
              <Button ref={closeRef} variant="ghost" size="icon-sm" aria-label="Cerrar mensajes rápidos" onClick={() => ui.setIsPanelOpen(false)}><X aria-hidden="true" /></Button>
            </div>
          </header>
          <div className="flex min-h-0 flex-1 flex-col">{isOpen ? <ChatWorkspace isCompact /> : null}</div>
        </aside>
      </div>
    </div>
  );
}

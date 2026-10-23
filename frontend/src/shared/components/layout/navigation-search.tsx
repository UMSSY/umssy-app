"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, SearchX } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/shared/contexts/auth-context";
import { getWorkspaceTasks } from "@/shared/utils/get-workspace-tasks";
import { Button } from "@/components/ui/button";

export function NavigationSearch() {
  const { roles } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const tasks = getWorkspaceTasks(roles, search);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((previous) => !previous);
      }
    }
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <>
      <Button variant="outline" onClick={() => { setSearch(""); setIsOpen(true); }} className="h-9 w-full max-w-3xl justify-start gap-3 border-app-header-foreground/30 bg-app-header-foreground/5 text-app-header-foreground hover:bg-app-header-foreground/10 hover:text-app-header-foreground focus-visible:ring-app-header-foreground">
        <Search aria-hidden="true" /><span className="flex-1 text-left font-normal">Buscar una sección…</span><kbd className="rounded border border-app-header-foreground/25 px-1.5 py-0.5 text-xs font-normal text-app-header-foreground/80">Ctrl K</kbd>
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="gap-4 sm:max-w-xl">
          <DialogHeader><DialogTitle>¿Qué necesitas hacer?</DialogTitle><DialogDescription>Busca una sección de tu espacio.</DialogDescription></DialogHeader>
          <Input autoFocus aria-label="Buscar sección o tarea" placeholder="Por ejemplo: CV, mentor o reporte" value={search} onChange={(event) => setSearch(event.target.value)} />
          <div className="max-h-80 overflow-y-auto" aria-live="polite">
            {tasks.length ? <ul>{tasks.map((task) => <li key={task.href}><Link href={task.href} onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-md p-3 text-sm hover:bg-interaction"><task.icon className="size-4 text-ink-soft" aria-hidden="true" /><span className="flex-1">{task.label}</span><ArrowUpRight className="size-3.5 text-text-secondary" aria-hidden="true" /></Link></li>)}</ul> : <div className="flex flex-col items-center gap-2 py-8 text-sm text-text-secondary"><SearchX className="size-6" aria-hidden="true" /><p>No hay secciones con ese nombre.</p></div>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

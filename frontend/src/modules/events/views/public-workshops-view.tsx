"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { usePublicEvents } from "../hooks/use-public-events";
import { PublicEventsGrid } from "../components/public-events-grid";
import { PublicHeader, PublicFooter, PageHeading } from "@/shared/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function PublicWorkshopsView() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = usePublicEvents({ page, limit: 9, ...(search && {search}) });
  return <div data-app-shell="true" className="flex min-h-dvh flex-col bg-background"><PublicHeader /><main className="mx-auto w-full max-w-browse min-w-0 flex-1 px-4 py-8 sm:px-8 sm:py-12"><PageHeading title="Talleres de la comunidad" description="Consulta las actividades y sus detalles sin iniciar sesión." /><form role="search" aria-label="Buscar talleres" onSubmit={(event) => {event.preventDefault();setSearch(searchInput.trim());setPage(1);}} className="my-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-soft p-4"><Input type="search" aria-label="Nombre del taller" className="w-full sm:max-w-xl sm:min-w-48 sm:flex-1" placeholder="Buscar un taller" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} /><Button type="submit"><Search aria-hidden="true" />Buscar</Button>{search ? <Button variant="outline" type="button" onClick={() => {setSearch("");setSearchInput("");setPage(1);}}>Limpiar</Button> : null}</form>
  {query.data ? <p role="status" className="mb-4 text-sm text-text-secondary">{query.data.data.length} talleres en esta página</p> : null}
  {query.isPending ? <p role="status">Cargando talleres…</p> : query.isError ? <div role="alert"><p className="mb-4 text-text-secondary">No pudimos cargar los talleres. Revisa tu conexión.</p><Button variant="outline" onClick={() => void query.refetch()}>Volver a intentar</Button></div> : query.data.data.length ? <PublicEventsGrid events={query.data.data} showCover /> : <div className="rounded-lg border border-border bg-surface p-10 text-center"><h2 className="text-lg font-semibold">{search ? "No encontramos talleres con ese nombre" : "No hay talleres en esta página"}</h2><p className="mt-2 text-text-secondary">{search ? "Prueba con otro término o limpia la búsqueda." : "Vuelve más adelante para consultar nuevas actividades."}</p></div>}
  <nav aria-label="Páginas de talleres" className="mt-6 flex flex-wrap items-center justify-center gap-2 border-t border-border pt-4 sm:justify-end sm:gap-4"><Button variant="outline" disabled={page === 1 || query.isFetching} onClick={() => setPage(page - 1)}>Anterior</Button><span className="text-sm tabular-nums">Página {page}</span><Button variant="outline" disabled={query.isFetching || !query.data || query.data.data.length < 9} onClick={() => setPage(page + 1)}>Siguiente</Button></nav></main><PublicFooter /></div>;
}

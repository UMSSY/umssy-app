"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isApiError } from "@/shared/services/api-client";
import { useAuth } from "@/shared/contexts/auth-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMentorshipCatalogs } from "../../hooks/use-mentorship-catalogs";
import {
  cancelParticipation, confirmOffer, leaveParticipation, updateParticipationPreferences,
  type ParticipationCapacity, type ParticipationState,
} from "../../services/mentor-participation.service";

const boliviaDate = (value: string) => new Intl.DateTimeFormat("es-BO", {
  timeZone: "America/La_Paz", day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit", hour12: false,
}).format(new Date(value));

function remaining(expiresAt: string, now: number) {
  const milliseconds = Math.max(0, new Date(expiresAt).getTime() - now);
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor(milliseconds % 3_600_000 / 60_000);
  const seconds = Math.floor(milliseconds % 60_000 / 1000);
  return `${hours}h ${minutes}m ${seconds}s restantes`;
}

function errorMessage(error: unknown) {
  if (isApiError(error)) {
    const detail = (error.response?.data as { detail?: string } | undefined)?.detail;
    if (detail) return detail;
  }
  return "No se pudo completar la operación. Inténtalo nuevamente.";
}

type Props = { state: ParticipationState; capacity?: ParticipationCapacity; refresh: () => Promise<void> };

export function MentorParticipationPanel({ state, capacity, refresh }: Props) {
  const { refreshRoles } = useAuth();
  const queryClient = useQueryClient();
  const catalogs = useMentorshipCatalogs();
  const [now, setNow] = useState(() => Date.now());
  const [dialog, setDialog] = useState<"details" | "cancel" | "leave" | null>(null);
  const [offerOpen, setOfferOpen] = useState(state.status === "OFFERED");
  const [busy, setBusy] = useState(false);
  const [futureAppointmentsBlocked, setFutureAppointmentsBlocked] = useState(false);
  const [editing, setEditing] = useState(false);
  const [areas, setAreas] = useState<string[]>(() => state.request?.technicalAreas.map((area) => area.id) ?? []);
  const [orientations, setOrientations] = useState<string[]>(() => state.request?.orientationTypes.map((orientation) => orientation.id) ?? []);
  const request = state.request;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const expiredOnScreen = state.status === "OFFERED" && request?.offer && now >= new Date(request.offer.expiresAt).getTime();
  useEffect(() => {
    if (expiredOnScreen) void refresh();
  }, [expiredOnScreen, refresh]);

  const mutate = async (operation: () => Promise<unknown>, message: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await operation();
      await refreshRoles();
      setDialog(null);
      setOfferOpen(false);
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ["mentor-participation"] });
      await refresh();
      toast.success(message);
    } catch (error) {
      if (isApiError(error) && (error.response?.data as { data?: { code?: string } } | undefined)?.data?.code === "FUTURE_APPOINTMENTS") {
        setFutureAppointmentsBlocked(true);
      }
      toast.error(errorMessage(error));
      await refresh();
    } finally { setBusy(false); }
  };

  const toggle = (values: string[], id: string, setter: (next: string[]) => void) =>
    setter(values.includes(id) ? values.filter((value) => value !== id) : [...values, id]);

  return <main className="min-h-full bg-surface-soft px-4 py-6 sm:py-8">
    <div className="mx-auto max-w-5xl space-y-6">
      {state.status !== "ACTIVE" && <div><h1 className="text-2xl font-semibold text-ink">Mi participación como mentor</h1>
        <p className="mt-2 text-sm text-text-secondary">Consulta tu solicitud y tu lugar en la red de mentorías.</p></div>}
      {capacity && <Card><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6 text-sm">
        <span>Cupos: {capacity.occupied} ocupados de {capacity.capacity}</span>
        <span className="font-semibold text-accent">{capacity.available} disponibles</span>
      </CardContent></Card>}
      {state.sanction && <Card className="border-amber-300 bg-amber-50"><CardContent className="space-y-2 pt-6 text-sm text-amber-950" role="alert">
        <strong>Solicitudes suspendidas temporalmente</strong>
        <p>Se registraron cinco intentos distintos en 24 horas. No puedes enviar nuevas solicitudes para ser mentor hasta el {boliviaDate(state.sanction.expiresAt)} BOT. Te enviamos un aviso al correo institucional.</p>
        <p aria-live="polite">{remaining(state.sanction.expiresAt, now)}</p>
        <p>Puedes consultar y gestionar las solicitudes u ofertas que ya tenías.</p>
      </CardContent></Card>}

      {state.status === "PENDING" && request && <Card>
        <CardHeader><CardTitle>Solicitud pendiente</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>Tu solicitud está en espera. Te avisaremos por correo institucional cuando se libere un cupo.</p>
          <p className="font-medium">Estado de participación · PENDIENTE</p>
          <p>Tu perfil puede aparecer como mentor disponible en el directorio cuando confirmes una oferta.</p>
          <p>Registrada: {boliviaDate(request.requestedAt)} BOT</p>
          <p>Tiempo transcurrido: {Math.floor((now - new Date(request.requestedAt).getTime()) / 3_600_000)} horas</p>
          <p className="max-w-full truncate" title={state.email ?? ""}>Avisos a: {state.email}</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setDialog("details")}>Ver más detalles</Button>
            <Button variant="outline" onClick={() => {
              setAreas(request.technicalAreas.map((area) => area.id));
              setOrientations(request.orientationTypes.map((orientation) => orientation.id));
              setEditing((value) => !value);
            }}>Corregir preferencias</Button>
            <Button variant="destructive" onClick={() => setDialog("cancel")}>Cancelar solicitud</Button>
          </div>
        </CardContent>
      </Card>}

      {state.status === "PENDING" && request && <Card><CardContent className="space-y-4 pt-6 text-sm">
        <section><h2 className="mb-2 font-semibold">Áreas técnicas</h2><div className="flex flex-wrap gap-2">{request.technicalAreas.map((area) => <span key={area.id} className="rounded bg-muted px-2 py-1">{area.name}</span>)}</div></section>
        <section><h2 className="mb-2 font-semibold">Tipos de orientación</h2><div className="flex flex-wrap gap-2">{request.orientationTypes.map((orientation) => <span key={orientation.id} className="rounded bg-muted px-2 py-1">{orientation.name}</span>)}</div></section>
      </CardContent></Card>}

      {editing && state.status === "PENDING" && <Card><CardHeader><CardTitle>Preferencias de mentoría</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <fieldset><legend className="mb-2 font-semibold">Áreas técnicas</legend><div className="flex flex-wrap gap-2">{catalogs.technicalAreas.map((area) => <label key={area.id} className="flex items-center gap-2 rounded border border-border px-3 py-2"><Checkbox disabled={busy} checked={areas.includes(area.id)} onCheckedChange={() => toggle(areas, area.id, setAreas)} /> {area.name}</label>)}</div></fieldset>
          <fieldset><legend className="mb-2 font-semibold">Tipos de orientación</legend><div className="flex flex-wrap gap-2">{catalogs.orientationTypes.map((orientation) => <label key={orientation.id} className="flex items-center gap-2 rounded border border-border px-3 py-2"><Checkbox disabled={busy} checked={orientations.includes(orientation.id)} onCheckedChange={() => toggle(orientations, orientation.id, setOrientations)} /> {orientation.name}</label>)}</div></fieldset>
          <Button disabled={busy || !areas.length || !orientations.length} onClick={() => void mutate(() => updateParticipationPreferences({ technicalAreaIds: areas, orientationTypeIds: orientations }), "Preferencias guardadas")}>Guardar preferencias</Button>
        </CardContent></Card>}

      {state.status === "OFFERED" && request?.offer && !expiredOnScreen && <Card>
        <CardHeader><CardTitle>¡Tienes un cupo disponible!</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>El cupo se reservó para ti durante 24 horas desde la asignación.</p>
          <p>Plazo para confirmar: <strong>{boliviaDate(request.offer.expiresAt)} BOT</strong></p>
          <p aria-live="polite" className="text-lg font-semibold text-accent">{remaining(request.offer.expiresAt, now)}</p>
          <p className="truncate" title={state.email ?? ""}>Avisos a: {state.email}</p>
          <div className="flex flex-wrap gap-3"><Button onClick={() => setOfferOpen(true)}>Ver oferta</Button>
            <Button variant="destructive" onClick={() => setDialog("cancel")}>Cancelar solicitud</Button></div>
        </CardContent></Card>}

      {(state.status === "EXPIRED" || expiredOnScreen) && <Card><CardHeader><CardTitle>El plazo venció</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm"><p>La oferta y la solicitud anterior quedaron cerradas. Puedes crear una solicitud nueva; entrarás al final de la cola.</p>
          {!state.sanction && <Link className={buttonVariants()} href="/mentorship">Solicitar nuevamente</Link>}</CardContent></Card>}

      {["NONE", "CANCELLED", "LEFT"].includes(state.status) && <Card><CardHeader><CardTitle>Participa como mentor</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm"><p>Completa el formulario para elegir tus áreas técnicas y tipos de orientación.</p>
          {!state.sanction && <Link className={buttonVariants()} href="/mentorship">Participa como mentor</Link>}</CardContent></Card>}

      {state.status === "ACTIVE" && <Card><CardHeader><CardTitle>Tu participación como mentor está activa</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm"><p>Puedes aparecer en el directorio según tu configuración.</p>
          {request && <><p>Áreas técnicas: {request.technicalAreas.map((item) => item.name).join(", ")}</p>
          <p>Tipos de orientación: {request.orientationTypes.map((item) => item.name).join(", ")}</p></>}
          <div className="flex flex-wrap gap-3"><Link className={buttonVariants()} href="/mentorship/mentors">Ir al directorio</Link>
            <Button variant="outline" onClick={() => { setFutureAppointmentsBlocked(false); setDialog("leave"); }}>Pausar mentoría</Button></div>
          {futureAppointmentsBlocked && <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
            Resuelve tus citas futuras pendientes o confirmadas antes de pausar la mentoría. <Link className="underline" href="/mentor/availability">Mis citas (agenda)</Link>
          </div>}
        </CardContent></Card>}

      <AlertDialog open={dialog !== null} onOpenChange={(open) => { if (!open && !busy) setDialog(null); }}>
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <AlertDialogHeader><AlertDialogTitle>{dialog === "details" ? "Estado: Pendiente" : dialog === "cancel" ? "¿Cancelar solicitud de cupo?" : "¿Pausar mentoría?"}</AlertDialogTitle>
            <AlertDialogDescription>{dialog === "cancel" ? "¿Estás seguro de que deseas cancelar tu solicitud para participar como mentor?" : dialog === "leave" ? "Dejarás de ser mentor, perderás el rol y tu cupo se liberará. Al volver deberás pasar el control del 40% y, si no hay cupo, entrarás al final de la lista FIFO. Primero debes resolver las citas futuras pendientes o confirmadas." : "Consulta los datos guardados de tu solicitud."}</AlertDialogDescription></AlertDialogHeader>
          {dialog === "cancel" && <div className="rounded-md bg-muted p-3 text-sm"><strong>Información importante</strong><p>Si cancelas tu solicitud, perderás tu lugar en la lista de espera FIFO. Si decides solicitar nuevamente un cupo, ingresarás al final de la cola.</p></div>}
          {dialog === "details" && request && <div className="space-y-2 text-sm"><p>Fecha original: {boliviaDate(request.requestedAt)} BOT</p>
            <p>Tiempo transcurrido: {Math.floor((now - new Date(request.requestedAt).getTime()) / 3_600_000)} horas</p>
            <p>Áreas: {request.technicalAreas.map((item) => item.name).join(", ")}</p>
            <p>Orientaciones: {request.orientationTypes.map((item) => item.name).join(", ")}</p>
            <p className="truncate" title={state.email ?? ""}>Correo: {state.email}</p></div>}
          <AlertDialogFooter><AlertDialogCancel disabled={busy}>{dialog === "details" ? "Cerrar" : "Volver"}</AlertDialogCancel>
            {dialog !== "details" && <AlertDialogAction variant={dialog === "cancel" ? "destructive" : "default"} disabled={busy} onClick={() => {
              if (dialog === "cancel") void mutate(cancelParticipation, "Solicitud cancelada");
              if (dialog === "leave") void mutate(leaveParticipation, "Has pausado tu mentoría y liberado el cupo");
            }}>{busy ? "Procesando..." : dialog === "cancel" ? "Confirmar cancelación" : "Pausar mentoría"}</AlertDialogAction>}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={offerOpen && state.status === "OFFERED" && !Boolean(expiredOnScreen)} onOpenChange={(open) => { if (!busy) setOfferOpen(open); }}>
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <AlertDialogHeader><AlertDialogTitle>¡Tienes un cupo disponible!</AlertDialogTitle>
            <AlertDialogDescription>Se ha liberado un cupo para ti. Tienes 24 horas para confirmar tu participación en el programa oficial de mentores.</AlertDialogDescription></AlertDialogHeader>
          {request?.offer && <div className="space-y-3 text-sm">
            <div className="rounded-md bg-red-50 p-3 text-red-900"><strong>Plazo de confirmación (24 horas)</strong><p aria-live="polite">{remaining(request.offer.expiresAt, now)}</p><p>Fecha y hora límite: {boliviaDate(request.offer.expiresAt)} BOT</p></div>
            <div className="rounded-md bg-emerald-50 p-3 text-emerald-900"><strong>Continuidad del proceso</strong><p>Al pulsar Confirmar participación se validará tu plazo y se aplicará la activación directa como mentor en la configuración ya realizada.</p></div>
            <div className="rounded-md bg-muted p-3"><strong>En caso de expiración</strong><p>Si no confirmas dentro de las 24 horas, el cupo se liberará y podrás registrar una nueva solicitud para ingresar al siguiente ciclo de rotación FIFO.</p></div>
          </div>}
          <AlertDialogFooter><AlertDialogCancel disabled={busy}>Volver</AlertDialogCancel>
            <AlertDialogAction disabled={busy || !request?.offer} onClick={() => { if (request?.offer) void mutate(() => confirmOffer(request.offer!.id), "Participación activada"); }}>{busy ? "Confirmando..." : "Confirmar participación"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </main>;
}

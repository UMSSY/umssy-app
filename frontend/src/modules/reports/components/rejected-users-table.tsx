import { FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/shared/utils/date.utils";
import { USER_DOCUMENT_LABELS } from "../constants/registered-users.constants";
import type { RejectedUser } from "../types/rejected-user.types";
import { TableScrollHint } from "./table-scroll-hint";
import { TableMessageRow, TableNoResultsRow, TableSkeletonRows } from "./table-state-rows";

interface RejectedUsersTableProps {
  users: RejectedUser[];
  isLoading: boolean;
  errorMessage?: string;
  searchTerm?: string;
}

const COLUMN_COUNT = 5;
const CONTAINER_CLASSES = "@container min-h-151 rounded-lg border border-border bg-surface";
const HEAD_CLASSES = "h-auto px-6 py-3 font-semibold text-ink";
const CELL_CLASSES = "px-6 py-4 text-ink-soft";

export function RejectedUsersTable({ users, isLoading, errorMessage, searchTerm = "" }: RejectedUsersTableProps) {
  const renderBody = () => {
    if (isLoading) {
      return <TableSkeletonRows columnCount={COLUMN_COUNT} />;
    }

    if (errorMessage) {
      return <TableMessageRow columnCount={COLUMN_COUNT} message={errorMessage} />;
    }

    if (users.length === 0 && searchTerm) {
      return <TableNoResultsRow columnCount={COLUMN_COUNT} message="No se encontró ningún usuario con el correo" />;
    }

    if (users.length === 0) {
      return <TableMessageRow columnCount={COLUMN_COUNT} message="No hay usuarios rechazados." />;
    }

    return users.map((user) => (
      <TableRow key={user.id} className="border-border hover:bg-surface-soft">
        <TableCell className={`${CELL_CLASSES} text-ink`}>{user.fullName}</TableCell>
        <TableCell className={CELL_CLASSES}>{user.email}</TableCell>
        <TableCell className={`${CELL_CLASSES} tabular-nums`}>{user.identifier}</TableCell>
        <TableCell className={CELL_CLASSES}>
          <span className="flex items-center gap-2">
            <FileText className="size-5 shrink-0 text-ink" strokeWidth={1.5} aria-hidden="true" />
            {USER_DOCUMENT_LABELS[user.documentType]}
          </span>
        </TableCell>
        <TableCell className={CELL_CLASSES}>{formatDate(user.registeredAt)}</TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="flex flex-col gap-2">
      <TableScrollHint />
      <div className={CONTAINER_CLASSES}>
        <Table className="min-w-200 text-left text-base">
          <TableHeader className="bg-surface-soft">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead scope="col" className={HEAD_CLASSES}>Usuario</TableHead>
              <TableHead scope="col" className={HEAD_CLASSES}>Correo</TableHead>
              <TableHead scope="col" className={HEAD_CLASSES}>Identificador</TableHead>
              <TableHead scope="col" className={HEAD_CLASSES}>Documento</TableHead>
              <TableHead scope="col" className={HEAD_CLASSES}>Fecha de Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody aria-busy={isLoading}>{renderBody()}</TableBody>
        </Table>
      </div>
    </div>
  );
}

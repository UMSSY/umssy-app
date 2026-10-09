import { FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/shared/utils/date.utils";
import { USER_DOCUMENT_LABELS, USER_TYPE_LABELS } from "../constants/registered-users.constants";
import type { RegisteredUser } from "../types/registered-user.types";
import { TableMessageRow, TableSkeletonRows } from "./table-state-rows";

interface RegisteredUsersTableProps {
  users: RegisteredUser[];
  isLoading: boolean;
  errorMessage?: string;
}

const COLUMN_COUNT = 6;
const HEAD_CLASSES = "h-auto px-6 py-3 font-semibold text-ink";
const CELL_CLASSES = "px-6 py-4 text-ink-soft";

export function RegisteredUsersTable({ users, isLoading, errorMessage }: RegisteredUsersTableProps) {
  const renderBody = () => {
    if (isLoading) {
      return <TableSkeletonRows columnCount={COLUMN_COUNT} />;
    }

    if (errorMessage) {
      return <TableMessageRow columnCount={COLUMN_COUNT} message={errorMessage} />;
    }

    if (users.length === 0) {
      return <TableMessageRow columnCount={COLUMN_COUNT} message="No hay usuarios registrados para este filtro." />;
    }

    return users.map((user) => (
      <TableRow key={user.id} className="border-border hover:bg-surface-soft">
        <TableCell className={`${CELL_CLASSES} text-ink`}>{user.fullName}</TableCell>
        <TableCell className={CELL_CLASSES}>{user.email}</TableCell>
        <TableCell className={CELL_CLASSES}>{USER_TYPE_LABELS[user.userType]}</TableCell>
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
    <div className="@container rounded-lg border border-border bg-surface">
      <Table className="min-w-225 text-left text-base">
        <TableHeader className="bg-surface-soft">
          <TableRow className="border-border hover:bg-transparent">
            <TableHead scope="col" className={HEAD_CLASSES}>Usuario</TableHead>
            <TableHead scope="col" className={HEAD_CLASSES}>Correo</TableHead>
            <TableHead scope="col" className={HEAD_CLASSES}>Tipo de Usuario</TableHead>
            <TableHead scope="col" className={HEAD_CLASSES}>Identificador</TableHead>
            <TableHead scope="col" className={HEAD_CLASSES}>Documento</TableHead>
            <TableHead scope="col" className={HEAD_CLASSES}>Fecha de Registro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody aria-busy={isLoading}>{renderBody()}</TableBody>
      </Table>
    </div>
  );
}

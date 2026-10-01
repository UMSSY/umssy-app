import React from "react";

export function UsersReportTable() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-surface shadow-xs mt-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-surface-soft">
              <th className="py-3 px-4 text-[12.5px] font-semibold text-ink whitespace-nowrap">
                Usuario
              </th>
              <th className="py-3 px-4 text-[12.5px] font-semibold text-ink whitespace-nowrap">
                Correo
              </th>
              <th className="py-3 px-4 text-[12.5px] font-semibold text-ink whitespace-nowrap">
                Tipo de Usuario
              </th>
              <th className="py-3 px-4 text-[12.5px] font-semibold text-ink whitespace-nowrap">
                Identificador
              </th>
              <th className="py-3 px-4 text-[12.5px] font-semibold text-ink whitespace-nowrap">
                Documento
              </th>
              <th className="py-3 px-4 text-[12.5px] font-semibold text-ink whitespace-nowrap">
                Fecha de Registro
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td
                colSpan={6}
                className="py-12 text-center text-[13.5px] text-text-secondary font-sans"
              >
                No hay usuarios registrados para mostrar.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

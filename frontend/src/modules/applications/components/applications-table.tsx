import React from 'react';
import { Button } from '@/components/ui/button'; // O la ruta de importación de Button que use el proyecto
import { Application } from '../types/application.types';

interface Props {
  applications: Application[];
  onWithdraw: (id: string) => void;
}

export const ApplicationsTable: React.FC<Props> = ({ applications, onWithdraw }) => {
  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b bg-gray-50 text-sm text-gray-700">
            <th className="p-4">Vacante</th>
            <th className="p-4">Empresa</th>
            <th className="p-4">Afinidad</th>
            <th className="p-4">Estado</th>
            <th className="p-4">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className="border-b text-sm hover:bg-gray-50">
              <td className="p-4 font-medium text-gray-900">{app.vacancyTitle}</td>
              <td className="p-4 text-gray-600">{app.companyName}</td>
              <td className="p-4 text-gray-600">{app.affinityPercentage}%</td>
              <td className="p-4">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {app.status}
                </span>
              </td>
              <td className="p-4">
                {(app.status === 'En revisión' || app.status === 'Entrevista') ? (
                  <Button
                    onClick={() => onWithdraw(app.id)}
                    variant="destructive"
                    size="sm"
                  >
                    Retirar
                  </Button>
                ) : (
                  <span className="text-xs text-gray-400">No disponible</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
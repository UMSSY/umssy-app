import React, { useState } from 'react';
import Link from 'next/link';
import { Application } from '../types/application.types';
import { ApplicationsTable } from '../components/applications-table';

export const ApplicationsView = () => {
  const [applications, setApplications] = useState<Application[]>([
    {
      id: '1',
      vacancyTitle: 'Desarrollador Backend Python / FastAPI',
      companyName: 'TechBolivia S.R.L.',
      affinityPercentage: 92,
      status: 'En revisión',
      appliedDate: '2026-10-20'
    }
  ]);

  const handleWithdraw = (id: string) => {
    setApplications(applications.filter(app => app.id !== id));
  };

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="mb-4 text-gray-600">Todavía no te postulaste a ninguna vacante</p>
        <Link
          href="/vacancies"
          className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          Explorar vacantes
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Mis postulaciones</h1>
      <ApplicationsTable applications={applications} onWithdraw={handleWithdraw} />
    </div>
  );
};
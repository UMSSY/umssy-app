'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWorkExperiences } from '@/modules/work-experience';
import { useEducations } from '@/modules/education';
import { useCertifications } from '@/modules/certifications';
import type { AreaId } from '../types/area-detail.types';
import { useRadarEvidenceFiles } from '../hooks/use-radar-evidence-files';
import { RADAR_AXIS_NAMES } from '../constants/radar-axis-names.constants';
import type { RadarBridgeView } from '../types/radar-bridge.types';
import { RadarAreaDetailsDialog } from './radar-area-details-dialog';
import type { AreaEvidenceDetails } from '../types/radar-evidence-details.types';

interface Props {
  radar: RadarBridgeView;
  selected: AreaId;
  onClose: () => void;
}

const year = (date: string): number | null => {
  const n = Number(date?.slice(0, 4));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const duration = (start: string, end: string | null): string => {
  const a = new Date(start).getTime();
  const b = end ? new Date(end).getTime() : Date.now();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 'Duración no disponible';
  const months = Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24 * 30.4375)));
  return months >= 12
    ? `${(months / 12).toLocaleString('es-BO', { maximumFractionDigits: 1 })} año(s)`
    : `${months} mes(es)`;
};

export function RadarEvidencePanel({ radar, selected, onClose }: Props) {
  const work = useWorkExperiences();
  const education = useEducations();
  const certifications = useCertifications();
  const { getFile } = useRadarEvidenceFiles();
  const [fileError, setFileError] = useState('');

  const loading = work.isLoading || education.isLoading || certifications.isLoading;
  const error = fileError || (work.error || education.error || certifications.error
    ? 'Algunos documentos no pudieron consultarse.' : '');

  const relevant = useMemo(
    () => radar.approved.filter(skill => skill.areaId === selected),
    [radar.approved, selected],
  );
  const refs = useMemo(
    () => new Set(relevant.flatMap(skill => skill.evidenceRefs.map(ref => `${ref.type}:${ref.id}`))),
    [relevant],
  );
  const cvRefs = [...refs].filter(ref => ref.startsWith('cv:')).map(ref => ref.slice(3));

  const evidence: AreaEvidenceDetails = {
    education: education.educations
      .filter(item => refs.has(`education:${item.id}`))
      .map(item => ({ id: item.id, degree: item.degree, institution: item.institution,
        year: year(item.startDate), description: item.description })),
    certifications: certifications.certifications
      .filter(item => refs.has(`certification:${item.id}`))
      .map(item => ({ id: item.id, name: item.name, issuer: item.issuingOrganization,
        year: year(item.issueDate) })),
    experiences: work.experiences
      .filter(item => refs.has(`work-experience:${item.id}`))
      .map(item => ({ id: item.id, position: item.position, companyName: item.companyName,
        duration: duration(item.startDate, item.endDate), description: item.description })),
    tags: [...new Set(relevant.map(skill => skill.name))],
  };

  const score = radar.areas.find(area => area.id === selected)?.score ?? 0;
  const ranking = [...radar.areas].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const position = ranking.findIndex(area => area.id === selected) + 1;
  const label = RADAR_AXIS_NAMES.find(area => area.id === selected)?.name ?? selected;
  const attachments = certifications.certifications.filter(
    cert => cert.hasDocument && refs.has(`certification:${cert.id}`),
  );

  async function openDocument(id: string, kind: 'cv' | 'certification') {
    const target = window.open('about:blank', '_blank');
    if (target) target.opener = null;
    setFileError('');
    try {
      const blob = await getFile(kind, id);
      if (!blob) throw new Error('Documento no disponible');
      const url = URL.createObjectURL(blob);
      if (target) {
        target.location.href = url;
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = kind === 'cv' ? 'curriculum.pdf' : 'respaldo';
        link.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      target?.close();
      setFileError('No se pudo abrir el documento relacionado.');
    }
  }

  const reload = () => {
    setFileError('');
    void Promise.allSettled([work.reload(), education.reload(), certifications.reload()]);
  };

  return (
    <RadarAreaDetailsDialog
      areaName={label}
      position={position}
      score={score}
      globalAverage={radar.average}
      evidence={evidence}
      loading={loading}
      error={error}
      onRetry={reload}
      onClose={onClose}
      subtitle="Información aprobada asociada a la puntuación publicada"
      footer={
        <div className="flex flex-col gap-2">
          {cvRefs.map(id => (
            <Button key={id} variant="outline" size="sm" onClick={() => void openDocument(id, 'cv')}>
              Abrir CV relacionado
            </Button>
          ))}
          {attachments.map(cert => (
            <Button key={cert.id} variant="outline" size="sm"
              onClick={() => void openDocument(cert.id, 'certification')}>
              Abrir respaldo de {cert.name}
            </Button>
          ))}
        </div>
      }
    />
  );
}

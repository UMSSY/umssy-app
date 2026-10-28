'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getInitials } from '../utils/date-formatter';
import type { UserSummary } from '../types/conversation.types';

export interface ContactProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: UserSummary | null;
}

export function ContactProfileModal({
  isOpen,
  onClose,
  contact,
}: ContactProfileModalProps) {
  if (!contact) {
    return null;
  }

  const roleDisplay = contact.roleName || (contact.role ? String(contact.role) : null);
  const showEmail = contact.isEmailVisible !== false && Boolean(contact.email);
  const showAcademicTitle =
    contact.isAcademicTitleVisible !== false && Boolean(contact.academicTitle);
  const showSkills =
    contact.areSkillsVisible !== false &&
    Array.isArray(contact.skills) &&
    contact.skills.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        data-testid="contact-profile-modal"
        className="w-full max-w-md overflow-hidden p-0"
      >
        <DialogHeader className="border-b border-[#E3E7EC] bg-slate-50/70 px-5 py-3.5">
          <DialogTitle
            data-testid="contact-profile-modal-title"
            className="text-xs font-semibold tracking-wider text-[#5B6470] uppercase"
          >
            PERFIL DE CONTACTO
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-5 text-xs text-[#0B1F2E]">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {contact.avatarUrl ? (
                <Image
                  src={contact.avatarUrl}
                  alt={contact.fullName}
                  width={64}
                  height={64}
                  unoptimized
                  data-testid="contact-profile-avatar-img"
                  className="size-16 rounded-full border-2 border-[#E3E7EC] object-cover shadow-xs"
                />
              ) : (
                <div
                  data-testid="contact-profile-avatar-initials"
                  className="flex size-16 items-center justify-center rounded-full border-2 border-[#E3E7EC] bg-slate-200 text-lg font-bold text-[#0B1F2E] shadow-xs"
                >
                  {getInitials(contact.fullName)}
                </div>
              )}
              {contact.isOnline && (
                <span
                  data-testid="contact-profile-online-badge"
                  className="absolute right-0 bottom-0 size-3.5 rounded-full border-2 border-white bg-emerald-500"
                  title="En línea"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4
                data-testid="contact-profile-name"
                className="truncate text-base font-bold text-[#0B1F2E]"
              >
                {contact.fullName}
              </h4>

              {roleDisplay && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    data-testid="contact-profile-role"
                    className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700"
                  >
                    {roleDisplay}
                  </span>
                </div>
              )}

              <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>{contact.isOnline ? 'En línea' : 'Desconectado'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {showEmail && (
              <div
                data-testid="section-contact-info"
                className="space-y-1.5"
              >
                <span className="text-[10px] font-bold tracking-wider text-[#5B6470] uppercase">
                  INFORMACIÓN DE CONTACTO
                </span>
                <div className="rounded-lg border border-[#E3E7EC] bg-slate-50 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Correo:</span>
                    <span
                      data-testid="contact-profile-email"
                      className="font-medium text-[#0B1F2E]"
                    >
                      {contact.email}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {showAcademicTitle && (
              <div
                data-testid="section-academic-background"
                className="space-y-1.5"
              >
                <span className="text-[10px] font-bold tracking-wider text-[#5B6470] uppercase">
                  FORMACIÓN ACADÉMICA
                </span>
                <div className="rounded-lg border border-[#E3E7EC] bg-slate-50 p-2.5">
                  <span
                    data-testid="contact-profile-academic-title"
                    className="font-semibold text-[#0B1F2E]"
                  >
                    {contact.academicTitle}
                  </span>
                </div>
              </div>
            )}

            {showSkills && (
              <div
                data-testid="section-skills"
                className="space-y-1.5"
              >
                <span className="text-[10px] font-bold tracking-wider text-[#5B6470] uppercase">
                  COMPETENCIAS TÉCNICAS
                </span>
                <div
                  data-testid="contact-profile-skills-list"
                  className="flex flex-wrap gap-1"
                >
                  {contact.skills?.map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-[#E3E7EC] bg-slate-50 px-5 py-3">
          <Button
            type="button"
            variant="outline"
            size="default"
            data-testid="contact-profile-close-button"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

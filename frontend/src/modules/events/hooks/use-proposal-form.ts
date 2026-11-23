'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/modules/profile';
import { getAccessToken, subscribeAccessToken } from '@/shared/services/storage/access-token-storage';
import { useEventCategories } from '@/modules/event-categories';
import { EMPTY_PROPOSAL } from '../constants/proposal.constants';
import { useCreateProposal } from './use-create-proposal';
import { proposalDraftStorage } from '../services/proposal-draft-storage';
import { readProposalCover } from '../utils/read-proposal-cover';
import { validateProposal } from '../utils/proposal-validation';
import type { CreatedProposal, ProposalCover, ProposalValues } from '../types/proposal.types';

export function useProposalForm() {
  const token = useSyncExternalStore(subscribeAccessToken, getAccessToken, () => null);
  const categories = useEventCategories();
  const profile = useQuery({ queryKey: ['session-profile', token], queryFn: () => profileService.getProfile(), enabled: Boolean(token), retry: false });
  const tutor = [profile.data?.firstName, profile.data?.lastName].filter(Boolean).join(' ').trim();
  const [values, setValues] = useState<ProposalValues>({ ...EMPTY_PROPOSAL });
  const locations = useRef({ presencial: '', virtual: '' });
  const activeModality = useRef<ProposalValues['modality']>(EMPTY_PROPOSAL.modality);
  const [cover, setCover] = useState<ProposalCover | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [reviewing, setReviewing] = useState(false);
  const creation = useCreateProposal(token, () => setReviewing(false));
  const pending = creation.isPending;
  const message = creation.failure?.message ?? null;
  const serverErrors = creation.failure?.fields ?? {};
  const [created, setCreated] = useState<CreatedProposal | null>(null);
  const operation = useRef<{ key: string; token: string | null } | null>(null);
  const sending = useRef(false);
  const draftCompleted = useRef(false);
  const [draftOwner, setDraftOwner] = useState<string | null>(null);
  const [draftWarning, setDraftWarning] = useState<string | null>(null);
  const owner = token ? profile.data?.id ?? null : null;
  useEffect(() => {
    if (!owner) return;
    let cancelled = false;
    void proposalDraftStorage.read(owner).then(async (draft) => {
      const restoredCover = draft?.file ? await readProposalCover(draft.file) : null;
      if (cancelled) { if (restoredCover) URL.revokeObjectURL(restoredCover.previewUrl); return; }
      locations.current = { presencial: '', virtual: '', ...draft?.locations };
      activeModality.current = draft?.values.modality ?? EMPTY_PROPOSAL.modality;
      locations.current[activeModality.current] = draft?.values.location ?? '';
      setReviewing(false); setValues(draft?.values ?? { ...EMPTY_PROPOSAL }); setCover(restoredCover);
      operation.current = draft?.operationKey ? { key: draft.operationKey, token } : null;
    }).catch(() => { if (!cancelled) setDraftWarning('No se pudo recuperar el borrador guardado en este navegador.'); })
      .finally(() => { if (!cancelled) setDraftOwner(owner); });
    return () => { cancelled = true; };
  }, [owner, token]);
  useEffect(() => {
    if (!owner || draftOwner !== owner || created || draftCompleted.current) return;
    const hasContent = Boolean(locations.current.presencial || locations.current.virtual) || Boolean(cover) || Object.keys(EMPTY_PROPOSAL).some(key => values[key as keyof ProposalValues] !== EMPTY_PROPOSAL[key as keyof ProposalValues]);
    const saving = hasContent
      ? proposalDraftStorage.save(owner, { values, locations: { ...locations.current }, file: cover?.file ?? null, operationKey: operation.current?.key ?? null })
      : proposalDraftStorage.remove(owner);
    void saving
      .catch(() => setDraftWarning('No se pudo guardar el borrador en este navegador. Mantén esta página abierta para conservarlo.'));
  }, [owner, draftOwner, values, cover, pending, created]);
  useEffect(() => () => { if (cover) URL.revokeObjectURL(cover.previewUrl); }, [cover]);

  const validation = validateProposal(values, cover?.file ?? null, categories.categories.map(({ id }) => id));
  const errors = { ...Object.fromEntries(Object.entries(validation).filter(([key]) => submitted || (key !== 'cover' && touched[key] && Boolean(values[key as keyof ProposalValues]?.trim())))), ...serverErrors };
  function touch(key: string) { if (key === 'cover') return; setTouched(previous => ({ ...previous, [key]: true })); }
  const unavailable = !token || !tutor || profile.isError || categories.isLoading || Boolean(categories.error) || !categories.categories.length || Boolean(owner && draftOwner !== owner);

  function edit() { draftCompleted.current = false; operation.current = null; creation.reset(); setCreated(null); }
  function change<K extends keyof ProposalValues>(key: K, value: ProposalValues[K]) {
    if (sending.current) return;
    edit();
    if (key === 'location') locations.current[activeModality.current] = value;
    if (key === 'modality') {
      const modality = value as ProposalValues['modality'];
      activeModality.current = modality;
      const location = locations.current[modality];
      setTouched(previous => ({ ...previous, location: false }));
      setValues(previous => ({ ...previous, modality, location }));
    } else setValues(previous => ({ ...previous, [key]: value }));
  }
  function changeCover(next: ProposalCover | null) { edit(); setCover(next); }
  function review() {
    setSubmitted(true); creation.reset();
    if (unavailable || coverBusy || Object.keys(validation).length) return false;
    setReviewing(true); return true;
  }
  async function confirm() {
    if (sending.current || unavailable || coverBusy || !cover || Object.keys(validation).length) return;
    sending.current = true; creation.reset();
    if (!operation.current || operation.current.token !== token) operation.current = { key: crypto.randomUUID(), token };
    try {
      const result = await creation.mutateAsync({ values, cover: cover.file, operationKey: operation.current.key, accessToken: token });
      if (getAccessToken() !== token) return;
      draftCompleted.current = true;
      if (owner) await proposalDraftStorage.remove(owner).catch(() => setDraftWarning('La propuesta se guardó, pero no se pudo limpiar el borrador local.'));
      locations.current = { presencial: '', virtual: '' }; activeModality.current = EMPTY_PROPOSAL.modality;
      setCreated(result); setReviewing(false); setValues({ ...EMPTY_PROPOSAL }); setCover(null); setSubmitted(false); setTouched({}); operation.current = null;
    } catch {
      return;
    } finally { sending.current = false; }
  }
  return { values, cover, touch, change, changeCover, coverBusy, setCoverBusy, errors, categories, profile, tutor,
    draftWarning, restoring: Boolean(owner && draftOwner !== owner), reviewing, closeReview: () => { if (!sending.current) setReviewing(false); }, review, confirm, pending, unavailable, message, created };
}
